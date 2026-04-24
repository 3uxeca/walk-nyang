export const SAVE_KEY = 'walk3d.save.v1'
export const CURRENT_VERSION = 1
export const CURRENT_ITEM_SCHEMA_VERSION = 2

export interface SaveData {
  version: number
  worldSeed: number
  itemSchemaVersion: number
  collectedItemIds: string[]
  unlockedRegions: number[]
  playerPosition: { x: number; z: number }
  /**
   * 튜토리얼(첫 진입 토스트)을 이미 본 상태인지 여부. 기본값 false.
   * 필드 자체가 없는 예전 세이브도 정상 로드되어 false로 간주.
   */
  tutorialSeen?: boolean
  /**
   * 수집 가중치(특산품 weight=3)를 반영한 누적 점수.
   * 로드 시 리플레이 대신 직접 복원해 가중치가 두 번 적용되는 문제를 회피한다.
   * 필드가 없으면 `collectedItemIds.length`로 폴백 (예전 세이브 호환).
   */
  totalCollected?: number
}

function isValidSaveShape(v: unknown): v is SaveData {
  if (typeof v !== 'object' || v === null) return false
  const d = v as Record<string, unknown>
  return (
    typeof d.version === 'number' &&
    typeof d.worldSeed === 'number' &&
    typeof d.itemSchemaVersion === 'number' &&
    Array.isArray(d.collectedItemIds) &&
    Array.isArray(d.unlockedRegions) &&
    typeof d.playerPosition === 'object' && d.playerPosition !== null &&
    typeof (d.playerPosition as Record<string, unknown>).x === 'number' &&
    typeof (d.playerPosition as Record<string, unknown>).z === 'number'
  )
}

export class SaveSystem {
  constructor(
    private worldSeed: number,
    private storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = localStorage
  ) {}

  save(data: SaveData): void {
    this.storage.setItem(SAVE_KEY, JSON.stringify(data))
  }

  load(): SaveData | null {
    const raw = this.storage.getItem(SAVE_KEY)
    if (raw === null) return null

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return null
    }

    if (
      !isValidSaveShape(parsed) ||
      parsed.version !== CURRENT_VERSION ||
      parsed.worldSeed !== this.worldSeed ||
      parsed.itemSchemaVersion !== CURRENT_ITEM_SCHEMA_VERSION
    ) {
      this.reset()
      return null
    }

    return parsed
  }

  reset(): void {
    this.storage.removeItem(SAVE_KEY)
  }
}
