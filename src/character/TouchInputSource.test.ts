import { describe, it, expect } from 'vitest'
import { TouchInputSource, isMobileEnvironment } from './TouchInputSource'
import type { VirtualJoystick, JoystickVector } from '../ui/VirtualJoystick'
import type { MobileActionButtons } from '../ui/MobileActionButtons'

/**
 * 의존성 주입 디자인 덕에 DOM 없이 stub만으로 모든 매핑 검증이 가능.
 * VirtualJoystick은 `vector: JoystickVector`만, MobileActionButtons는
 * `dashHeld`와 `consumeJump()`만 노출하면 충분.
 *
 * NOTE: 테스트 값들은 TouchInputSource.axisThreshold = 0.3 기준.
 * threshold가 변경되면 이 파일의 boundary 테스트와 설명도 함께 수정해야 함.
 */

class FakeJoystick {
  vector: JoystickVector = { x: 0, y: 0 }
}

class FakeButtons {
  dashHeld = false
  private jumpPressed = false
  press() { this.jumpPressed = true }
  consumeJump(): boolean {
    const w = this.jumpPressed
    this.jumpPressed = false
    return w
  }
}

function makeSource() {
  const joy = new FakeJoystick()
  const btn = new FakeButtons()
  // ownsUi=false: dispose가 stub의 dispose를 호출하지 않게 함 (stub엔 dispose 없음)
  const src = new TouchInputSource(
    joy as unknown as VirtualJoystick,
    btn as unknown as MobileActionButtons,
    false,
  )
  return { joy, btn, src }
}

describe('TouchInputSource', () => {
  it('초기 상태는 모두 false (jump도 항상 held가 아니라 false 유지)', () => {
    const { src } = makeSource()
    expect(src.state.forward).toBe(false)
    expect(src.state.backward).toBe(false)
    expect(src.state.left).toBe(false)
    expect(src.state.right).toBe(false)
    expect(src.state.dash).toBe(false)
    expect(src.state.jump).toBe(false)
  })

  it('y < -threshold 일 때 forward true', () => {
    const { joy, src } = makeSource()
    joy.vector = { x: 0, y: -0.5 }
    src.update(0.016)
    expect(src.state.forward).toBe(true)
    expect(src.state.backward).toBe(false)
  })

  it('y > +threshold 일 때 backward true', () => {
    const { joy, src } = makeSource()
    joy.vector = { x: 0, y: 0.5 }
    src.update(0.016)
    expect(src.state.backward).toBe(true)
    expect(src.state.forward).toBe(false)
  })

  it('x < -threshold 일 때 left, x > +threshold 일 때 right', () => {
    const { joy, src } = makeSource()
    joy.vector = { x: -0.7, y: 0 }
    src.update(0.016)
    expect(src.state.left).toBe(true)
    expect(src.state.right).toBe(false)
    joy.vector = { x: 0.7, y: 0 }
    src.update(0.016)
    expect(src.state.left).toBe(false)
    expect(src.state.right).toBe(true)
  })

  it('threshold(0.3) 이하는 held로 인식 안 함', () => {
    const { joy, src } = makeSource()
    joy.vector = { x: 0.2, y: -0.2 }   // 둘 다 데드존 위지만 threshold 미만
    src.update(0.016)
    expect(src.state.left).toBe(false)
    expect(src.state.right).toBe(false)
    expect(src.state.forward).toBe(false)
    expect(src.state.backward).toBe(false)
  })

  it('threshold 정확히 0.3 경계값은 held로 인식 안 함 (strict <, >)', () => {
    const { joy, src } = makeSource()
    joy.vector = { x: 0.3, y: -0.3 }
    src.update(0.016)
    expect(src.state.right).toBe(false)
    expect(src.state.forward).toBe(false)
    joy.vector = { x: -0.3, y: 0.3 }
    src.update(0.016)
    expect(src.state.left).toBe(false)
    expect(src.state.backward).toBe(false)
  })

  it('대각선 동시 입력은 두 축 모두 활성', () => {
    const { joy, src } = makeSource()
    joy.vector = { x: 0.6, y: -0.6 }
    src.update(0.016)
    expect(src.state.right).toBe(true)
    expect(src.state.forward).toBe(true)
    expect(src.state.left).toBe(false)
    expect(src.state.backward).toBe(false)
  })

  it('조이스틱 벡터가 zero로 돌아오면 held 해제', () => {
    const { joy, src } = makeSource()
    joy.vector = { x: 0.8, y: 0 }
    src.update(0.016)
    expect(src.state.right).toBe(true)
    joy.vector = { x: 0, y: 0 }
    src.update(0.016)
    expect(src.state.right).toBe(false)
  })

  it('dashHeld는 그대로 dash로 전달', () => {
    const { btn, src } = makeSource()
    btn.dashHeld = true
    src.update(0.016)
    expect(src.state.dash).toBe(true)
    btn.dashHeld = false
    src.update(0.016)
    expect(src.state.dash).toBe(false)
  })

  it('consumeJump는 버튼에 위임', () => {
    const { btn, src } = makeSource()
    expect(src.consumeJump?.()).toBe(false)
    btn.press()
    expect(src.consumeJump?.()).toBe(true)
    expect(src.consumeJump?.()).toBe(false)  // 한 번 소비 후 false
  })

  it('dispose 후에도 state는 false로 유지', () => {
    const { joy, src } = makeSource()
    joy.vector = { x: 0.7, y: 0.7 }
    src.update(0.016)
    expect(src.state.right).toBe(true)
    src.dispose()
    expect(src.state.right).toBe(false)
    expect(src.state.backward).toBe(false)
  })
})

describe('isMobileEnvironment', () => {
  it('Node 환경(window 없음)에서는 false 반환 — typeof window guard 검증', () => {
    expect(isMobileEnvironment()).toBe(false)
  })
})
