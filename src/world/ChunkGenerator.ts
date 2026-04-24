import { createSeededNoise } from '../utils/noise'
import { seededRandom, chunkSeed } from '../utils/rng'
import { BUILDING_TYPES } from './Buildings'
import type { BuildingType } from './Buildings'
import { pickEnvironmentalProp } from './Props'
import type { PropType } from './Props'
import { regionForChunk, getRegionInfo } from '../game/RegionManager'
import type { ItemType } from '../game/ItemTypes'
import { BASE_ITEM_TYPES } from '../game/ItemTypes'

/** 지역 특산품 스폰 확률 (청크당 1회 베르누이 시도) */
export const SPECIALTY_SPAWN_CHANCE = 0.15

/**
 * house 중심에서 mailbox를 얼마나 떨어뜨릴지.
 * - Kenney GLTF house는 scale=5 × native ~2 ≈ 10 유닛 크기 → radius ~5
 * - 5.0 오프셋이면 mailbox가 집 외곽 바로 앞(도로변)에 위치
 * - 청크 중심 쪽으로 밀어내므로 localX/Z = ±12 → ±7, 도로 밴드(|l|<7) 밖에 안착
 */
const MAILBOX_OFFSET = 5.0

export const CHUNK_SIZE = 32  // 월드 유닛

export interface BuildingData {
  type: BuildingType
  x: number  // 청크 내 로컬 좌표
  z: number
  rotation: number
}

export interface PropData {
  type: PropType
  x: number
  z: number
  rotation: number
}

export interface ItemCandidateData {
  id: string  // "chunkX,chunkZ,localIdx" 또는 "chunkX,chunkZ,sp" (특산품)
  x: number   // 월드 좌표
  z: number
  type: ItemType
}

export interface ChunkData {
  cx: number
  cz: number
  buildings: BuildingData[]
  props: PropData[]
  items: ItemCandidateData[]
}

export function generateChunk(cx: number, cz: number, worldSeed: number): ChunkData {
  const seed = chunkSeed(worldSeed, cx, cz)
  const rng = seededRandom(seed)
  const noise = createSeededNoise(seed)

  const buildings: BuildingData[] = []
  const props: PropData[] = []
  const items: ItemCandidateData[] = []
  const GRID = 8  // 4x4 그리드 셀

  for (let gz = 0; gz < 4; gz++) {
    for (let gx = 0; gx < 4; gx++) {
      const localX = (gx - 1.5) * GRID
      const localZ = (gz - 1.5) * GRID
      const worldX = cx * CHUNK_SIZE + CHUNK_SIZE / 2 + localX
      const worldZ = cz * CHUNK_SIZE + CHUNK_SIZE / 2 + localZ

      // 도로 셀 (중앙 행/열) 건너뜀 — 한 축이라도 도로면 스킵
      const isRoadX = gx === 1 || gx === 2
      const isRoadZ = gz === 1 || gz === 2
      if (isRoadX || isRoadZ) continue

      const n = noise(worldX * 0.05, worldZ * 0.05)
      if (n > 0.1) {
        const buildingTypeIdx = Math.floor(rng() * BUILDING_TYPES.length)
        const type = BUILDING_TYPES[buildingTypeIdx]
        const rotation = Math.floor(rng() * 4) * (Math.PI / 2)
        buildings.push({ type, x: worldX, z: worldZ, rotation })
      }
    }
  }

  const regionId = regionForChunk(cx, cz)

  // 환경 소품 생성 (3-5개, 도로 밴드 제외, 청크 내부에만). 지역별 시그니처 소품 가중치 적용.
  const PROP_ROAD_BAND = 7
  const propCount = 3 + Math.floor(rng() * 3)
  for (let i = 0; i < propCount; i++) {
    const px = (cx + 0.5) * CHUNK_SIZE + (rng() - 0.5) * CHUNK_SIZE * 0.7
    const pz = (cz + 0.5) * CHUNK_SIZE + (rng() - 0.5) * CHUNK_SIZE * 0.7
    const lx = Math.abs(px - (cx + 0.5) * CHUNK_SIZE)
    const lz = Math.abs(pz - (cz + 0.5) * CHUNK_SIZE)
    if (lx < PROP_ROAD_BAND || lz < PROP_ROAD_BAND) continue
    props.push({
      type: pickEnvironmentalProp(regionId, rng),
      x: px,
      z: pz,
      rotation: rng() * Math.PI * 2,
    })
  }

  // house 동반 mailbox — 각 house 옆에 1개씩 확정 배치 ("집 앞 우편함").
  // 청크 중심을 향한 방향으로 오프셋해 도로 밴드에 걸리지 않도록.
  for (const b of buildings) {
    if (b.type !== 'house') continue
    const chunkCenterX = (cx + 0.5) * CHUNK_SIZE
    const chunkCenterZ = (cz + 0.5) * CHUNK_SIZE
    // 주 축을 따라 안쪽으로 — localX/Z 중 절대값이 큰 쪽으로 밀어내는 단위 벡터
    const dxToCenter = chunkCenterX - b.x
    const dzToCenter = chunkCenterZ - b.z
    const useX = Math.abs(dxToCenter) >= Math.abs(dzToCenter)
    const off = useX
      ? { x: Math.sign(dxToCenter) * MAILBOX_OFFSET, z: 0 }
      : { x: 0, z: Math.sign(dzToCenter) * MAILBOX_OFFSET }
    props.push({
      type: 'mailbox',
      x: b.x + off.x,
      z: b.z + off.z,
      rotation: Math.atan2(-off.x, -off.z),  // mailbox가 집을 향하도록
    })
  }

  // 기본 아이템 후보: 청크당 2-4개 (지역 무관 공통 풀)
  const itemCount = 2 + Math.floor(rng() * 3)
  for (let i = 0; i < itemCount; i++) {
    const ix = (cx + 0.5) * CHUNK_SIZE + (rng() - 0.5) * CHUNK_SIZE * 0.55
    const iz = (cz + 0.5) * CHUNK_SIZE + (rng() - 0.5) * CHUNK_SIZE * 0.55
    items.push({
      id: `${cx},${cz},${i}`,
      x: ix,
      z: iz,
      type: BASE_ITEM_TYPES[Math.floor(rng() * BASE_ITEM_TYPES.length)],
    })
  }

  // 지역 특산품: 확률적으로 1개 추가. 수집 시 weight=3이라 기본보다 훨씬 값짐.
  const specialty = getRegionInfo(regionId).specialty
  if (specialty && rng() < SPECIALTY_SPAWN_CHANCE) {
    const ix = (cx + 0.5) * CHUNK_SIZE + (rng() - 0.5) * CHUNK_SIZE * 0.55
    const iz = (cz + 0.5) * CHUNK_SIZE + (rng() - 0.5) * CHUNK_SIZE * 0.55
    items.push({
      id: `${cx},${cz},sp`,  // 기본과 충돌 방지 위해 인덱스 대신 'sp' 접미사
      x: ix,
      z: iz,
      type: specialty.itemType,
    })
  }

  return { cx, cz, buildings, props, items }
}
