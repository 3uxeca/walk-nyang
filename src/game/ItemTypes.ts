/**
 * 아이템 타입 공용 정의.
 * - ChunkGenerator / ItemSystem / RegionManager가 모두 의존.
 * - 별도 모듈로 빼서 순환 import 방지.
 */

export type ItemType =
  | 'star' | 'coin' | 'gem'              // 기본(모든 지역 공통)
  | 'flower' | 'fish' | 'clover' | 'droplet'  // 지역 특산품

export const BASE_ITEM_TYPES: ItemType[] = ['star', 'coin', 'gem']

/**
 * 수집 시 ProgressSystem에 얼마나 가산될지.
 * 기본 아이템은 1, 특산품은 3 — "조금 덜 스폰되지만 더 큰 보상" 규칙.
 */
export const ITEM_WEIGHT: Record<ItemType, number> = {
  star: 1, coin: 1, gem: 1,
  flower: 3, fish: 3, clover: 3, droplet: 3,
}

/**
 * 특산품 → 해당 지역 ID 역매핑. 언락 조건 판정에 사용.
 * 기본 아이템(star/coin/gem)은 엔트리 없음 → undefined로 "특산품 아님"을 표현.
 */
export const SPECIALTY_REGION_BY_TYPE: Partial<Record<ItemType, number>> = {
  flower: 0, fish: 1, clover: 2, droplet: 3,
}

/** 특산품 몇 개 모으면 다음 지역이 언락되는가 */
export const SPECIALTY_UNLOCK_THRESHOLD = 3
