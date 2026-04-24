import * as THREE from 'three'
import type { ItemCandidateData } from '../world/ChunkGenerator'
import type { ItemType } from './ItemTypes'

export const COLLECT_RADIUS = 1.5

export type CollectHandler = (id: string, type: ItemType) => void

interface ActiveItem {
  id: string
  type: ItemType
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

function createItemMesh(type: ItemType): THREE.Group {
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

  } else if (type === 'gem') {
    const mat = new THREE.MeshStandardMaterial({ color: 0xcc77ff, emissive: 0x8833dd, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.88 })
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 1), mat)
    core.castShadow = true
    group.add(core)
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xdd99ff, emissive: 0xbb44ff, emissiveIntensity: 1.0, transparent: true, opacity: 0.25, side: THREE.BackSide })
    const glow = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 1), glowMat)
    group.add(glow)

  } else if (type === 'flower') {
    // 초원 특산품 — 노란 중심 + 5장 분홍 꽃잎
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffcc33, emissiveIntensity: 0.4 })
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), centerMat)
    center.castShadow = true
    group.add(center)
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xff8fb1, emissive: 0xff6a9b, emissiveIntensity: 0.3, roughness: 0.4 })
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), petalMat)
      petal.scale.set(1.0, 0.3, 1.0)
      petal.position.set(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3)
      petal.castShadow = true
      group.add(petal)
    }

  } else if (type === 'fish') {
    // 항구 특산품 — 방추형 시안 몸체 + 삼각 꼬리
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x7ec8e3, emissive: 0x4aa3c8, emissiveIntensity: 0.3, metalness: 0.4, roughness: 0.35 })
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), bodyMat)
    body.scale.set(1.4, 0.9, 0.9)
    body.castShadow = true
    group.add(body)
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.26, 8), bodyMat)
    tail.rotation.z = Math.PI / 2
    tail.position.x = -0.44
    tail.castShadow = true
    group.add(tail)
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x000000, roughness: 0.2 })
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeMat)
    eye.position.set(0.24, 0.1, 0.2)
    group.add(eye)

  } else if (type === 'clover') {
    // 숲 특산품 — 4장 초록 잎 십자 배치 + 연한 중심
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x7ccc4a, emissive: 0x4a9a28, emissiveIntensity: 0.4, roughness: 0.5 })
    const positions: Array<[number, number]> = [[0, 0.22], [0, -0.22], [0.22, 0], [-0.22, 0]]
    for (const [dx, dz] of positions) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), leafMat)
      leaf.scale.set(0.9, 0.35, 0.9)
      leaf.position.set(dx, 0, dz)
      leaf.castShadow = true
      group.add(leaf)
    }
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xcce88a, emissive: 0xaad070, emissiveIntensity: 0.5 })
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), centerMat)
    group.add(center)

  } else if (type === 'droplet') {
    // 황야 특산품 — 반투명 파란 물방울 (구 + 원뿔)
    const mat = new THREE.MeshStandardMaterial({ color: 0x6ec8ff, emissive: 0x3397e8, emissiveIntensity: 0.45, transparent: true, opacity: 0.85, roughness: 0.1, metalness: 0.25 })
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 14), mat)
    sphere.position.y = -0.1
    sphere.castShadow = true
    group.add(sphere)
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.38, 14), mat)
    cone.position.y = 0.18
    cone.castShadow = true
    group.add(cone)
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbbffff, emissiveIntensity: 0.9, transparent: true, opacity: 0.6 })
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), glowMat)
    glow.position.set(-0.09, -0.05, 0.1)
    group.add(glow)
  } else {
    // 새 ItemType을 추가했는데 여기서 처리 분기를 빠뜨렸다는 컴파일 타임 경고.
    const _exhaustive: never = type
    throw new Error(`Unknown item type: ${String(_exhaustive)}`)
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
      this.activeItems.set(candidate.id, { id: candidate.id, type: candidate.type, mesh, x: candidate.x, z: candidate.z })
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
      this.onCollect(id, item.type)
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
