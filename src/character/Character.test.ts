import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'

// AssetManager.getInstance() must return a stub without a 'cat' asset
// so Character falls through to buildProcedural().
vi.mock('../assets/AssetManager', () => {
  return {
    AssetManager: {
      getInstance: () => ({
        has: () => false,
      }),
    },
  }
})

import { Character } from './Character'

describe('Character.supportsFurColor', () => {
  it('procedural 모드에서 true를 반환한다', () => {
    // AssetManager.has() returns false → buildProcedural() → furMats[0] is orangeFur
    const character = new Character()
    expect(character.supportsFurColor()).toBe(true)
  })
})

describe('Character.setFurColor', () => {
  let character: Character

  beforeEach(() => {
    character = new Character()
  })

  it('정상 hex 적용 시 orangeFur.color가 변경된다', () => {
    character.setFurColor('#ff0000')
    const mat = (character as unknown as { furMats: THREE.MeshToonMaterial[] }).furMats[0]
    expect(mat).not.toBeNull()
    expect(mat.color.getHexString()).toBe('ff0000')
  })

  it('잘못된 hex에서 throw 없이 현재 색을 유지한다', () => {
    character.setFurColor('#ff8c32')
    const mat = (character as unknown as { furMats: THREE.MeshToonMaterial[] }).furMats[0]
    const before = mat.color.getHexString()

    expect(() => character.setFurColor('')).not.toThrow()
    expect(() => character.setFurColor('oops')).not.toThrow()
    expect(() => character.setFurColor('#gg0000')).not.toThrow()
    // null cast to string edge-case
    expect(() => character.setFurColor(null as unknown as string)).not.toThrow()

    expect(mat.color.getHexString()).toBe(before)
  })
})
