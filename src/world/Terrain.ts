import { seededRandom, chunkSeed } from '../utils/rng'

const PLATFORM_CELL = 14  // world units per platform grid cell
const CHUNK_SIZE = 32
const BUILDING_GRID = 8
// Minimum distance from a building grid slot center to a platform center.
// = platform half-width (~5.75) + generous building half-footprint (~4)
const BUILDING_CLEARANCE = 10

function hasBuildingNearby(worldX: number, worldZ: number): boolean {
  const cx0 = Math.floor((worldX - BUILDING_CLEARANCE) / CHUNK_SIZE)
  const cx1 = Math.floor((worldX + BUILDING_CLEARANCE) / CHUNK_SIZE)
  const cz0 = Math.floor((worldZ - BUILDING_CLEARANCE) / CHUNK_SIZE)
  const cz1 = Math.floor((worldZ + BUILDING_CLEARANCE) / CHUNK_SIZE)
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cz = cz0; cz <= cz1; cz++) {
      for (let gz = 0; gz < 4; gz++) {
        for (let gx = 0; gx < 4; gx++) {
          if ((gx === 1 || gx === 2) && (gz === 1 || gz === 2)) continue
          const bx = cx * CHUNK_SIZE + (gx - 1.5) * BUILDING_GRID
          const bz = cz * CHUNK_SIZE + (gz - 1.5) * BUILDING_GRID
          if (Math.abs(bx - worldX) < BUILDING_CLEARANCE &&
              Math.abs(bz - worldZ) < BUILDING_CLEARANCE) return true
        }
      }
    }
  }
  return false
}

export function getTerrainHeight(worldX: number, worldZ: number, worldSeed: number): number {
  const cx = Math.floor(worldX / PLATFORM_CELL)
  const cz = Math.floor(worldZ / PLATFORM_CELL)
  const seed = chunkSeed(worldSeed, cx * 7, cz * 13)
  const rng = seededRandom(seed)

  if (rng() > 0.72) {  // ~28% cells have a raised platform
    const h = 0.6 + Math.floor(rng() * 3) * 0.5  // 0.6, 1.1, or 1.6 units
    const cellOriginX = cx * PLATFORM_CELL
    const cellOriginZ = cz * PLATFORM_CELL
    const margin = PLATFORM_CELL * 0.18
    const pw = PLATFORM_CELL - margin * 2
    const platCenterX = cellOriginX + margin + pw / 2
    const platCenterZ = cellOriginZ + margin + pw / 2
    if (!hasBuildingNearby(platCenterX, platCenterZ)) {
      const lx = worldX - cellOriginX
      const lz = worldZ - cellOriginZ
      if (lx >= margin && lx <= PLATFORM_CELL - margin &&
          lz >= margin && lz <= PLATFORM_CELL - margin) {
        return h
      }
    }
  }
  return 0
}

export function getPlatformsInChunk(
  cx: number, cz: number,
  chunkSize: number, worldSeed: number
): Array<{ x: number; z: number; w: number; d: number; h: number }> {
  const platforms = []
  const worldOriginX = cx * chunkSize
  const worldOriginZ = cz * chunkSize

  const cellsPerChunk = Math.ceil(chunkSize / PLATFORM_CELL) + 1
  const startCX = Math.floor(worldOriginX / PLATFORM_CELL)
  const startCZ = Math.floor(worldOriginZ / PLATFORM_CELL)

  for (let dcz = 0; dcz < cellsPerChunk; dcz++) {
    for (let dcx = 0; dcx < cellsPerChunk; dcx++) {
      const pcx = startCX + dcx
      const pcz = startCZ + dcz
      const seed = chunkSeed(worldSeed, pcx * 7, pcz * 13)
      const rng = seededRandom(seed)
      if (rng() > 0.72) {
        const h = 0.6 + Math.floor(rng() * 3) * 0.5
        const cellOriginX = pcx * PLATFORM_CELL
        const cellOriginZ = pcz * PLATFORM_CELL
        const margin = PLATFORM_CELL * 0.18
        const pw = PLATFORM_CELL - margin * 2
        const pd = PLATFORM_CELL - margin * 2
        const px = cellOriginX + margin + pw / 2
        const pz = cellOriginZ + margin + pd / 2
        if (hasBuildingNearby(px, pz)) continue
        // Only include if platform center is near this chunk
        if (Math.abs(px - cx * chunkSize) < chunkSize + 8 &&
            Math.abs(pz - cz * chunkSize) < chunkSize + 8) {
          platforms.push({ x: px, z: pz, w: pw, d: pd, h })
        }
      }
    }
  }
  return platforms
}
