import { describe, it, expect } from 'vitest'
import { generateChunk } from './ChunkGenerator'
import { getRegionInfo, regionForChunk } from '../game/RegionManager'
import { BASE_ITEM_TYPES } from '../game/ItemTypes'

describe('generateChunk 결정성', () => {
  it('동일 좌표+시드 → 동일 결과', () => {
    const a = generateChunk(3, -2, 12345)
    const b = generateChunk(3, -2, 12345)
    expect(a.buildings.length).toBe(b.buildings.length)
    expect(a.buildings).toEqual(b.buildings)
    expect(a.items).toEqual(b.items)
  })

  it('다른 청크 좌표 → 다른 결과', () => {
    const a = generateChunk(0, 0, 12345)
    const b = generateChunk(1, 0, 12345)
    // buildings나 items 중 하나는 달라야 함
    const same = JSON.stringify(a.buildings) === JSON.stringify(b.buildings)
      && JSON.stringify(a.items) === JSON.stringify(b.items)
    expect(same).toBe(false)
  })

  it('아이템 id 형식이 "cx,cz,localIdx" 또는 "cx,cz,sp"(특산품)', () => {
    const data = generateChunk(3, -2, 12345)
    for (const item of data.items) {
      expect(item.id).toMatch(/^-?\d+,-?\d+,(\d+|sp)$/)
      expect(item.id.startsWith('3,-2,')).toBe(true)
    }
  })

  it('아이템 수는 기본 2-4개 + 특산품 확률적 1개 (총 2-5개)', () => {
    for (let i = 0; i < 10; i++) {
      const data = generateChunk(i, i, 12345)
      expect(data.items.length).toBeGreaterThanOrEqual(2)
      expect(data.items.length).toBeLessThanOrEqual(5)
    }
  })
})

describe('generateChunk 지역 특산품', () => {
  it('특산품 id는 "sp" 접미사를 갖고, 타입은 해당 지역의 specialty.itemType과 일치', () => {
    // 여러 시드로 시도해 특산품이 스폰된 케이스 하나를 잡음 (15% 확률)
    let found = false
    for (let seed = 0; seed < 200 && !found; seed++) {
      const data = generateChunk(0, 0, seed)  // region 0 = 초원 → 꽃
      const specialty = data.items.find(i => i.id.endsWith(',sp'))
      if (specialty) {
        const expected = getRegionInfo(regionForChunk(0, 0)).specialty
        expect(expected).toBeDefined()
        expect(specialty.type).toBe(expected!.itemType)
        found = true
      }
    }
    expect(found).toBe(true)  // 200 시드면 (1-0.85^200) ≈ 100% 확률로 스폰됨
  })

  it('특산품이 없을 때 기본 아이템만 스폰되며 타입은 BASE_ITEM_TYPES 내', () => {
    const data = generateChunk(5, 5, 12345)  // 특정 시드 고정
    const regular = data.items.filter(i => !i.id.endsWith(',sp'))
    expect(regular.length).toBeGreaterThanOrEqual(2)
    for (const item of regular) {
      expect(BASE_ITEM_TYPES).toContain(item.type)
    }
  })

  it('같은 청크·시드에서 특산품 스폰 여부가 결정적', () => {
    const a = generateChunk(2, -1, 77777)
    const b = generateChunk(2, -1, 77777)
    const hasSpecialtyA = a.items.some(i => i.id.endsWith(',sp'))
    const hasSpecialtyB = b.items.some(i => i.id.endsWith(',sp'))
    expect(hasSpecialtyA).toBe(hasSpecialtyB)
  })
})

