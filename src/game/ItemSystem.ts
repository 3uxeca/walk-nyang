import * as THREE from 'three'
import type { ItemCandidateData } from '../world/ChunkGenerator'

export const COLLECT_RADIUS = 1.5

export type CollectHandler = (id: string) => void

interface ActiveItem {
  id: string
  mesh: THREE.Group
  x: number
  z: number
}

export function filterActiveCandidates(
  candidates: ItemCandidateData[],
  collectedItemIds: Set<string>
): ItemCandidateData[] {
  return candidates.filter(c => !collectedItemIds.has(c.id))
}

export function isInCollectRange(
  itemX: number, itemZ: number,
  playerX: number, playerZ: number
): boolean {
  const dx = itemX - playerX
  const dz = itemZ - playerZ
  return Math.sqrt(dx * dx + dz * dz) < COLLECT_RADIUS
}

function makeStarShape(outerR: number, innerR: number, points: number): THREE.Shape {
  const shape = new THREE.Shape()
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

function createItemMesh(type: 'star' | 'coin' | 'gem'): THREE.Group {
  const group = new THREE.Group()

  if (type === 'star') {
    const shape = makeStarShape(0.42, 0.18, 5)
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 })
    geo.center()
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.25 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true
    group.add(mesh)

  } else if (type === 'coin') {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffc72c, emissive: 0xff8c00, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.15 })
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 24), mat)
    disc.rotation.x = Math.PI / 2
    disc.castShadow = true
    group.add(disc)

  } else {
    const mat = new THREE.MeshStandardMaterial({ color: 0xcc77ff, emissive: 0x8833dd, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.88 })
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 1), mat)
    core.castShadow = true
    group.add(core)
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xdd99ff, emissive: 0xbb44ff, emissiveIntensity: 1.0, transparent: true, opacity: 0.25, side: THREE.BackSide })
    const glow = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 1), glowMat)
    group.add(glow)
  }

  return group
}

function disposeItemMesh(group: THREE.Group) {
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

export class ItemSystem {
  private scene: THREE.Scene
  private collectedItemIds: Set<string>
  private activeItems = new Map<string, ActiveItem>()
  private onCollect: CollectHandler
  private time = 0

  constructor(scene: THREE.Scene, collectedItemIds: Set<string>, onCollect: CollectHandler) {
    this.scene = scene
    this.collectedItemIds = collectedItemIds
    this.onCollect = onCollect
  }

  addChunkItems(candidates: ItemCandidateData[]) {
    const active = filterActiveCandidates(candidates, this.collectedItemIds)
    for (const candidate of active) {
      if (this.activeItems.has(candidate.id)) continue
      const mesh = createItemMesh(candidate.type)
      mesh.position.set(candidate.x, 1.5, candidate.z)
      this.scene.add(mesh)
      this.activeItems.set(candidate.id, { id: candidate.id, mesh, x: candidate.x, z: candidate.z })
    }
  }

  removeChunkItems(cx: number, cz: number) {
    const prefix = `${cx},${cz},`
    for (const [id, item] of this.activeItems) {
      if (id.startsWith(prefix)) {
        this.scene.remove(item.mesh)
        disposeItemMesh(item.mesh)
        this.activeItems.delete(id)
      }
    }
  }

  update(delta: number, playerX: number, playerZ: number) {
    this.time += delta
    const toCollect: string[] = []

    for (const [id, item] of this.activeItems) {
      item.mesh.position.y = 1.5 + Math.sin(this.time * 2 + item.x * 0.5) * 0.3
      item.mesh.rotation.y += delta * 1.5

      if (isInCollectRange(item.x, item.z, playerX, playerZ)) {
        toCollect.push(id)
      }
    }

    for (const id of toCollect) {
      const item = this.activeItems.get(id)!
      this.scene.remove(item.mesh)
      disposeItemMesh(item.mesh)
      this.activeItems.delete(id)
      this.collectedItemIds.add(id)
      this.onCollect(id)
    }
  }

  get activeCount(): number {
    return this.activeItems.size
  }

  dispose() {
    for (const [, item] of this.activeItems) {
      this.scene.remove(item.mesh)
      disposeItemMesh(item.mesh)
    }
    this.activeItems.clear()
  }
}
