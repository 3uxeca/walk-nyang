import { describe, it, expect, vi } from 'vitest'
import { ObjectPool } from './pool'

describe('ObjectPool', () => {
  it('acquire는 새 아이템을 생성', () => {
    const factory = vi.fn(() => ({ value: 0 }))
    const pool = new ObjectPool(factory, () => {})
    const item = pool.acquire()
    expect(item).toBeDefined()
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('release 후 acquire는 factory 재호출 없이 반환', () => {
    const factory = vi.fn(() => ({ value: 0 }))
    const reset = vi.fn()
    const pool = new ObjectPool(factory, reset)
    const item = pool.acquire()
    pool.release(item)
    const item2 = pool.acquire()
    expect(item2).toBe(item)
    expect(factory).toHaveBeenCalledTimes(1)
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('release 후 size는 1 증가', () => {
    const pool = new ObjectPool(() => ({}), () => {})
    const item = pool.acquire()
    expect(pool.size).toBe(0)
    pool.release(item)
    expect(pool.size).toBe(1)
  })

  it('clear 후 size는 0', () => {
    const pool = new ObjectPool(() => ({}), () => {})
    const item = pool.acquire()
    pool.release(item)
    pool.clear()
    expect(pool.size).toBe(0)
  })

  it('여러 아이템 acquire/release 순환', () => {
    const factory = vi.fn(() => ({ id: Math.random() }))
    const pool = new ObjectPool(factory, () => {})
    const a = pool.acquire()
    const b = pool.acquire()
    expect(factory).toHaveBeenCalledTimes(2)
    pool.release(a)
    pool.release(b)
    expect(pool.size).toBe(2)
    pool.acquire()
    expect(pool.size).toBe(1)
    expect(factory).toHaveBeenCalledTimes(2)  // 재사용, 새로 생성 없음
  })
})
