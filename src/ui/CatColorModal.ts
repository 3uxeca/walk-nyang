const COLOR_MODAL_STYLE_ID = 'walk3d-cat-color-modal-style'

function injectStyles() {
  if (document.getElementById(COLOR_MODAL_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = COLOR_MODAL_STYLE_ID
  s.textContent = `
    @keyframes w3d-ccm-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes w3d-ccm-card-in {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    .w3d-ccm-backdrop {
      position: fixed; inset: 0;
      background: rgba(48, 32, 24, 0.55);
      z-index: 9600;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: w3d-ccm-fade-in 0.2s ease both;
      font-family: 'Jua', 'Nunito', 'Apple SD Gothic Neo', sans-serif;
    }
    .w3d-ccm-card {
      background: linear-gradient(180deg, #fff8ee 0%, #ffe6cf 100%);
      border-radius: 22px;
      padding: 28px 24px 22px;
      max-width: 360px;
      width: 100%;
      box-shadow: 0 18px 40px rgba(120,70,30,0.25);
      text-align: center;
      animation: w3d-ccm-card-in 0.26s cubic-bezier(.34,1.56,.64,1) both;
    }
    .w3d-ccm-title {
      color: #4a2c1a;
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 16px;
    }
    .w3d-ccm-close-btn {
      position: absolute;
      top: 12px;
      right: 14px;
      background: none;
      border: none;
      font-size: 20px;
      color: #7c5c3a;
      cursor: pointer;
      padding: 4px 8px;
      touch-action: manipulation;
      line-height: 1;
    }
    .w3d-ccm-card-wrap {
      position: relative;
    }
    .w3d-ccm-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 4px;
    }
    .w3d-ccm-swatch {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      padding: 4px;
      border-radius: 10px;
      border: 2px solid transparent;
      transition: border-color 0.1s ease;
    }
    .w3d-ccm-swatch:hover {
      border-color: rgba(120,70,30,0.3);
    }
    .w3d-ccm-swatch--selected {
      border-color: #7a4a2a;
      background: rgba(122,74,42,0.08);
    }
    .w3d-ccm-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid rgba(0,0,0,0.12);
      position: relative;
      flex-shrink: 0;
    }
    .w3d-ccm-check {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
    .w3d-ccm-label {
      font-size: 11px;
      color: #7c5c3a;
      font-weight: 700;
      text-align: center;
      white-space: nowrap;
    }

    @media (max-width: 400px) {
      .w3d-ccm-grid { grid-template-columns: repeat(4, 1fr); gap: 6px; }
      .w3d-ccm-circle { width: 40px; height: 40px; }
      .w3d-ccm-card { padding: 22px 14px 18px; }
    }
  `
  document.head.appendChild(s)
}

export const CAT_COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: '오렌지', hex: '#ff8c32' },
  { name: '화이트', hex: '#fff5e8' },
  { name: '코코아', hex: '#7a4a2a' },
  { name: '그레이', hex: '#9aa0a6' },
  { name: '블랙',   hex: '#272727' },
  { name: '크림',   hex: '#ffe1a8' },
  { name: '핑크',   hex: '#ffb3c6' },
  { name: '민트',   hex: '#a8e6cf' },
]

export interface CatColorModalOptions {
  initialHex: string
  onSelect: (hex: string, name: string) => void
  onClose?: () => void
}

/**
 * 고양이 fur 색상 프리셋 선택 모달.
 * backdrop 클릭 / ESC / ✕ 버튼 중 어느 것으로도 닫힘.
 * Character 직접 import 없이 콜백으로만 외부와 통신.
 */
export class CatColorModal {
  private el: HTMLDivElement | null = null
  private onKeyDown: (e: KeyboardEvent) => void = () => {}

  open(options: CatColorModalOptions): void {
    if (this.el) return

    injectStyles()

    const { initialHex, onSelect, onClose } = options

    const backdrop = document.createElement('div')
    backdrop.className = 'w3d-ccm-backdrop'
    backdrop.setAttribute('role', 'dialog')
    backdrop.setAttribute('aria-modal', 'true')
    backdrop.setAttribute('aria-label', '고양이 색상 선택')

    const cardWrap = document.createElement('div')
    cardWrap.className = 'w3d-ccm-card-wrap'

    const card = document.createElement('div')
    card.className = 'w3d-ccm-card'

    const title = document.createElement('p')
    title.className = 'w3d-ccm-title'
    title.textContent = '🎨 고양이 색상 선택'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'w3d-ccm-close-btn'
    closeBtn.type = 'button'
    closeBtn.textContent = '✕'
    closeBtn.setAttribute('aria-label', '닫기')
    closeBtn.addEventListener('click', () => this.close(onClose))

    const grid = document.createElement('div')
    grid.className = 'w3d-ccm-grid'

    const normalizedInitial = initialHex.toLowerCase()

    for (const preset of CAT_COLOR_PRESETS) {
      const isSelected = preset.hex.toLowerCase() === normalizedInitial

      const swatch = document.createElement('div')
      swatch.className = 'w3d-ccm-swatch' + (isSelected ? ' w3d-ccm-swatch--selected' : '')
      swatch.setAttribute('role', 'button')
      swatch.setAttribute('tabindex', '0')
      swatch.setAttribute('aria-label', preset.name)
      swatch.setAttribute('aria-pressed', String(isSelected))

      const circle = document.createElement('div')
      circle.className = 'w3d-ccm-circle'
      circle.style.background = preset.hex

      if (isSelected) {
        const check = document.createElement('span')
        check.className = 'w3d-ccm-check'
        check.textContent = '✓'
        circle.appendChild(check)
      }

      const label = document.createElement('span')
      label.className = 'w3d-ccm-label'
      label.textContent = preset.name

      swatch.append(circle, label)

      const handleSelect = () => {
        onSelect(preset.hex, preset.name)
        this.close(onClose)
      }

      swatch.addEventListener('click', (e) => {
        e.stopPropagation()
        handleSelect()
      })

      swatch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleSelect()
        }
      })

      grid.appendChild(swatch)
    }

    card.append(title, grid)
    cardWrap.append(card, closeBtn)
    backdrop.appendChild(cardWrap)

    // backdrop 클릭 (카드 바깥) → 닫기 (이벤트 타깃 비교 방식)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close(onClose)
    })

    document.body.appendChild(backdrop)
    this.el = backdrop

    this.onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.close(onClose)
    }
    window.addEventListener('keydown', this.onKeyDown)
  }

  close(onClose?: () => void): void {
    if (!this.el) return
    window.removeEventListener('keydown', this.onKeyDown)
    this.el.remove()
    this.el = null
    onClose?.()
  }

  isOpen(): boolean {
    return this.el !== null
  }
}
