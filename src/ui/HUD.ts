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
    .w3d-hud-pop {
      animation: hud-pop 0.35s ease;
    }
  `
  document.head.appendChild(s)
}

export class HUD {
  private el: HTMLDivElement
  private countEl: HTMLSpanElement
  private barFill: HTMLDivElement
  private regionEl: HTMLSpanElement
  private regionIcon: HTMLSpanElement
  private specialtyIcon: HTMLSpanElement
  private lastCollected = 0

  constructor() {
    injectStyles()

    this.el = document.createElement('div')
    this.el.className = 'w3d-hud'

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

    row2.append(this.regionIcon, this.regionEl, this.specialtyIcon)

    this.el.append(row1, row2)
    document.body.appendChild(this.el)
  }

  update(
    collected: number,
    threshold: number,
    regionName: string,
    regionEmoji?: string,
    specialtyEmoji?: string,
  ): void {
    this.countEl.textContent = `${collected} / ${threshold}`
    this.barFill.style.width = `${Math.min(100, (collected / threshold) * 100)}%`
    this.regionEl.textContent = regionName
    if (regionEmoji) this.regionIcon.textContent = regionEmoji
    this.specialtyIcon.textContent = specialtyEmoji ?? ''

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
