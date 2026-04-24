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

  it('collect(id, weight=3) → totalCollected가 3 증가', () => {
    const ps = new ProgressSystem();
    ps.collect('specialty-1', 3);
    expect(ps.getTotalCollected()).toBe(3);
  });

  it('weight=3 아이템 7개면 21 → 레벨업 발생', () => {
    const ps = new ProgressSystem();
    const cb = vi.fn();
    ps.onLevelUp = cb;
    for (let i = 0; i < 7; i++) ps.collect(`sp-${i}`, 3);
    expect(ps.getTotalCollected()).toBe(21);
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(1, regionForLevel(1));
  });

  it('동일 id는 weight와 무관하게 한 번만 가산', () => {
    const ps = new ProgressSystem();
    ps.collect('x', 3);
    ps.collect('x', 3);
    expect(ps.getTotalCollected()).toBe(3);
  });

  it('setTotalCollected(42) → level 2, threshold 60으로 복원', () => {
    const ps = new ProgressSystem();
    ps.setTotalCollected(42);
    expect(ps.getTotalCollected()).toBe(42);
    expect(ps.getCurrentLevel()).toBe(2);
    expect(ps.getNextLevelThreshold()).toBe(60);
  });

  it('setTotalCollected는 onLevelUp 콜백을 발화시키지 않음', () => {
    const ps = new ProgressSystem();
    const cb = vi.fn();
    ps.onLevelUp = cb;
    ps.setTotalCollected(100);
    expect(cb).not.toHaveBeenCalled();
  });

  it('setTotalCollected(total, ids)로 복원하면 이후 동일 id 재수집이 가산되지 않음 (dedup 유지)', () => {
    const ps = new ProgressSystem();
    ps.setTotalCollected(10, ['a', 'b', 'c']);
    expect(ps.getTotalCollected()).toBe(10);
    // 재수집 시도 — dedup으로 무시되어야 함
    ps.collect('a', 3);
    ps.collect('b', 1);
    expect(ps.getTotalCollected()).toBe(10);
    // 새 id는 정상 가산
    ps.collect('d', 1);
    expect(ps.getTotalCollected()).toBe(11);
  });
});
