import * as THREE from 'three'
import type { ChunkData } from './ChunkGenerator'
import { CHUNK_SIZE } from './ChunkGenerator'
import { createBuilding } from './Buildings'
import { createProp } from './Props'
import { createRoadMesh } from './RoadGrid'
import { regionForChunk } from '../game/RegionManager'
import { getPlatformsInChunk } from './Terrain'
import { WORLD_SEED } from './ChunkManager'
import { registerChunkColliders, unregisterChunkColliders } from './BuildingColliders'

const BUILDING_COLLIDER_RADIUS = 3.8

const REGION_PALETTES = [
  { ground: 0xa8d8a8 }, // 0: Meadow
  { ground: 0x9bb5c8 }, // 1: Harbor
  { ground: 0x7ab87a }, // 2: Forest
  { ground: 0xc8b89a }, // 3: Wildlands
]

function getRegionPalette(regionId: number) {
  return REGION_PALETTES[regionId % REGION_PALETTES.length]
}

export function buildChunkMesh(data: ChunkData, scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group()

  const regionId = regionForChunk(data.cx, data.cz)
  const palette = getRegionPalette(regionId)
  const groundGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE)
  const groundMat = new THREE.MeshToonMaterial({ color: palette.ground })
  const groundMesh = new THREE.Mesh(groundGeo, groundMat)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.position.set(data.cx * CHUNK_SIZE, 0.005, data.cz * CHUNK_SIZE)
  groundMesh.receiveShadow = true
  group.add(groundMesh)

  const road = createRoadMesh(data.cx, data.cz)
  group.add(road)

  for (const b of data.buildings) {
    const mesh = createBuilding(b.type)
    mesh.position.set(b.x, 0, b.z)
    mesh.rotation.y = b.rotation
    mesh.traverse(o => { if (o instanceof THREE.Mesh) o.userData.occludable = true })
    group.add(mesh)
  }

  registerChunkColliders(data.cx, data.cz, data.buildings.map(b => ({ x: b.x, z: b.z, radius: BUILDING_COLLIDER_RADIUS })))
  group.userData.chunkKey = `${data.cx},${data.cz}`

  for (const p of data.props) {
    const mesh = createProp(p.type)
    mesh.position.set(p.x, 0, p.z)
    mesh.rotation.y = p.rotation
    group.add(mesh)
  }

  const platforms = getPlatformsInChunk(data.cx, data.cz, CHUNK_SIZE, WORLD_SEED)
  for (const p of platforms) {
    const regionId = regionForChunk(data.cx, data.cz)
    const palette = getRegionPalette(regionId)
    // Platform slab
    const slabGeo = new THREE.BoxGeometry(p.w, p.h, p.d)
    const slabMat = new THREE.MeshToonMaterial({ color: palette.ground })
    const slab = new THREE.Mesh(slabGeo, slabMat)
    slab.position.set(p.x, p.h / 2, p.z)
    slab.castShadow = true
    slab.receiveShadow = true
    group.add(slab)
    // Top surface slightly lighter
    const topGeo = new THREE.BoxGeometry(p.w + 0.08, 0.12, p.d + 0.08)
    const topColor = new THREE.Color(palette.ground).multiplyScalar(1.15)
    const topMat = new THREE.MeshToonMaterial({ color: topColor })
    const top = new THREE.Mesh(topGeo, topMat)
    top.position.set(p.x, p.h + 0.06, p.z)
    top.receiveShadow = true
    group.add(top)
  }

  scene.add(group)
  return group
}

export function buildProxyMesh(cx: number, cz: number, scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group()
  const geo = new THREE.BoxGeometry(CHUNK_SIZE, 0.5, CHUNK_SIZE)
  const mat = new THREE.MeshToonMaterial({ color: 0xcccccc, transparent: true, opacity: 0.45 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(cx * CHUNK_SIZE, 0.25, cz * CHUNK_SIZE)
  group.add(mesh)
  scene.add(group)
  return group
}

export function disposeChunkMesh(group: THREE.Group, scene: THREE.Scene) {
  const key = group.userData.chunkKey as string | undefined
  if (key) {
    const [cx, cz] = key.split(',').map(Number)
    unregisterChunkColliders(cx, cz)
  }
  scene.remove(group)
  group.traverse(obj => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose())
      } else {
        obj.material.dispose()
      }
    }
  })
}
