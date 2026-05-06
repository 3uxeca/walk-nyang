import { DEFAULT_NICKNAME } from '../game/SaveSystem'

const STYLE_ID = 'walk3d-hud-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    @keyframes hud-pop {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.12); }
      100% { transform: scale(1); }
    }
    .w3d-hud {
      position: fixed;
      top: 16px;
      left: 16px;
      background: rgba(255,248,238,0.90);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 2.5px solid #FF8C42;
      border-radius: 20px;
      padding: 10px 16px 10px 14px;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      pointer-events: none;
      box-shadow: 0 4px 18px rgba(255,140,66,0.18), 0 1px 4px rgba(0,0,0,0.08);
      min-width: 200px;
      z-index: 100;
    }
    .w3d-hud-row {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .w3d-hud-row + .w3d-hud-row {
      margin-top: 6px;
    }
    .w3d-hud-icon {
      font-size: 18px;
      line-height: 1;
      flex-shrink: 0;
    }
    .w3d-hud-count {
      font-size: 15px;
      font-weight: 800;
      color: #4a3728;
      white-space: nowrap;
    }
    .w3d-hud-bar-bg {
      flex: 1;
      height: 10px;
      background: #ffe0c0;
      border-radius: 10px;
      overflow: hidden;
      min-width: 60px;
    }
    .w3d-hud-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #FF8C42 0%, #FFD166 100%);
      border-radius: 10px;
      transition: width 0.45s cubic-bezier(.34,1.56,.64,1);
    }
    .w3d-hud-region {
      font-size: 12.5px;
      font-weight: 700;
      color: #7c5c3a;
      white-space: nowrap;
    }
    .w3d-hud-nickname {
      font-size: 13px;
      font-weight: 800;
      color: #4a3728;
      white-space: nowrap;
      flex: 1;
    }
    .w3d-hud-edit-btn {
      pointer-events: auto;
      background: #FF8C42;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 12px;
      line-height: 1;
      padding: 3px 6px;
      cursor: pointer;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      transition: background 0.08s ease, transform 0.08s ease;
      flex-shrink: 0;
    }
    .w3d-hud-edit-btn:active {
      transform: scale(0.92);
      background: #e07030;
    }
    .w3d-hud-specialty-count {
      font-size: 12px;
      font-weight: 700;
      color: #7c5c3a;
      white-space: nowrap;
    }
    .w3d-hud-pop {
      animation: hud-pop 0.35s ease;
    }
  `
  document.head.appendChild(s)
}

export interface HUDOptions {
  onEditNickname?: () => void
}

export class HUD {
  private el: HTMLDivElement
  private countEl: HTMLSpanElement
  private barFill: HTMLDivElement
  private regionEl: HTMLSpanElement
  private regionIcon: HTMLSpanElement
  private specialtyIcon: HTMLSpanElement
  private nicknameEl: HTMLSpanElement
  private editBtn: HTMLButtonElement
  private specialtyCountEl: HTMLSpanElement
  private lastCollected = 0

  constructor(opts: HUDOptions = {}) {
    injectStyles()

    this.el = document.createElement('div')
    this.el.className = 'w3d-hud'

    // row0: 고양이 닉네임 + 편집 버튼
    const row0 = document.createElement('div')
    row0.className = 'w3d-hud-row'

    const catIcon = document.createElement('span')
    catIcon.className = 'w3d-hud-icon'
    catIcon.textContent = '🐱'

    this.nicknameEl = document.createElement('span')
    this.nicknameEl.className = 'w3d-hud-nickname'
    this.nicknameEl.textContent = DEFAULT_NICKNAME

    this.editBtn = document.createElement('button')
    this.editBtn.className = 'w3d-hud-edit-btn'
    this.editBtn.type = 'button'
    this.editBtn.textContent = '✏️'
    this.editBtn.setAttribute('aria-label', '닉네임 편집')
    this.editBtn.addEventListener('click', () => opts.onEditNickname?.())
    this.editBtn.addEventListener('touchend', (e) => {
      e.preventDefault()
      opts.onEditNickname?.()
    })

    row0.append(catIcon, this.nicknameEl, this.editBtn)

    // row1: 발자국 + 수집 카운트 + 진행 바
    const row1 = document.createElement('div')
    row1.className = 'w3d-hud-row'

    const icon1 = document.createElement('span')
    icon1.className = 'w3d-hud-icon'
    icon1.textContent = '🐾'

    this.countEl = document.createElement('span')
    this.countEl.className = 'w3d-hud-count'
    this.countEl.textContent = '0 / 20'

    const barBg = document.createElement('div')
    barBg.className = 'w3d-hud-bar-bg'
    this.barFill = document.createElement('div')
    this.barFill.className = 'w3d-hud-bar-fill'
    this.barFill.style.width = '0%'
    barBg.appendChild(this.barFill)

    row1.append(icon1, this.countEl, barBg)

    // row2: 지역명 + 특산품 이모지 + n/T 카운트
    const row2 = document.createElement('div')
    row2.className = 'w3d-hud-row'

    this.regionIcon = document.createElement('span')
    this.regionIcon.className = 'w3d-hud-icon'
    this.regionIcon.style.fontSize = '14px'
    this.regionIcon.textContent = '🌿'

    this.regionEl = document.createElement('span')
    this.regionEl.className = 'w3d-hud-region'

    // 특산품 힌트 — 지역명 옆에 작은 이모지로 상시 노출. 값이 없으면 빈 텍스트.
    this.specialtyIcon = document.createElement('span')
    this.specialtyIcon.className = 'w3d-hud-icon'
    this.specialtyIcon.style.fontSize = '14px'
    this.specialtyIcon.style.marginLeft = '2px'

    this.specialtyCountEl = document.createElement('span')
    this.specialtyCountEl.className = 'w3d-hud-specialty-count'

    row2.append(this.regionIcon, this.regionEl, this.specialtyIcon, this.specialtyCountEl)

    this.el.append(row0, row1, row2)
    document.body.appendChild(this.el)
  }

  update(
    collected: number,
    threshold: number,
    regionName: string,
    regionEmoji?: string,
    specialtyEmoji?: string,
    nickname?: string,
    specialtyCount?: number,
    specialtyThreshold?: number,
  ): void {
    this.countEl.textContent = `${collected} / ${threshold}`
    this.barFill.style.width = `${Math.min(100, (collected / threshold) * 100)}%`
    this.regionEl.textContent = regionName
    if (regionEmoji) this.regionIcon.textContent = regionEmoji
    this.specialtyIcon.textContent = specialtyEmoji ?? ''

    // 닉네임: 빈 문자열이면 DEFAULT_NICKNAME으로 방어
    const displayName = (nickname && nickname.trim().length > 0) ? nickname : DEFAULT_NICKNAME
    this.nicknameEl.textContent = displayName

    // specialtyCount/specialtyThreshold 둘 다 유효할 때만 n/T 표시
    const showCount =
      typeof specialtyCount === 'number' &&
      typeof specialtyThreshold === 'number' &&
      specialtyThreshold > 0
    this.specialtyCountEl.textContent = showCount
      ? `${specialtyCount}/${specialtyThreshold}`
      : ''

    if (collected > this.lastCollected) {
      this.countEl.classList.remove('w3d-hud-pop')
      void this.countEl.offsetWidth // reflow to restart animation
      this.countEl.classList.add('w3d-hud-pop')
      this.lastCollected = collected
    }
  }

  dispose(): void {
    this.el.remove()
  }
}
