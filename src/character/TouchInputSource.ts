import type { InputSource, InputState } from './Controller'
import type { VirtualJoystick } from '../ui/VirtualJoystick'
import type { MobileActionButtons } from '../ui/MobileActionButtons'

/**
 * 터치(모바일) 입력 소스.
 * VirtualJoystick의 아날로그 벡터와 MobileActionButtons의 상태를
 * 매 프레임 읽어 자체 InputState에 반영한다.
 *
 * Controller가 `update(dt)` 호출 시 `this.update(dt)`도 실행되며,
 * 이때 최신 조이스틱 벡터를 held 필드로 변환한다.
 */
export class TouchInputSource implements InputSource {
  readonly state: InputState = {
    forward: false, backward: false, left: false, right: false, jump: false, dash: false,
  }

  /** 축이 held로 판정되는 임계값 (-1..1 범위) */
  private readonly axisThreshold = 0.3
  private joystick: VirtualJoystick
  private buttons: MobileActionButtons
  private ownsUi: boolean

  /**
   * @param ownsUi true면 dispose 시 joystick/buttons도 함께 dispose.
   *               false면 UI 라이프사이클은 호출자가 관리 (테스트·교체 시나리오).
   */
  constructor(joystick: VirtualJoystick, buttons: MobileActionButtons, ownsUi = true) {
    this.joystick = joystick
    this.buttons = buttons
    this.ownsUi = ownsUi
  }

  update(_dt: number): void {
    const v = this.joystick.vector
    // y축은 화면 좌표계라 위쪽이 음수 → forward로 매핑
    this.state.forward  = v.y < -this.axisThreshold
    this.state.backward = v.y >  this.axisThreshold
    this.state.left     = v.x < -this.axisThreshold
    this.state.right    = v.x >  this.axisThreshold
    this.state.dash     = this.buttons.dashActive
  }

  consumeJump(): boolean {
    return this.buttons.consumeJump()
  }

  dispose() {
    if (this.ownsUi) {
      this.joystick.dispose()
      this.buttons.dispose()
    }
    this.state.forward = false
    this.state.backward = false
    this.state.left = false
    this.state.right = false
    this.state.dash = false
  }
}

/**
 * 현재 기기가 모바일 스타일(터치 우선)인지 추정.
 * - `pointer: coarse` 미디어 쿼리가 매칭되거나
 * - 뷰포트 너비가 820px 미만이면 모바일로 간주
 * 두 조건 중 하나만 만족해도 true — 터치스크린 노트북 등도 모바일 UI로 전환.
 */
export function isMobileEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false
  const narrowViewport = window.innerWidth < 820
  return coarsePointer || narrowViewport
}
