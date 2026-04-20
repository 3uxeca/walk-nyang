import { createSeededNoise } from '../utils/noise'
import { seededRandom, chunkSeed } from '../utils/rng'
import { BUILDING_TYPES } from './Buildings'
import type { BuildingType } from './Buildings'
import { PROP_TYPES } from './Props'
import type { PropType } from './Props'

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
  id: string  // "chunkX,chunkZ,localIdx"
  x: number   // 월드 좌표
  z: number
  type: 'star' | 'coin' | 'gem'
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
        buildings.push({
          type: BUILDING_TYPES[buildingTypeIdx],
          x: worldX,
          z: worldZ,
          rotation: Math.floor(rng() * 4) * (Math.PI / 2),
        })
      }
    }
  }

  // 소품 생성 (3-5개, 도로 밴드 제외, 청크 내부에만)
  const PROP_ROAD_BAND = 7
  const propCount = 3 + Math.floor(rng() * 3)
  for (let i = 0; i < propCount; i++) {
    const px = (cx + 0.5) * CHUNK_SIZE + (rng() - 0.5) * CHUNK_SIZE * 0.7
    const pz = (cz + 0.5) * CHUNK_SIZE + (rng() - 0.5) * CHUNK_SIZE * 0.7
    const lx = Math.abs(px - (cx + 0.5) * CHUNK_SIZE)
    const lz = Math.abs(pz - (cz + 0.5) * CHUNK_SIZE)
    if (lx < PROP_ROAD_BAND || lz < PROP_ROAD_BAND) continue
    props.push({
      type: PROP_TYPES[Math.floor(rng() * PROP_TYPES.length)],
      x: px,
      z: pz,
      rotation: rng() * Math.PI * 2,
    })
  }

  // 아이템 후보: 청크당 2-4개
  const itemTypes: ('star' | 'coin' | 'gem')[] = ['star', 'coin', 'gem']
  const itemCount = 2 + Math.floor(rng() * 3)
  for (let i = 0; i < itemCount; i++) {
    const ix = (cx + 0.5) * CHUNK_SIZE + (rng() - 0.5) * CHUNK_SIZE * 0.55
    const iz = (cz + 0.5) * CHUNK_SIZE + (rng() - 0.5) * CHUNK_SIZE * 0.55
    items.push({
      id: `${cx},${cz},${i}`,
      x: ix,
      z: iz,
      type: itemTypes[Math.floor(rng() * 3)],
    })
  }

  return { cx, cz, buildings, props, items }
}
