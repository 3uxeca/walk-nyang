const STYLE_ID = 'walk3d-vjoy-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    .w3d-vjoy-base {
      position: fixed;
      left: 30px;
      bottom: 30px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: rgba(255,248,238,0.35);
      border: 2px solid rgba(255,200,140,0.55);
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      z-index: 150;
      pointer-events: auto;
      box-sizing: border-box;
    }
    .w3d-vjoy-knob {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255,140,66,0.85);
      border: 2px solid #FF8C42;
      box-shadow: 0 3px 10px rgba(255,140,66,0.35);
      transform: translate(-50%, -50%);
      transition: transform 0.08s ease-out;
      pointer-events: none;
    }
    .w3d-vjoy-knob.w3d-vjoy-dragging {
      transition: none;
    }
  `
  document.head.appendChild(s)
}

export interface JoystickVector {
  /** 정규화된 x ∈ [-1, 1], 좌우 */
  x: number
  /** 정규화된 y ∈ [-1, 1], 전후 (위쪽이 -) */
  y: number
}

/**
 * 좌하단 가상 조이스틱.
 * - pointerdown/move/up (터치+마우스 통합)으로 drag 추적
 * - `vector`는 정규화된 [-1, 1] 범위, 반경 밖은 clamp
 * - 손 떼면 원위치 + 벡터 zero
 */
export class VirtualJoystick {
  private base: HTMLDivElement
  private knob: HTMLDivElement
  /** 중심에서 knob이 이동 가능한 최대 픽셀 반경 */
  private readonly maxRadius = 50
  /** 움직임으로 취급되지 않는 데드존 (maxRadius의 비율) */
  private readonly deadzone = 0.15
  private pointerId: number | null = null
  private centerX = 0
  private centerY = 0
  readonly vector: JoystickVector = { x: 0, y: 0 }

  private onPointerDown = (e: PointerEvent) => {
    if (this.pointerId !== null) return
    this.pointerId = e.pointerId
    const rect = this.base.getBoundingClientRect()
    this.centerX = rect.left + rect.width / 2
    this.centerY = rect.top + rect.height / 2
    this.base.setPointerCapture(e.pointerId)
    this.knob.classList.add('w3d-vjoy-dragging')
    this.updateFromEvent(e)
    e.preventDefault()
  }

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return
    this.updateFromEvent(e)
  }

  private onPointerEnd = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return
    // pointer capture가 활성인 동안엔 pointerleave를 무시 — 손가락이 베이스 밖으로
    // 나가도 드래그를 유지. 진짜 release는 pointerup/cancel에서 처리.
    if (e.type === 'pointerleave' && this.base.hasPointerCapture(e.pointerId)) return
    this.pointerId = null
    this.knob.classList.remove('w3d-vjoy-dragging')
    this.knob.style.transform = 'translate(-50%, -50%)'
    this.vector.x = 0
    this.vector.y = 0
  }

  private updateFromEvent(e: PointerEvent) {
    const dx = e.clientX - this.centerX
    const dy = e.clientY - this.centerY
    const dist = Math.hypot(dx, dy)
    let nx = 0, ny = 0, vx = 0, vy = 0
    if (dist > 0) {
      const clamped = Math.min(dist, this.maxRadius)
      nx = (dx / dist) * clamped
      ny = (dy / dist) * clamped
      const ratio = clamped / this.maxRadius
      if (ratio >= this.deadzone) {
        vx = (dx / dist) * ratio
        vy = (dy / dist) * ratio
      }
    }
    this.knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`
    this.vector.x = vx
    this.vector.y = vy
  }

  constructor() {
    injectStyles()
    this.base = document.createElement('div')
    this.base.className = 'w3d-vjoy-base'
    this.knob = document.createElement('div')
    this.knob.className = 'w3d-vjoy-knob'
    this.base.appendChild(this.knob)
    document.body.appendChild(this.base)

    this.base.addEventListener('pointerdown', this.onPointerDown)
    this.base.addEventListener('pointermove', this.onPointerMove)
    this.base.addEventListener('pointerup', this.onPointerEnd)
    this.base.addEventListener('pointercancel', this.onPointerEnd)
    this.base.addEventListener('pointerleave', this.onPointerEnd)
  }

  dispose() {
    this.base.removeEventListener('pointerdown', this.onPointerDown)
    this.base.removeEventListener('pointermove', this.onPointerMove)
    this.base.removeEventListener('pointerup', this.onPointerEnd)
    this.base.removeEventListener('pointercancel', this.onPointerEnd)
    this.base.removeEventListener('pointerleave', this.onPointerEnd)
    this.base.remove()
    this.vector.x = 0
    this.vector.y = 0
  }
}
