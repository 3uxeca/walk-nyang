import * as THREE from 'three'
import { CHUNK_SIZE } from './ChunkGenerator'

const ROAD_W   = 10   // 도로 폭
const SIDE_W   = 2    // 인도 폭
const PO = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }
const ROAD_MAT  = new THREE.MeshToonMaterial({ color: 0x9e9689, ...PO })
const SIDE_MAT  = new THREE.MeshToonMaterial({ color: 0xc8c4b8, ...PO })
const DASH_MAT  = new THREE.MeshToonMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -12 })
const EDGE_MAT_EW = new THREE.MeshToonMaterial({ color: 0xe8e0c8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 })
const EDGE_MAT_NS = new THREE.MeshToonMaterial({ color: 0xe8e0c8, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -10 })

function addDashes(g: THREE.Group, along: 'x' | 'z', cx: number, cz: number) {
  const cx2 = (cx + 0.5) * CHUNK_SIZE
  const cz2 = (cz + 0.5) * CHUNK_SIZE
  const dashLen = 1.8, gap = 2.4, thick = 0.18, yPos = 0.04
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
  const hw = ROAD_W / 2               // 5
  const sw = SIDE_W                   // 2
  const y0 = 0.02                     // 모든 도로/인도 표면 Y
  const yEdgeEW = y0 + 0.010          // EW 엣지 (도로/인도 경계선) Y
  const yEdgeNS = y0 + 0.014          // NS 엣지 Y — EW 엣지 위에 있어 교차점 z-fight 제거

  const halfChunk = CHUNK_SIZE / 2    // 16
  const nsStripLen = halfChunk - hw   // 11  (NS 도로 한 토막)
  const nsStripOff = hw + nsStripLen / 2          // 10.5
  const ewOuterLen = halfChunk - (hw + sw)        // 9   (EW 인도 바깥 토막)
  const ewOuterOff = (hw + sw) + ewOuterLen / 2   // 11.5

  // ── EW 도로 (풀 길이) ──
  const ewSurf = new THREE.Mesh(new THREE.PlaneGeometry(CHUNK_SIZE, ROAD_W), ROAD_MAT)
  ewSurf.rotation.x = -Math.PI / 2
  ewSurf.position.set(cx2, y0, cz2)
  ewSurf.receiveShadow = true
  g.add(ewSurf)

  // ── EW 인도 (N/S 각 2토막, 교차 영역은 NS 인도가 커버) ──
  for (const zSign of [-1, 1]) {
    const zPos = cz2 + zSign * (hw + sw / 2)
    for (const xSign of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(ewOuterLen, sw), SIDE_MAT)
      side.rotation.x = -Math.PI / 2
      side.position.set(cx2 + xSign * ewOuterOff, y0, zPos)
      side.receiveShadow = true
      g.add(side)
    }
    // EW 엣지 — 도로/인도 경계 (z = cz2 ± hw)
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(CHUNK_SIZE, 0.15), EDGE_MAT_EW)
    edge.rotation.x = -Math.PI / 2
    edge.position.set(cx2, yEdgeEW, cz2 + zSign * hw)
    g.add(edge)
  }

  // ── NS 도로 (N/S 2토막) ──
  for (const zSign of [-1, 1]) {
    const nsSurf = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, nsStripLen), ROAD_MAT)
    nsSurf.rotation.x = -Math.PI / 2
    nsSurf.position.set(cx2, y0, cz2 + zSign * nsStripOff)
    nsSurf.receiveShadow = true
    g.add(nsSurf)
  }

  // ── NS 인도 (E/W 각 2토막, 모서리 포함) ──
  for (const xSign of [-1, 1]) {
    const xPos = cx2 + xSign * (hw + sw / 2)
    for (const zSign of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(sw, nsStripLen), SIDE_MAT)
      side.rotation.x = -Math.PI / 2
      side.position.set(xPos, y0, cz2 + zSign * nsStripOff)
      side.receiveShadow = true
      g.add(side)
    }
    // NS 엣지 — 도로/인도 경계 (x = cx2 ± hw), 2 토막 (EW 도로 영역 건너뜀)
    for (const zSign of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.15, nsStripLen), EDGE_MAT_NS)
      edge.rotation.x = -Math.PI / 2
      edge.position.set(cx2 + xSign * hw, yEdgeNS, cz2 + zSign * nsStripOff)
      g.add(edge)
    }
  }

  // 중앙선 점선
  addDashes(g, 'x', cx, cz)
  addDashes(g, 'z', cx, cz)

  return g
}
