import { describe, it, expect, beforeEach } from 'vitest'
import { SaveSystem, CURRENT_VERSION, CURRENT_ITEM_SCHEMA_VERSION, SAVE_KEY, DEFAULT_CAT_COLOR, getCatColor } from './SaveSystem'
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

  it('tutorialSeen 필드가 round-trip으로 보존됨', () => {
    const data: SaveData = { ...makeValidData(), tutorialSeen: true }
    sys.save(data)
    const loaded = sys.load()
    expect(loaded?.tutorialSeen).toBe(true)
  })

  it('tutorialSeen 필드가 없는 예전 세이브도 로드 성공 (backward compat)', () => {
    const legacy = makeValidData()  // tutorialSeen 없이 저장된 예전 데이터 형태
    sys.save(legacy)
    const loaded = sys.load()
    expect(loaded).not.toBeNull()
    expect(loaded?.tutorialSeen).toBeUndefined()
  })

  it('totalCollected 필드가 round-trip으로 보존됨', () => {
    const data: SaveData = { ...makeValidData(), totalCollected: 42 }
    sys.save(data)
    const loaded = sys.load()
    expect(loaded?.totalCollected).toBe(42)
  })

  it('totalCollected 필드가 없는 예전 세이브도 로드 성공 (필드 undefined)', () => {
    const legacy = makeValidData()  // totalCollected 없음
    sys.save(legacy)
    const loaded = sys.load()
    expect(loaded).not.toBeNull()
    expect(loaded?.totalCollected).toBeUndefined()
    // 호출자는 `?? collectedItemIds.length` 폴백을 사용한다 (main.ts 계약)
  })

  it('specialtyCountByRegion round-trip', () => {
    const data: SaveData = {
      ...makeValidData(),
      specialtyCountByRegion: { 0: 3, 1: 2, 2: 0, 3: 1 },
    }
    sys.save(data)
    const loaded = sys.load()
    expect(loaded?.specialtyCountByRegion).toEqual({ 0: 3, 1: 2, 2: 0, 3: 1 })
  })

  it('specialtyCountByRegion 필드가 없는 예전 세이브도 로드 성공', () => {
    const legacy = makeValidData()
    sys.save(legacy)
    const loaded = sys.load()
    expect(loaded).not.toBeNull()
    expect(loaded?.specialtyCountByRegion).toBeUndefined()
  })

  // catColor 관련 테스트
  it('catColor 없는 레거시 세이브 로드 시 reset 안 되고 catColor는 undefined', () => {
    const legacy = makeValidData()  // catColor 필드 없음
    sys.save(legacy)
    const loaded = sys.load()
    expect(loaded).not.toBeNull()
    expect(loaded?.catColor).toBeUndefined()
  })

  it('catColor 없는 세이브에서 getCatColor는 DEFAULT_CAT_COLOR 반환', () => {
    const legacy = makeValidData()
    sys.save(legacy)
    const loaded = sys.load()
    expect(getCatColor(loaded)).toBe(DEFAULT_CAT_COLOR)
    expect(getCatColor(null)).toBe(DEFAULT_CAT_COLOR)
  })

  it('catColor 정상 hex 세이브/로드 round-trip', () => {
    const data: SaveData = { ...makeValidData(), catColor: '#7a4a2a' }
    sys.save(data)
    const loaded = sys.load()
    expect(loaded).not.toBeNull()
    expect(loaded?.catColor).toBe('#7a4a2a')
    expect(getCatColor(loaded)).toBe('#7a4a2a')
  })

  it('catColor가 잘못된 타입(number)일 때 reset 안 되고 catColor만 undefined로 처리', () => {
    // 직접 JSON에 number 타입 catColor 심기
    const raw = JSON.stringify({ ...makeValidData(), catColor: 42 })
    storage.setItem(SAVE_KEY, raw)
    const loaded = sys.load()
    expect(loaded).not.toBeNull()           // reset 없이 정상 로드
    expect(loaded?.catColor).toBeUndefined() // 잘못된 타입 필드는 제거됨
  })
})
