export const SAVE_KEY = 'walk3d.save.v1'
export const CURRENT_VERSION = 1
export const CURRENT_ITEM_SCHEMA_VERSION = 2

/** 고양이 fur 컬러 기본값 (블랙) — CatColorModal 프리셋의 '블랙'과 동일 hex. */
export const DEFAULT_CAT_COLOR = '#272727'

/** 닉네임 미설정·빈 문자열 시 사용하는 폴백 이름. */
export const DEFAULT_NICKNAME = '산책냥'

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
  /**
   * 지역별 특산품 수집 카운트 (지역 ID → 개수).
   * 언락 조건 판정의 권위 있는 출처. 필드 부재 시 빈 객체로 폴백.
   */
  specialtyCountByRegion?: Record<number, number>
  /**
   * 고양이 메인 fur 컬러 (hex 문자열, 예: '#ff8c32').
   * 필드가 없거나 타입이 잘못된 경우 호출자가 DEFAULT_CAT_COLOR로 폴백.
   */
  catColor?: string
  /**
   * 고양이 닉네임. 선택 필드 — 없거나 빈 문자열이면 DEFAULT_NICKNAME으로 폴백.
   * isValidSaveShape에서 검사하지 않아 예전 세이브와 호환.
   */
  nickname?: string
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

    // 선택 필드가 존재하지만 타입이 잘못된 경우 필드를 제거해 호환성 유지 (reset 안 함)
    const needsSanitize =
      ('catColor' in parsed && typeof parsed.catColor !== 'string') ||
      ('nickname' in parsed && typeof parsed.nickname !== 'string')

    if (needsSanitize) {
      const sanitized: SaveData = { ...parsed }
      if (typeof sanitized.catColor !== 'string') delete sanitized.catColor
      if (typeof sanitized.nickname !== 'string') delete sanitized.nickname
      return sanitized
    }

    return parsed
  }

  reset(): void {
    this.storage.removeItem(SAVE_KEY)
  }
}

/**
 * 세이브 데이터에서 catColor를 읽어 반환하거나, 없으면 DEFAULT_CAT_COLOR를 반환.
 */
export function getCatColor(save: SaveData | null): string {
  return save?.catColor ?? DEFAULT_CAT_COLOR
}
