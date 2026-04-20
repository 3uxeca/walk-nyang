import { describe, it, expect } from 'vitest'
import { clamp, lerp } from './noise'

describe('clamp', () => {
  it('값이 범위 내에 있으면 그대로 반환', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
  it('최솟값 미만이면 min 반환', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
  })
  it('최댓값 초과이면 max 반환', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe('lerp', () => {
  it('t=0이면 a 반환', () => {
    expect(lerp(0, 10, 0)).toBe(0)
  })
  it('t=1이면 b 반환', () => {
    expect(lerp(0, 10, 1)).toBe(10)
  })
  it('t=0.5이면 중간값 반환', () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
  })
})
