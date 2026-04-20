import { describe, it, expect } from 'vitest'
import { generateChunk } from './ChunkGenerator'

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

  it('아이템 id 형식이 "cx,cz,localIdx"', () => {
    const data = generateChunk(3, -2, 12345)
    for (const item of data.items) {
      expect(item.id).toMatch(/^-?\d+,-?\d+,\d+$/)
      expect(item.id.startsWith('3,-2,')).toBe(true)
    }
  })

  it('아이템 수는 2-4개', () => {
    for (let i = 0; i < 10; i++) {
      const data = generateChunk(i, i, 12345)
      expect(data.items.length).toBeGreaterThanOrEqual(2)
      expect(data.items.length).toBeLessThanOrEqual(4)
    }
  })
})
