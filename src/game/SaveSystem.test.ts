import { describe, it, expect, beforeEach } from 'vitest'
import { SaveSystem, CURRENT_VERSION, CURRENT_ITEM_SCHEMA_VERSION, SAVE_KEY } from './SaveSystem'
import type { SaveData } from './SaveSystem'

const WORLD_SEED = 12345

function makeStorage() {
  const store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
  }
}

function makeValidData(): SaveData {
  return {
    version: CURRENT_VERSION,
    worldSeed: WORLD_SEED,
    itemSchemaVersion: CURRENT_ITEM_SCHEMA_VERSION,
    collectedItemIds: ['a', 'b', 'c'],
    unlockedRegions: [0, 1],
    playerPosition: { x: 10, z: -5 },
  }
}

describe('SaveSystem', () => {
  let storage: ReturnType<typeof makeStorage>
  let sys: SaveSystem

  beforeEach(() => {
    storage = makeStorage()
    sys = new SaveSystem(WORLD_SEED, storage)
  })

  it('round-trip: save then load returns equal data', () => {
    const data = makeValidData()
    sys.save(data)
    expect(sys.load()).toEqual(data)
  })

  it('load returns null when nothing saved', () => {
    expect(sys.load()).toBeNull()
  })

  it('worldSeed mismatch → load returns null and clears storage', () => {
    const data = makeValidData()
    sys.save(data)
    const wrongSeedSys = new SaveSystem(99999, storage)
    expect(wrongSeedSys.load()).toBeNull()
    // After reset, even correct-seed system sees null
    expect(sys.load()).toBeNull()
  })

  it('itemSchemaVersion mismatch → load returns null', () => {
    const data = { ...makeValidData(), itemSchemaVersion: 999 }
    sys.save(data)
    expect(sys.load()).toBeNull()
    expect(sys.load()).toBeNull()
  })

  it('version mismatch → load returns null', () => {
    const data = { ...makeValidData(), version: 999 }
    sys.save(data)
    expect(sys.load()).toBeNull()
  })

  it('corrupt JSON → load returns null', () => {
    storage.setItem(SAVE_KEY, '{not valid json}}}')
    expect(sys.load()).toBeNull()
  })

  it('reset clears data so load returns null', () => {
    sys.save(makeValidData())
    sys.reset()
    expect(sys.load()).toBeNull()
  })
})
