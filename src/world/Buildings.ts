import * as THREE from 'three'
import { AssetManager } from '../assets/AssetManager'

// Key mapping from BuildingType to AssetManager key
const BUILDING_ASSET_KEYS: Record<string, string> = {
  house:     'building_house',
  shop:      'building_shop',
  cafe:      'building_cafe',
  apartment: 'building_apt',
  tower:     'building_tower',
}

// Kenney buildings are ~2 native units tall; cat is ~2.85 game units at scale 1.5.
// Scale up so buildings feel city-sized relative to the character.
const BUILDING_GLTF_SCALE: Record<string, number> = {
  house:     5,
  shop:      4,
  cafe:      4,
  apartment: 6,
  tower:     6,
}

function addWindows(g: THREE.Group, wallW: number, _wallH: number, wallZ: number, floorCount: number) {
  const winMat = new THREE.MeshToonMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.85 })
  const cols = Math.floor(wallW / 0.9)
  for (let floor = 0; floor < floorCount; floor++) {
    for (let col = 0; col < cols; col++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.06), winMat)
      win.position.set(
        (col - (cols - 1) / 2) * 0.9,
        0.6 + floor * 1.0,
        wallZ
      )
      g.add(win)
    }
  }
}

function makeHouse(): THREE.Group {
  const g = new THREE.Group()
  const bodyMat = new THREE.MeshToonMaterial({ color: 0xffd6a5 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 2.2), bodyMat)
  body.position.y = 1.0; body.castShadow = true; g.add(body)

  const stripMat = new THREE.MeshToonMaterial({ color: 0xffe0b2 })
  const strip = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 2.3), stripMat)
  strip.position.y = 2.075; g.add(strip)

  const roofMat = new THREE.MeshToonMaterial({ color: 0xf06292 })
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.4, 4), roofMat)
  roof.position.y = 3.4; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof)

  addWindows(g, 2.2, 2.0, 1.11, 1)

  const chimneyMat = new THREE.MeshToonMaterial({ color: 0xbcaaa4 })
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 6), chimneyMat)
  chimney.position.set(-0.5, 3.8, 0.3); chimney.castShadow = true; g.add(chimney)

  return g
}

function makeShop(): THREE.Group {
  const g = new THREE.Group()
  const bodyMat = new THREE.MeshToonMaterial({ color: 0xa5d6ff })
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.0, 2.0), bodyMat)
  body.position.y = 1.5; body.castShadow = true; g.add(body)

  const trimMat = new THREE.MeshToonMaterial({ color: 0x7ec8e3 })
  const trim = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 2.2), trimMat)
  trim.position.y = 3.1; g.add(trim)

  const awningMat = new THREE.MeshToonMaterial({ color: 0xffb74d })
  const awning = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.7), awningMat)
  awning.position.set(0, 1.6, 1.1); g.add(awning)

  const signMat = new THREE.MeshToonMaterial({ color: 0xfff176 })
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.1), signMat)
  sign.position.set(0, 2.5, 1.05); g.add(sign)

  addWindows(g, 2.2, 3.0, 1.01, 2)

  return g
}

function makeCafe(): THREE.Group {
  const g = new THREE.Group()
  const bodyMat = new THREE.MeshToonMaterial({ color: 0xffa5d6 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.4, 2.2), bodyMat)
  body.position.y = 1.2; body.castShadow = true; g.add(body)

  const awningMat = new THREE.MeshToonMaterial({ color: 0xf48fb1 })
  const awning = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 1.0), awningMat)
  awning.position.set(0, 2.5, 1.2); g.add(awning)

  const roofMat = new THREE.MeshToonMaterial({ color: 0xce93d8 })
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.9, 4), roofMat)
  roof.position.y = 3.0; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof)

  const winMat = new THREE.MeshToonMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.85 })
  const cols = 3
  for (let col = 0; col < cols; col++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.06), winMat)
    win.position.set((col - (cols - 1) / 2) * 0.9, 0.6, 1.11)
    g.add(win)
  }

  const seatMat = new THREE.MeshToonMaterial({ color: 0xffffff })
  for (const sx of [-0.8, 0.8]) {
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8), seatMat)
    seat.position.set(sx, 0.25, 1.5); g.add(seat)
  }

  return g
}

function makeApartment(): THREE.Group {
  const g = new THREE.Group()
  const bodyMat = new THREE.MeshToonMaterial({ color: 0xd6ffa5 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5.5, 2.4), bodyMat)
  body.position.y = 2.75; body.castShadow = true; g.add(body)

  const floorStripMat = new THREE.MeshToonMaterial({ color: 0xaed581 })
  for (const fy of [1.5, 2.5, 3.5, 4.5]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.12, 2.5), floorStripMat)
    strip.position.y = fy; g.add(strip)
  }

  const flatRoofMat = new THREE.MeshToonMaterial({ color: 0x8bc34a })
  const flatRoof = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.25, 2.6), flatRoofMat)
  flatRoof.position.y = 5.625; flatRoof.castShadow = true; g.add(flatRoof)

  addWindows(g, 2.8, 5.5, 1.21, 4)

  const towerMat = new THREE.MeshToonMaterial({ color: 0x795548 })
  const waterTower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8), towerMat)
  waterTower.position.y = 6.2; waterTower.castShadow = true; g.add(waterTower)

  return g
}

function makeTower(): THREE.Group {
  const g = new THREE.Group()
  const baseMat = new THREE.MeshToonMaterial({ color: 0xd6a5ff })
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 4.5, 8), baseMat)
  base.position.y = 2.25; base.castShadow = true; g.add(base)

  const bandMat = new THREE.MeshToonMaterial({ color: 0xce93d8 })
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.2, 8), bandMat)
  band.position.y = 4.6; g.add(band)

  const spireMat = new THREE.MeshToonMaterial({ color: 0xba68c8 })
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 8), spireMat)
  spire.position.y = 5.85; spire.castShadow = true; g.add(spire)

  const tipMat = new THREE.MeshToonMaterial({ color: 0xf8bbd0 })
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12), tipMat)
  tip.position.y = 7.05; g.add(tip)

  return g
}

export type BuildingType = 'house' | 'shop' | 'cafe' | 'apartment' | 'tower'
export const BUILDING_TYPES: BuildingType[] = ['house', 'shop', 'cafe', 'apartment', 'tower']

export function createBuilding(type: BuildingType): THREE.Group {
  const assets = AssetManager.getInstance()
  const assetKey = BUILDING_ASSET_KEYS[type]
  if (assetKey && assets.has(assetKey)) {
    const g = assets.clone(assetKey)
    const s = BUILDING_GLTF_SCALE[type] ?? 5
    g.scale.setScalar(s)
    return g
  }
  switch (type) {
    case 'house':     return makeHouse()
    case 'shop':      return makeShop()
    case 'cafe':      return makeCafe()
    case 'apartment': return makeApartment()
    case 'tower':     return makeTower()
  }
}
