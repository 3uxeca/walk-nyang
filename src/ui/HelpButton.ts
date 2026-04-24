const HELP_STYLE_ID = 'walk3d-help-style'

function injectStyles() {
  if (document.getElementById(HELP_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = HELP_STYLE_ID
  s.textContent = `
    .w3d-help-btn {
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
    .w3d-help-btn:active {
      transform: scale(0.92);
      background: rgba(255,200,150,0.95);
    }
    .w3d-help-btn--bottom-left { bottom: 20px; left: 20px; }
    .w3d-help-btn--top-right   { top: 20px; right: 20px; }
  `
  document.head.appendChild(s)
}

export type HelpButtonPosition = 'bottom-left' | 'top-right'

export interface HelpButtonOptions {
  onClick: () => void
  /**
   * 기본값 `bottom-left`(데스크탑 권장).
   * 모바일에선 좌하단이 VirtualJoystick 영역이라 `top-right`로 옮기는 것을 권장.
   */
  position?: HelpButtonPosition
}

/**
 * 항상 접근 가능한 `?` 도움말 버튼. 한 번 누르면 `onClick`가 호출된다.
 * 튜토리얼 모달 재호출 용도.
 */
export class HelpButton {
  private btn: HTMLButtonElement
  private handleClick: () => void

  constructor(opts: HelpButtonOptions) {
    injectStyles()
    this.btn = document.createElement('button')
    this.btn.className = `w3d-help-btn w3d-help-btn--${opts.position ?? 'bottom-left'}`
    this.btn.type = 'button'
    this.btn.textContent = '?'
    this.btn.setAttribute('aria-label', '게임 설명')
    this.handleClick = () => opts.onClick()
    this.btn.addEventListener('click', this.handleClick)
    document.body.appendChild(this.btn)
  }

  dispose(): void {
    this.btn.removeEventListener('click', this.handleClick)
    this.btn.remove()
  }
}
