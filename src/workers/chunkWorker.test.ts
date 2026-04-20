import { describe, it, expect } from 'vitest'
import { generateChunk } from '../world/ChunkGenerator'

describe('ChunkData 직렬화', () => {
  it('generateChunk 결과가 JSON 직렬화/역직렬화 후 동등', () => {
    const original = generateChunk(2, 3, 99999)
    const serialized = JSON.stringify(original)
    const deserialized = JSON.parse(serialized)
    expect(deserialized.cx).toBe(original.cx)
    expect(deserialized.cz).toBe(original.cz)
    expect(deserialized.buildings).toEqual(original.buildings)
    expect(deserialized.items).toEqual(original.items)
    expect(deserialized.props).toEqual(original.props)
  })

  it('직렬화된 데이터가 숫자/문자열 기본형만 포함 (Three.js 객체 없음)', () => {
    const data = generateChunk(0, 0, 12345)
    const json = JSON.stringify(data)
    // THREE.js 객체가 없으면 [object Object] 없이 파싱 가능
    expect(() => JSON.parse(json)).not.toThrow()
    // 모든 building 필드가 직렬화 가능한 기본형
    for (const b of data.buildings) {
      expect(typeof b.type).toBe('string')
      expect(typeof b.x).toBe('number')
      expect(typeof b.z).toBe('number')
    }
  })
})
