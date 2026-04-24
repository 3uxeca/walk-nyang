export const ITEMS_PER_LEVEL = 20;

export function calcLevel(totalCollected: number): { level: number; threshold: number } {
  const level = Math.floor(totalCollected / ITEMS_PER_LEVEL);
  const threshold = (level + 1) * ITEMS_PER_LEVEL;
  return { level, threshold };
}

export function regionForLevel(level: number): number {
  return level;
}

export class ProgressSystem {
  private totalCollected = 0;
  private currentLevel = 0;
  private nextLevelThreshold = ITEMS_PER_LEVEL;
  private collectedIds = new Set<string>();

  onLevelUp: ((newLevel: number, unlockedRegionId: number) => void) | null = null;

  collect(id: string, weight: number = 1): void {
    if (this.collectedIds.has(id)) return;
    this.collectedIds.add(id);
    this.totalCollected += weight;

    while (this.totalCollected >= this.nextLevelThreshold) {
      this.currentLevel++;
      this.nextLevelThreshold = (this.currentLevel + 1) * ITEMS_PER_LEVEL;
      const unlockedRegionId = regionForLevel(this.currentLevel);
      this.onLevelUp?.(this.currentLevel, unlockedRegionId);
    }
  }

  /**
   * 세이브 복원용 — 수집 id 집합과 누적값을 동시에 세팅.
   * - 레벨/임계치는 `calcLevel()`로 재계산 (`collect()`와 동일한 공식 재사용).
   * - `collectedIds` Set도 함께 복원해 이후 `collect()` dedup 가드가 정상 동작.
   * - `onLevelUp` 콜백은 의도적으로 발화시키지 않음 (main에서 로드 후에 리스너를 바인딩).
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