describe('generateChunk 지역별 소품 팔레트', () => {
  // 지역별 시그니처 소품 (Props.PROP_WEIGHT_BY_REGION)
  // 0 초원 → flower, 1 항구 → bench, 2 숲 → tree, 3 황야 → lamp
  //
  // 집계는 "해당 지역 청크 다수 생성"으로 하되, regionForChunk()의 공식은
  // Math.max(|cx|, |cz|) / 3 이라 region 0 ≈ 중앙 3x3, region 1은 그 다음 링.
  // 테스트에선 region 0에 해당하는 청크 좌표(|cx|,|cz| ≤ 2) 여러 곳을 샘플링.

  function countByType(seeds: number[], coords: Array<[number, number]>) {
    const counts: Record<string, number> = {}
    for (const seed of seeds) {
      for (const [cx, cz] of coords) {
        for (const p of generateChunk(cx, cz, seed).props) {
          counts[p.type] = (counts[p.type] ?? 0) + 1
        }
      }
    }
    return counts
  }

  it('region 0(초원)에서는 flower가 나머지 환경 소품 각각보다 많이 나옴', () => {
    // region 0 청크 4종 × 시드 15종 = 60 샘플
    const coords: Array<[number, number]> = [[0, 0], [1, 0], [0, 1], [-1, -1]]
    const seeds = Array.from({ length: 15 }, (_, i) => 1000 + i)
    const counts = countByType(seeds, coords)
    expect(counts.flower ?? 0).toBeGreaterThan(counts.tree ?? 0)
    expect(counts.flower ?? 0).toBeGreaterThan(counts.bench ?? 0)
    expect(counts.flower ?? 0).toBeGreaterThan(counts.lamp ?? 0)
  })

  it('region 2(숲)에서는 tree가 나머지 환경 소품 각각보다 많이 나옴', () => {
    // |cx| 또는 |cz|의 최대값이 6~8 범위면 region 2
    const coords: Array<[number, number]> = [[6, 0], [-7, 0], [0, 7], [6, 6]]
    const seeds = Array.from({ length: 15 }, (_, i) => 2000 + i)
    const counts = countByType(seeds, coords)
    expect(counts.tree ?? 0).toBeGreaterThan(counts.flower ?? 0)
    expect(counts.tree ?? 0).toBeGreaterThan(counts.bench ?? 0)
    expect(counts.tree ?? 0).toBeGreaterThan(counts.lamp ?? 0)
  })

  it('환경 소품 롤에서 mailbox가 섞여나오지 않음 (house 동반 경로로만 스폰)', () => {
    let checkedHouseless = false
    // 여러 청크·시드 섞어 house가 없는 케이스 확보
    for (let seed = 0; seed < 80 && !checkedHouseless; seed++) {
      for (const [cx, cz] of [[0, 0], [1, 1], [-1, -1], [2, -2]] as Array<[number, number]>) {
        const data = generateChunk(cx, cz, seed)
        const hasHouse = data.buildings.some(b => b.type === 'house')
        if (!hasHouse) {
          const mailboxes = data.props.filter(p => p.type === 'mailbox')
          expect(mailboxes.length).toBe(0)
          checkedHouseless = true
          break
        }
      }
    }
    // house-free 케이스를 반드시 한 번은 검증했어야 함 — 없으면 노이즈 설정이 너무 빡빡.
    expect(checkedHouseless).toBe(true)
  })

  it('모든 house 옆에 mailbox가 세트로 하나씩 배치됨', () => {
    // house가 있는 청크 10개 찾아 house 수 == mailbox 수 확인
    let checked = 0
    for (let seed = 0; seed < 80 && checked < 10; seed++) {
      for (const cx of [0, 1, -1, 2, -2]) {
        const data = generateChunk(cx, 0, seed)
        const houses = data.buildings.filter(b => b.type === 'house')
        const mailboxes = data.props.filter(p => p.type === 'mailbox')
        if (houses.length > 0) {
          expect(mailboxes.length).toBe(houses.length)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(0)  // 적어도 한 케이스 검증
  })

  it('mailbox 위치는 대응 house 근처 (≈ MAILBOX_OFFSET)', () => {
    let checked = false
    for (let seed = 0; seed < 40 && !checked; seed++) {
      const data = generateChunk(0, 0, seed)
      const houses = data.buildings.filter(b => b.type === 'house')
      const mailboxes = data.props.filter(p => p.type === 'mailbox')
      if (houses.length === 0) continue
      for (const mbox of mailboxes) {
        const nearest = Math.min(
          ...houses.map(h => Math.hypot(mbox.x - h.x, mbox.z - h.z))
        )
        // offset 5.0이므로 하우스 중심에서 정확히 5 유닛 거리
        expect(nearest).toBeGreaterThan(4.9)
        expect(nearest).toBeLessThan(5.1)
      }
      checked = true
    }
    expect(checked).toBe(true)
  })
})
