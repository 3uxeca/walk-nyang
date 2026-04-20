import { describe, it, expect, vi } from 'vitest';
import { calcLevel, regionForLevel, ProgressSystem, ITEMS_PER_LEVEL } from './ProgressSystem';

describe('calcLevel', () => {
  it('19 items → level 0', () => {
    expect(calcLevel(19).level).toBe(0);
  });

  it('20 items → level 1', () => {
    expect(calcLevel(20).level).toBe(1);
  });

  it('39 items → level 1', () => {
    expect(calcLevel(39).level).toBe(1);
  });

  it('40 items → level 2', () => {
    expect(calcLevel(40).level).toBe(2);
  });

  it('threshold is next level boundary', () => {
    expect(calcLevel(0).threshold).toBe(ITEMS_PER_LEVEL);
    expect(calcLevel(20).threshold).toBe(40);
  });
});

describe('regionForLevel', () => {
  it('is deterministic', () => {
    for (let i = 0; i < 10; i++) {
      expect(regionForLevel(i)).toBe(regionForLevel(i));
    }
  });

  it('level 1 → region 1', () => {
    expect(regionForLevel(1)).toBe(1);
  });

  it('level 0 → region 0', () => {
    expect(regionForLevel(0)).toBe(0);
  });
});

describe('ProgressSystem', () => {
  it('collecting 19 items → onLevelUp NOT called', () => {
    const ps = new ProgressSystem();
    const cb = vi.fn();
    ps.onLevelUp = cb;
    for (let i = 0; i < 19; i++) ps.collect(`item-${i}`);
    expect(cb).not.toHaveBeenCalled();
  });

  it('collecting 20 items → onLevelUp called with level=1', () => {
    const ps = new ProgressSystem();
    const cb = vi.fn();
    ps.onLevelUp = cb;
    for (let i = 0; i < 20; i++) ps.collect(`item-${i}`);
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(1, regionForLevel(1));
  });

  it('duplicate ids are not counted twice', () => {
    const ps = new ProgressSystem();
    ps.collect('x');
    ps.collect('x');
    expect(ps.getTotalCollected()).toBe(1);
  });

  it('tracks currentLevel and nextLevelThreshold', () => {
    const ps = new ProgressSystem();
    expect(ps.getCurrentLevel()).toBe(0);
    expect(ps.getNextLevelThreshold()).toBe(ITEMS_PER_LEVEL);
    for (let i = 0; i < 20; i++) ps.collect(`item-${i}`);
    expect(ps.getCurrentLevel()).toBe(1);
    expect(ps.getNextLevelThreshold()).toBe(40);
  });
});
