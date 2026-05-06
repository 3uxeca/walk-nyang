import { SPECIALTY_UNLOCK_THRESHOLD } from './ItemTypes';

export const ITEMS_PER_LEVEL = 20;

export function calcLevel(totalCollected: number): { level: number; threshold: number } {
  const level = Math.floor(totalCollected / ITEMS_PER_LEVEL);
  const threshold = (level + 1) * ITEMS_PER_LEVEL;
  return { level, threshold };
}

export class ProgressSystem {
  private totalCollected = 0;
  private currentLevel = 0;
  private nextLevelThreshold = ITEMS_PER_LEVEL;
  private collectedIds = new Set<string>();
  private specialtyCountByRegion = new Map<number, number>();

  /**
   * 지역 특산품 `SPECIALTY_UNLOCK_THRESHOLD`(=3)개가 모이면 다음 지역 ID로 발화.
   * 마지막 지역의 특산품을 채웠을 때도 발화 — 다음 지역이 존재하지 않으면
   * 호출자가 무시한다 (ProgressSystem은 지역 카탈로그를 모름).
   */
  onRegionUnlock: ((nextRegionId: number) => void) | null = null;

  /**
   * 주어진 id가 새 수집이면 `true`, dedup으로 무시되면 `false`를 반환.
   * 호출자가 반환값으로 후속 부작용(예: `recordSpecialty`)을 게이팅할 수 있도록.
   *
   * `gateLevelUp=true`면 이번 호출에서 레벨업 while 루프를 건너뜀.
   * 호출자(특산품 미완 + 다음 지역 대기)가 게이지를 threshold에 캡핑할 때 사용.
   */
  collect(id: string, weight: number = 1, gateLevelUp: boolean = false): boolean {
    if (this.collectedIds.has(id)) return false;
    this.collectedIds.add(id);
    this.totalCollected += weight;

    if (!gateLevelUp) {
      while (this.totalCollected >= this.nextLevelThreshold) {
        this.currentLevel++;
        this.nextLevelThreshold = (this.currentLevel + 1) * ITEMS_PER_LEVEL;
      }
    }
    return true;
  }

  /**
   * 세이브 복원용 — 수집 id 집합과 누적값을 동시에 세팅.
   * - 레벨/임계치는 `calcLevel()`로 재계산 (`collect()`와 동일한 공식 재사용).
   * - `collectedIds` Set도 함께 복원해 이후 `collect()` dedup 가드가 정상 동작.
   * - 콜백은 의도적으로 발화시키지 않음 (main에서 로드 후에 리스너를 바인딩).
   */
  setTotalCollected(total: number, collectedIds?: Iterable<string>): void {
    this.totalCollected = total;
    const { level, threshold } = calcLevel(total);
    this.currentLevel = level;
    this.nextLevelThreshold = threshold;
    if (collectedIds) {
      this.collectedIds = new Set(collectedIds);
    }
  }

  /**
   * 지역 특산품 1개 수집 기록. 해당 지역의 누적 수가 임계치에 도달하면
   * `onRegionUnlock`를 `regionId + 1`로 발화한다. 마지막 지역이면 호출자가 무시.
   * 임계치 초과 수집도 카운트는 계속 증가 (통계용), 단 언락 콜백은 한 번만.
   */
  recordSpecialty(regionId: number): void {
    const prev = this.specialtyCountByRegion.get(regionId) ?? 0;
    const next = prev + 1;
    this.specialtyCountByRegion.set(regionId, next);
    if (prev < SPECIALTY_UNLOCK_THRESHOLD && next >= SPECIALTY_UNLOCK_THRESHOLD) {
      this.onRegionUnlock?.(regionId + 1);
    }
  }

  /** 지역별 특산품 수집 카운트 조회. 미수집이면 0. */
  getSpecialtyCount(regionId: number): number {
    return this.specialtyCountByRegion.get(regionId) ?? 0;
  }

  /**
   * 세이브 복원용 — specialty 카운트 일괄 복원 (언락 콜백 미발화).
   * localStorage 수동 편집 등으로 NaN 키/비숫자 값이 들어올 수 있으므로 필터링.
   */
  setSpecialtyCounts(counts: Record<number, number>): void {
    const entries: Array<[number, number]> = [];
    for (const [k, v] of Object.entries(counts)) {
      const key = Number(k);
      if (!Number.isFinite(key)) continue;
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      entries.push([key, v]);
    }
    this.specialtyCountByRegion = new Map(entries);
  }

  /** 저장용 — 지역 ID → count의 snapshot 반환. */
  getSpecialtyCountsSnapshot(): Record<number, number> {
    const out: Record<number, number> = {};
    for (const [k, v] of this.specialtyCountByRegion) out[k] = v;
    return out;
  }

  /**
   * 누적값(`totalCollected`)에서 자연 레벨을 다시 계산해 `currentLevel`/`nextLevelThreshold`를
   * 동기화한다. 캡(`gateLevelUp=true`)으로 일시 동결됐던 레벨을 풀어줄 때 호출.
   * 호출자: 게이트 해제(특산품 3) 직후, 또는 새 지역 진입 시.
   */
  recomputeLevel(): void {
    const { level, threshold } = calcLevel(this.totalCollected);
    this.currentLevel = level;
    this.nextLevelThreshold = threshold;
  }

  getTotalCollected(): number {
    return this.totalCollected;
  }

  getCurrentLevel(): number {
    return this.currentLevel;
  }

  getNextLevelThreshold(): number {
    return this.nextLevelThreshold;
  }
}
