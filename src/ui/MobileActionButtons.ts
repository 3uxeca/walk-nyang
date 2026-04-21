const STYLE_ID = 'walk3d-mbtn-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    .w3d-mbtn-wrap {
      position: fixed;
      right: 30px;
      bottom: 30px;
      display: flex;
      flex-direction: column-reverse;
      gap: 14px;
      z-index: 150;
      user-select: none;
      -webkit-user-select: none;
    }
    .w3d-mbtn {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      border: 2.5px solid rgba(255,140,66,0.65);
      background: rgba(255,248,238,0.88);
      color: #7c5c3a;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.5px;
      box-shadow: 0 3px 10px rgba(255,140,66,0.2), 0 1px 3px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: none;
      transition: background 0.08s ease, border-color 0.08s ease, transform 0.08s ease;
      cursor: pointer;
    }
    .w3d-mbtn-active {
      background: rgba(255,140,66,0.92);
      border-color: #FF8C42;
      color: #fff;
      transform: scale(0.94);
    }
  `
  document.head.appendChild(s)
}

/**
 * 모바일 액션 버튼 (JUMP + DASH).
 * - JUMP: 탭하면 엣지 이벤트 (consumeJump로 한번 소비)
 * - DASH: 누르고 있는 동안 held=true
 */
export class MobileActionButtons {
  private wrap: HTMLDivElement
  private jumpBtn: HTMLButtonElement
  private dashBtn: HTMLButtonElement

  /** DASH 홀드 상태 (외부에서 읽기 전용으로 사용) */
  dashHeld = false
  /** JUMP 엣지 플래그 — consumeJump()로 소비됨 */
  private jumpPressed = false

  constructor() {
    injectStyles()
    this.wrap = document.createElement('div')
    this.wrap.className = 'w3d-mbtn-wrap'

    this.jumpBtn = this.makeBtn('JUMP')
    this.dashBtn = this.makeBtn('DASH')
    // column-reverse라 순서: JUMP(아래) → DASH(위)
    this.wrap.append(this.jumpBtn, this.dashBtn)
    document.body.appendChild(this.wrap)

    this.jumpBtn.addEventListener('pointerdown', this.onJumpDown)
    this.jumpBtn.addEventListener('pointerup', this.onJumpUp)
    this.jumpBtn.addEventListener('pointercancel', this.onJumpUp)
    this.jumpBtn.addEventListener('pointerleave', this.onJumpUp)

    this.dashBtn.addEventListener('pointerdown', this.onDashDown)
    this.dashBtn.addEventListener('pointerup', this.onDashUp)
    this.dashBtn.addEventListener('pointercancel', this.onDashUp)
    this.dashBtn.addEventListener('pointerleave', this.onDashUp)
  }

  private makeBtn(label: string): HTMLButtonElement {
    const b = document.createElement('button')
    b.className = 'w3d-mbtn'
    b.textContent = label
    b.type = 'button'
    return b
  }

  private onJumpDown = (e: PointerEvent) => {
    this.jumpPressed = true
    this.jumpBtn.classList.add('w3d-mbtn-active')
    this.jumpBtn.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  private onJumpUp = () => {
    this.jumpBtn.classList.remove('w3d-mbtn-active')
  }

  private onDashDown = (e: PointerEvent) => {
    this.dashHeld = true
    this.dashBtn.classList.add('w3d-mbtn-active')
    this.dashBtn.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  private onDashUp = () => {
    this.dashHeld = false
    this.dashBtn.classList.remove('w3d-mbtn-active')
  }

  /** 이번 프레임에 JUMP가 눌렸는지 — 한 번 true 반환 후 리셋 */
  consumeJump(): boolean {
    const was = this.jumpPressed
    this.jumpPressed = false
    return was
  }

  dispose() {
    this.jumpBtn.removeEventListener('pointerdown', this.onJumpDown)
    this.jumpBtn.removeEventListener('pointerup', this.onJumpUp)
    this.jumpBtn.removeEventListener('pointercancel', this.onJumpUp)
    this.jumpBtn.removeEventListener('pointerleave', this.onJumpUp)
    this.dashBtn.removeEventListener('pointerdown', this.onDashDown)
    this.dashBtn.removeEventListener('pointerup', this.onDashUp)
    this.dashBtn.removeEventListener('pointercancel', this.onDashUp)
    this.dashBtn.removeEventListener('pointerleave', this.onDashUp)
    this.wrap.remove()
    this.dashHeld = false
    this.jumpPressed = false
  }
}
