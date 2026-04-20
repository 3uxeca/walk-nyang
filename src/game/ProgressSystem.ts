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

  collect(id: string): void {
    if (this.collectedIds.has(id)) return;
    this.collectedIds.add(id);
    this.totalCollected++;

    while (this.totalCollected >= this.nextLevelThreshold) {
      this.currentLevel++;
      this.nextLevelThreshold = (this.currentLevel + 1) * ITEMS_PER_LEVEL;
      const unlockedRegionId = regionForLevel(this.currentLevel);
      this.onLevelUp?.(this.currentLevel, unlockedRegionId);
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
