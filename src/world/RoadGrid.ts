import * as THREE from 'three'
import { CHUNK_SIZE } from './ChunkGenerator'

const ROAD_W   = 10   // 도로 폭
const SIDE_W   = 2    // 인도 폭
const PO = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }
const ROAD_MAT  = new THREE.MeshToonMaterial({ color: 0x9e9689, ...PO })
const SIDE_MAT  = new THREE.MeshToonMaterial({ color: 0xc8c4b8, ...PO })
const DASH_MAT  = new THREE.MeshToonMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 })
const EDGE_MAT  = new THREE.MeshToonMaterial({ color: 0xe8e0c8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 })

function addDashes(g: THREE.Group, along: 'x' | 'z', cx: number, cz: number) {
  const cx2 = (cx + 0.5) * CHUNK_SIZE
  const cz2 = (cz + 0.5) * CHUNK_SIZE
  const dashLen = 1.8, gap = 2.4, thick = 0.18, yPos = 0.032
  const start = along === 'x'
    ? cx2 - CHUNK_SIZE / 2
    : cz2 - CHUNK_SIZE / 2
  const count = Math.floor(CHUNK_SIZE / (dashLen + gap))
  for (let i = 0; i < count; i++) {
    const offset = start + i * (dashLen + gap) + dashLen / 2
    const geo = along === 'x'
      ? new THREE.PlaneGeometry(dashLen, thick)
      : new THREE.PlaneGeometry(thick, dashLen)
    const mesh = new THREE.Mesh(geo, DASH_MAT)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(
      along === 'x' ? offset : cx2,
      yPos,
      along === 'x' ? cz2 : offset
    )
    g.add(mesh)
  }
}

export function createRoadMesh(cx: number, cz: number): THREE.Group {
  const g = new THREE.Group()
  const cx2 = (cx + 0.5) * CHUNK_SIZE
  const cz2 = (cz + 0.5) * CHUNK_SIZE
  const hw = ROAD_W / 2       // 5
  const sw = SIDE_W            // 2
  const y0 = 0.02

  // ── EW 도로 (동서 방향, Z축 기준) ──
  const ewSurf = new THREE.Mesh(new THREE.PlaneGeometry(CHUNK_SIZE, ROAD_W), ROAD_MAT)
  ewSurf.rotation.x = -Math.PI / 2
  ewSurf.position.set(cx2, y0, cz2)
  ewSurf.receiveShadow = true
  g.add(ewSurf)

  // EW 인도 (북/남)
  for (const sign of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(CHUNK_SIZE, sw), SIDE_MAT)
    side.rotation.x = -Math.PI / 2
    side.position.set(cx2, y0, cz2 + sign * (hw + sw / 2))
    side.receiveShadow = true
    g.add(side)
    // 가장자리 선
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(CHUNK_SIZE, 0.15), EDGE_MAT)
    edge.rotation.x = -Math.PI / 2
    edge.position.set(cx2, y0 + 0.008, cz2 + sign * hw)
    g.add(edge)
  }

  // ── NS 도로 (남북 방향, X축 기준) ──
  const nsSurf = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, CHUNK_SIZE), ROAD_MAT)
  nsSurf.rotation.x = -Math.PI / 2
  nsSurf.position.set(cx2, y0, cz2)
  nsSurf.receiveShadow = true
  g.add(nsSurf)

  // NS 인도 (동/서)
  for (const sign of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(sw, CHUNK_SIZE), SIDE_MAT)
    side.rotation.x = -Math.PI / 2
    side.position.set(cx2 + sign * (hw + sw / 2), y0, cz2)
    side.receiveShadow = true
    g.add(side)
    // 가장자리 선
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.15, CHUNK_SIZE), EDGE_MAT)
    edge.rotation.x = -Math.PI / 2
    edge.position.set(cx2 + sign * hw, y0 + 0.008, cz2)
    g.add(edge)
  }

  // 중앙선 점선
  addDashes(g, 'x', cx, cz)
  addDashes(g, 'z', cx, cz)

  return g
}
