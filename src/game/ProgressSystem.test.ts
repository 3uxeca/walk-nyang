import { describe, it, expect, vi } from 'vitest';
import { calcLevel, ProgressSystem, ITEMS_PER_LEVEL } from './ProgressSystem';

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

describe('ProgressSystem', () => {
  it('collect는 신규 수집 시 true 반환, dedup 시 false', () => {
    const ps = new ProgressSystem();
    expect(ps.collect('x')).toBe(true);
    expect(ps.collect('x')).toBe(false);
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

  it('weight=3 아이템 7개면 21 → currentLevel이 1로 진입', () => {
    const ps = new ProgressSystem();
    for (let i = 0; i < 7; i++) ps.collect(`sp-${i}`, 3);
    expect(ps.getTotalCollected()).toBe(21);
    expect(ps.getCurrentLevel()).toBe(1);
    expect(ps.getNextLevelThreshold()).toBe(40);
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

  it('setTotalCollected는 onRegionUnlock 콜백을 발화시키지 않음', () => {
    const ps = new ProgressSystem();
    const cb = vi.fn();
    ps.onRegionUnlock = cb;
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

describe('ProgressSystem 특산품 기반 언락', () => {
  it('recordSpecialty 3회면 onRegionUnlock이 regionId+1로 1회 발화', () => {
    const ps = new ProgressSystem();
    const cb = vi.fn();
    ps.onRegionUnlock = cb;
    ps.recordSpecialty(0);
    ps.recordSpecialty(0);
    expect(cb).not.toHaveBeenCalled();
    ps.recordSpecialty(0);
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(1);
  });

  it('임계치 이후 추가 수집은 언락 콜백을 다시 발화시키지 않음', () => {
    const ps = new ProgressSystem();
    const cb = vi.fn();
    ps.onRegionUnlock = cb;
    for (let i = 0; i < 6; i++) ps.recordSpecialty(0);
    expect(cb).toHaveBeenCalledOnce();
    expect(ps.getSpecialtyCount(0)).toBe(6);
  });

  it('다른 지역의 카운트는 독립적으로 누적', () => {
    const ps = new ProgressSystem();
    const cb = vi.fn();
    ps.onRegionUnlock = cb;
    ps.recordSpecialty(0);
    ps.recordSpecialty(1);
    ps.recordSpecialty(2);
    expect(cb).not.toHaveBeenCalled();
    expect(ps.getSpecialtyCount(0)).toBe(1);
    expect(ps.getSpecialtyCount(1)).toBe(1);
    expect(ps.getSpecialtyCount(2)).toBe(1);
  });

  it('마지막 지역(3) 3개 채워도 콜백은 발화 (주체가 가드 책임) — nextRegionId=4', () => {
    const ps = new ProgressSystem();
    const cb = vi.fn();
    ps.onRegionUnlock = cb;
    ps.recordSpecialty(3);
    ps.recordSpecialty(3);
    ps.recordSpecialty(3);
    expect(cb).toHaveBeenCalledWith(4);
    // 호출자(main)가 `4 in REGION_NAMES` 체크로 drop 처리 — ProgressSystem은 관여 안 함.
  });

  it('setSpecialtyCounts/ getSpecialtyCountsSnapshot round-trip', () => {
    const ps = new ProgressSystem();
    ps.setSpecialtyCounts({ 0: 3, 1: 1, 2: 0 });
    expect(ps.getSpecialtyCount(0)).toBe(3);
    expect(ps.getSpecialtyCount(1)).toBe(1);
    expect(ps.getSpecialtyCount(2)).toBe(0);
    expect(ps.getSpecialtyCountsSnapshot()).toEqual({ 0: 3, 1: 1, 2: 0 });
  });

  it('setSpecialtyCounts는 onRegionUnlock을 발화시키지 않음 (로드 시 조용함)', () => {
    const ps = new ProgressSystem();
    const cb = vi.fn();
    ps.onRegionUnlock = cb;
    ps.setSpecialtyCounts({ 0: 5, 1: 5 });
    expect(cb).not.toHaveBeenCalled();
  });

  it('setSpecialtyCounts는 비정상 키/값을 스킵 (localStorage 수동 편집 방어)', () => {
    const ps = new ProgressSystem();
    // 숫자 아닌 키, 숫자 아닌 값, NaN 등 섞어 넣음
    const poisoned: Record<string, unknown> = {
      '0': 2,              // valid
      'abc': 99,           // key NaN → drop
      '1': 'oops',         // value string → drop
      '2': NaN,            // value NaN → drop
      '3': Infinity,       // value Infinity → drop
    };
    ps.setSpecialtyCounts(poisoned as Record<number, number>);
    expect(ps.getSpecialtyCount(0)).toBe(2);
    expect(ps.getSpecialtyCount(1)).toBe(0);
    expect(ps.getSpecialtyCount(2)).toBe(0);
    expect(ps.getSpecialtyCount(3)).toBe(0);
    // snapshot에도 valid 엔트리만
    expect(ps.getSpecialtyCountsSnapshot()).toEqual({ 0: 2 });
  });
});
