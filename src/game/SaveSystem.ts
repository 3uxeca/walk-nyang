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
