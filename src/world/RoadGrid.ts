import * as THREE from 'three'
import { CHUNK_SIZE } from './ChunkGenerator'

const ROAD_MAT = new THREE.MeshToonMaterial({ color: 0xc8bfa0 })

export function createRoadMesh(cx: number, cz: number): THREE.Group {
  const g = new THREE.Group()
  const hw = 1.5  // 도로 반폭

  // 동서 도로
  const ewRoad = new THREE.Mesh(
    new THREE.PlaneGeometry(CHUNK_SIZE, hw * 2),
    ROAD_MAT
  )
  ewRoad.rotation.x = -Math.PI / 2
  ewRoad.position.set(cx * CHUNK_SIZE, 0.01, cz * CHUNK_SIZE)
  ewRoad.receiveShadow = true
  g.add(ewRoad)

  // 남북 도로
  const nsRoad = new THREE.Mesh(
    new THREE.PlaneGeometry(hw * 2, CHUNK_SIZE),
    ROAD_MAT
  )
  nsRoad.rotation.x = -Math.PI / 2
  nsRoad.position.set(cx * CHUNK_SIZE, 0.01, cz * CHUNK_SIZE)
  nsRoad.receiveShadow = true
  g.add(nsRoad)

  return g
}
