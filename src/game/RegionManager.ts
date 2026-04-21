export interface ChunkRegionState {
  regionId: number;
  state: 'locked' | 'unlocking' | 'unlocked';
}

export interface RegionInfo {
  name: string;
  emoji: string;
}

export const REGION_NAMES: Record<number, RegionInfo> = {
  0: { name: '초원 마을',   emoji: '🌿' },
  1: { name: '항구 마을',   emoji: '⚓' },
  2: { name: '숲 마을',     emoji: '🌲' },
  3: { name: '황야 마을',   emoji: '✨' },
};

export function getRegionInfo(regionId: number): RegionInfo {
  return REGION_NAMES[regionId] ?? { name: '새 마을', emoji: '🗺️' };
}

export function regionForChunk(cx: number, cz: number): number {
  return Math.floor(Math.max(Math.abs(cx), Math.abs(cz)) / 3);
}

function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export class RegionManager {
  private chunkStates = new Map<string, ChunkRegionState>();
  private unlockedRegions = new Set<number>([0]);

  isRegionUnlocked(regionId: number): boolean {
    return this.unlockedRegions.has(regionId);
  }

  registerChunk(cx: number, cz: number): void {
    const key = chunkKey(cx, cz);
    if (this.chunkStates.has(key)) return;
    const regionId = regionForChunk(cx, cz);
    const state = this.isRegionUnlocked(regionId) ? 'unlocked' : 'locked';
    this.chunkStates.set(key, { regionId, state });
  }

  getChunkState(cx: number, cz: number): 'locked' | 'unlocking' | 'unlocked' {
    const key = chunkKey(cx, cz);
    const entry = this.chunkStates.get(key);
    if (!entry) {
      const regionId = regionForChunk(cx, cz);
      return this.isRegionUnlocked(regionId) ? 'unlocked' : 'locked';
    }
    return entry.state;
  }

  unlockRegion(regionId: number): void {
    this.unlockedRegions.add(regionId);
    for (const [, entry] of this.chunkStates) {
      if (entry.regionId === regionId && entry.state === 'locked') {
        entry.state = 'unlocked';
      }
    }
  }

  getUnlockedRegions(): number[] {
    return Array.from(this.unlockedRegions);
  }
}
