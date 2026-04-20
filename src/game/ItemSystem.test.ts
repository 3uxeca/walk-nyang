import { describe, it, expect } from 'vitest'
import { generateChunk } from '../world/ChunkGenerator'
import { filterActiveCandidates, isInCollectRange, COLLECT_RADIUS } from './ItemSystem'

describe('ItemSystem 결정성', () => {
  it('동일 worldSeed+좌표 → 동일 아이템 후보 배열', () => {
    const a = generateChunk(2, -3, 99999)
    const b = generateChunk(2, -3, 99999)
    expect(a.items).toEqual(b.items)
  })

  it('동일 worldSeed+collectedItemIds → 동일 활성 아이템 집합', () => {
    const candidates = generateChunk(1, 1, 12345).items
    const collected = new Set([candidates[0].id])

    const activeA = filterActiveCandidates(candidates, collected)
    const activeB = filterActiveCandidates(candidates, collected)

    expect(activeA.map(i => i.id)).toEqual(activeB.map(i => i.id))
  })
})

describe('filterActiveCandidates', () => {
  it('수집된 아이템은 활성 목록에서 제외됨', () => {
    const candidates = generateChunk(0, 0, 12345).items
    expect(candidates.length).toBeGreaterThanOrEqual(2)

    const collected = new Set([candidates[0].id])
    const active = filterActiveCandidates(candidates, collected)

    expect(active.length).toBe(candidates.length - 1)
    expect(active.find(i => i.id === candidates[0].id)).toBeUndefined()
  })

  it('빈 collectedItemIds → 모든 후보가 활성', () => {
    const candidates = generateChunk(0, 0, 12345).items
    const active = filterActiveCandidates(candidates, new Set())
    expect(active.length).toBe(candidates.length)
  })

  it('모두 수집 → 활성 아이템 없음', () => {
    const candidates = generateChunk(0, 0, 12345).items
    const collected = new Set(candidates.map(c => c.id))
    const active = filterActiveCandidates(candidates, collected)
    expect(active.length).toBe(0)
  })
})

describe('isInCollectRange 수집 경계값', () => {
  it(`거리 ${COLLECT_RADIUS - 0.01} → 수집됨`, () => {
    expect(isInCollectRange(0, COLLECT_RADIUS - 0.01, 0, 0)).toBe(true)
  })

  it(`거리 ${COLLECT_RADIUS + 0.01} → 수집 안됨`, () => {
    expect(isInCollectRange(0, COLLECT_RADIUS + 0.01, 0, 0)).toBe(false)
  })

  it('거리 0 → 수집됨', () => {
    expect(isInCollectRange(5, 5, 5, 5)).toBe(true)
  })

  it('대각선 거리 정확히 계산됨', () => {
    // sqrt(1^2 + 1^2) ≈ 1.414 < 1.5 → 수집됨
    expect(isInCollectRange(1, 1, 0, 0)).toBe(true)
    // sqrt(1.1^2 + 1.1^2) ≈ 1.556 > 1.5 → 수집 안됨
    expect(isInCollectRange(1.1, 1.1, 0, 0)).toBe(false)
  })
})
