import { isMobileEnvironment } from '../character/TouchInputSource'

const CAT_COLOR_BTN_STYLE_ID = 'walk3d-cat-color-btn-style'

function injectStyles() {
  if (document.getElementById(CAT_COLOR_BTN_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = CAT_COLOR_BTN_STYLE_ID
  s.textContent = `
    .w3d-cat-color-btn {
      position: fixed;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,248,238,0.88);
      border: 2px solid rgba(255,200,140,0.7);
      color: #7c5c3a;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      font-size: 18px;
      font-weight: 900;
      cursor: pointer;
      box-shadow: 0 3px 8px rgba(255,140,66,0.2), 0 1px 2px rgba(0,0,0,0.08);
      z-index: 140;
      transition: background 0.08s ease, transform 0.08s ease;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      padding: 0;
    }
    .w3d-cat-color-btn:active {
      transform: scale(0.92);
      background: rgba(255,200,150,0.95);
    }
    .w3d-cat-color-btn--bottom-left { bottom: 68px; left: 20px; }
    .w3d-cat-color-btn--top-right   { top: 68px; right: 20px; }
  `
  document.head.appendChild(s)
}

export type CatColorButtonPosition = 'bottom-left' | 'top-right'

export interface CatColorButtonOptions {
  onClick: () => void
  /**
   * @deprecated 위치는 컴포넌트가 isMobileEnvironment()로 자동 결정합니다.
   * 모바일 → top-right, 데스크탑 → bottom-left.
   * 이 옵션은 무시됩니다.
   */
  position?: CatColorButtonPosition
}

/**
 * HUD 🎨 버튼. HelpButton 패턴을 재사용.
 * 클릭/탭 시 CatColorModal을 여는 데 사용.
 * 모바일/데스크탑 위치를 내부에서 자동 분기하여 VirtualJoystick 충돌을 방지.
 */
export class CatColorButton {
  private btn: HTMLButtonElement
  private handleClick: () => void

  constructor(opts: CatColorButtonOptions) {
    injectStyles()
    // 위치는 컴포넌트 내부에서 자동 결정 — 호출자 실수로 인한 VirtualJoystick 충돌 방지
    const position: CatColorButtonPosition = isMobileEnvironment() ? 'top-right' : 'bottom-left'
    this.btn = document.createElement('button')
    this.btn.className = `w3d-cat-color-btn w3d-cat-color-btn--${position}`
    this.btn.type = 'button'
    this.btn.textContent = '🎨'
    this.btn.setAttribute('aria-label', '고양이 색상 변경')
    this.btn.setAttribute('aria-haspopup', 'dialog')
    this.handleClick = () => opts.onClick()
    this.btn.addEventListener('click', this.handleClick)
    document.body.appendChild(this.btn)
  }

  dispose(): void {
    this.btn.removeEventListener('click', this.handleClick)
    this.btn.remove()
  }
}
