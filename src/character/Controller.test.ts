import { describe, it, expect } from 'vitest'
import { inputToVelocity } from './Controller'
import type { InputState } from './Controller'

describe('inputToVelocity', () => {
  const noInput: InputState = { forward: false, backward: false, left: false, right: false, jump: false, dash: false }

  it('입력 없으면 zero vector 반환', () => {
    const v = inputToVelocity(noInput, 5, 0)
    expect(v.lengthSq()).toBe(0)
  })

  it('forward만 누르면 -Z 방향 이동', () => {
    const v = inputToVelocity({ ...noInput, forward: true }, 5, 0)
    expect(v.z).toBeLessThan(0)
    expect(v.x).toBeCloseTo(0)
  })

  it('speed가 속도 크기 결정', () => {
    const v = inputToVelocity({ ...noInput, forward: true }, 5, 0)
    expect(v.length()).toBeCloseTo(5)
  })

  it('대각선 이동 시 속도 크기는 speed와 동일 (정규화)', () => {
    const v = inputToVelocity({ ...noInput, forward: true, right: true }, 5, 0)
    expect(v.length()).toBeCloseTo(5)
  })

  it('cameraAngle 90도 시 forward → -X 방향', () => {
    const v = inputToVelocity({ ...noInput, forward: true }, 5, Math.PI / 2)
    expect(v.x).toBeCloseTo(-5, 1)
    expect(v.z).toBeCloseTo(0, 1)
  })
})
