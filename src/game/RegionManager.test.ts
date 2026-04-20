import { describe, it, expect } from 'vitest';
import { regionForChunk, RegionManager } from './RegionManager';

describe('regionForChunk', () => {
  it('(0,0) → region 0', () => {
    expect(regionForChunk(0, 0)).toBe(0);
  });

  it('(2,2) → region 0', () => {
    expect(regionForChunk(2, 2)).toBe(0);
  });

  it('(3,0) → region 1', () => {
    expect(regionForChunk(3, 0)).toBe(1);
  });

  it('(5,5) → region 1 (Chebyshev=5, floor(5/3)=1)', () => {
    expect(regionForChunk(5, 5)).toBe(1);
  });

  it('(6,0) → region 2', () => {
    expect(regionForChunk(6, 0)).toBe(2);
  });

  it('is deterministic', () => {
    expect(regionForChunk(3, 4)).toBe(regionForChunk(3, 4));
    expect(regionForChunk(-5, 2)).toBe(regionForChunk(-5, 2));
  });

  it('handles negative coords symmetrically', () => {
    expect(regionForChunk(-3, 0)).toBe(1);
    expect(regionForChunk(0, -3)).toBe(1);
  });
});

describe('RegionManager', () => {
  it('region 0 is always unlocked', () => {
    const rm = new RegionManager();
    expect(rm.isRegionUnlocked(0)).toBe(true);
    expect(rm.isRegionUnlocked(1)).toBe(false);
  });

  it('newly registered chunk in locked region → locked', () => {
    const rm = new RegionManager();
    rm.registerChunk(3, 0); // region 1
    expect(rm.getChunkState(3, 0)).toBe('locked');
  });

  it('chunk in region 0 (always unlocked) → unlocked', () => {
    const rm = new RegionManager();
    rm.registerChunk(0, 0);
    expect(rm.getChunkState(0, 0)).toBe('unlocked');
  });

  it('unregistered chunk in unlocked region → unlocked', () => {
    const rm = new RegionManager();
    expect(rm.getChunkState(0, 0)).toBe('unlocked');
  });

  it('unregistered chunk in locked region → locked', () => {
    const rm = new RegionManager();
    expect(rm.getChunkState(3, 0)).toBe('locked');
  });

  it('unlockRegion(1): all registered region-1 chunks transition to unlocked', () => {
    const rm = new RegionManager();
    rm.registerChunk(3, 0);
    rm.registerChunk(4, 1);
    rm.registerChunk(5, 5);
    rm.unlockRegion(1);
    expect(rm.getChunkState(3, 0)).toBe('unlocked');
    expect(rm.getChunkState(4, 1)).toBe('unlocked');
    expect(rm.getChunkState(5, 5)).toBe('unlocked');
  });

  it('state transition: locked → unlocked after unlockRegion', () => {
    const rm = new RegionManager();
    rm.registerChunk(3, 0);
    expect(rm.getChunkState(3, 0)).toBe('locked');
    rm.unlockRegion(1);
    expect(rm.getChunkState(3, 0)).toBe('unlocked');
  });

  it('registerChunk after unlockRegion → immediately unlocked', () => {
    const rm = new RegionManager();
    rm.unlockRegion(1);
    rm.registerChunk(3, 0);
    expect(rm.getChunkState(3, 0)).toBe('unlocked');
  });
});
