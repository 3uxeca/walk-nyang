import { describe, it, expect } from 'vitest'
import { generateChunk } from './ChunkGenerator'
import { getRegionInfo, regionForChunk } from '../game/RegionManager'
import { BASE_ITEM_TYPES } from '../game/ItemTypes'

describe('generateChunk 결정성', () => {
  it('동일 좌표+시드 → 동일 결과', () => {
    const a = generateChunk(3, -2, 12345)
    const b = generateChunk(3, -2, 12345)
    expect(a.buildings.length).toBe(b.buildings.length)
    expect(a.buildings).toEqual(b.buildings)
    expect(a.items).toEqual(b.items)
  })

  it('다른 청크 좌표 → 다른 결과', () => {
    const a = generateChunk(0, 0, 12345)
    const b = generateChunk(1, 0, 12345)
    // buildings나 items 중 하나는 달라야 함
    const same = JSON.stringify(a.buildings) === JSON.stringify(b.buildings)
      && JSON.stringify(a.items) === JSON.stringify(b.items)
    expect(same).toBe(false)
  })

  it('아이템 id 형식이 "cx,cz,localIdx" 또는 "cx,cz,sp"(특산품)', () => {
    const data = generateChunk(3, -2, 12345)
    for (const item of data.items) {
      expect(item.id).toMatch(/^-?\d+,-?\d+,(\d+|sp)$/)
      expect(item.id.startsWith('3,-2,')).toBe(true)
    }
  })

  it('아이템 수는 기본 2-4개 + 특산품 확률적 1개 (총 2-5개)', () => {
    for (let i = 0; i < 10; i++) {
      const data = generateChunk(i, i, 12345)
      expect(data.items.length).toBeGreaterThanOrEqual(2)
      expect(data.items.length).toBeLessThanOrEqual(5)
    }
  })
})

describe('generateChunk 지역 특산품', () => {
  it('특산품 id는 "sp" 접미사를 갖고, 타입은 해당 지역의 specialty.itemType과 일치', () => {
    // 여러 시드로 시도해 특산품이 스폰된 케이스 하나를 잡음 (15% 확률)
    let found = false
    for (let seed = 0; seed < 200 && !found; seed++) {
      const data = generateChunk(0, 0, seed)  // region 0 = 초원 → 꽃
      const specialty = data.items.find(i => i.id.endsWith(',sp'))
      if (specialty) {
        const expected = getRegionInfo(regionForChunk(0, 0)).specialty
        expect(expected).toBeDefined()
        expect(specialty.type).toBe(expected!.itemType)
        found = true
      }
    }
    expect(found).toBe(true)  // 200 시드면 (1-0.85^200) ≈ 100% 확률로 스폰됨
  })

  it('특산품이 없을 때 기본 아이템만 스폰되며 타입은 BASE_ITEM_TYPES 내', () => {
    const data = generateChunk(5, 5, 12345)  // 특정 시드 고정
    const regular = data.items.filter(i => !i.id.endsWith(',sp'))
    expect(regular.length).toBeGreaterThanOrEqual(2)
    for (const item of regular) {
      expect(BASE_ITEM_TYPES).toContain(item.type)
    }
  })

  it('같은 청크·시드에서 특산품 스폰 여부가 결정적', () => {
    const a = generateChunk(2, -1, 77777)
    const b = generateChunk(2, -1, 77777)
    const hasSpecialtyA = a.items.some(i => i.id.endsWith(',sp'))
    const hasSpecialtyB = b.items.some(i => i.id.endsWith(',sp'))
    expect(hasSpecialtyA).toBe(hasSpecialtyB)
  })
})
