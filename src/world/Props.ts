import * as THREE from 'three'
import { AssetManager } from '../assets/AssetManager'

const PROP_ASSET_KEYS: Record<string, string> = {
  tree:    'prop_tree',
  flower:  'prop_flower',
  lamp:    'prop_lamp',
  bench:   'prop_bench',
  mailbox: 'prop_mailbox',
}

// Native prop heights ~2 units; scale to feel natural next to ~2.85-unit cat.
const PROP_GLTF_SCALE: Record<string, number> = {
  tree:    4.0,
  flower:  0.4,
  lamp:    5.0,
  bench:   2.2,
  mailbox: 0.9,
}

function makeTree(): THREE.Group {
  const g = new THREE.Group()
  const trunkMat = new THREE.MeshToonMaterial({ color: 0x795548 })
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.4, 7), trunkMat)
  trunk.position.y = 0.7; trunk.castShadow = true; g.add(trunk)
  const leafMat = new THREE.MeshToonMaterial({ color: 0x43a047 })
  const leafMat2 = new THREE.MeshToonMaterial({ color: 0x66bb6a })
  const layers = [
    { r: 1.0, h: 1.2, y: 1.8, mat: leafMat },
    { r: 0.75, h: 1.0, y: 2.7, mat: leafMat2 },
    { r: 0.45, h: 0.8, y: 3.45, mat: leafMat },
  ]
  for (const l of layers) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(l.r, l.h, 7), l.mat)
    cone.position.y = l.y; cone.castShadow = true; g.add(cone)
  }
  return g
}

function makeFlower(): THREE.Group {
  const g = new THREE.Group()
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5),
    new THREE.MeshToonMaterial({ color: 0x5cb85c })
  )
  stem.position.y = 0.25; g.add(stem)
  const bloom = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 6, 5),
    new THREE.MeshToonMaterial({ color: 0xffb3c6 })
  )
  bloom.position.y = 0.6; g.add(bloom)
  return g
}

function makeLamp(): THREE.Group {
  const g = new THREE.Group()
  const poleMat = new THREE.MeshToonMaterial({ color: 0x546e7a })
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.10, 3.6, 7), poleMat)
  pole.position.y = 1.8; pole.castShadow = true; g.add(pole)
  const capMat = new THREE.MeshToonMaterial({ color: 0x37474f })
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.12, 0.18, 8), capMat)
  cap.position.y = 3.69; g.add(cap)
  const headMat = new THREE.MeshToonMaterial({ color: 0xfff8e1, emissive: 0xffd54f, emissiveIntensity: 0.9 })
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), headMat)
  head.position.y = 3.5; g.add(head)
  return g
}

function makeBench(): THREE.Group {
  const g = new THREE.Group()
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.1, 0.4),
    new THREE.MeshToonMaterial({ color: 0xc8a06e })
  )
  seat.position.y = 0.45; seat.castShadow = true; g.add(seat)
  for (const lx of [-0.45, 0.45]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.45, 0.35),
      new THREE.MeshToonMaterial({ color: 0x888888 })
    )
    leg.position.set(lx, 0.225, 0); g.add(leg)
  }
  return g
}

function makeMailbox(): THREE.Group {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6),
    new THREE.MeshToonMaterial({ color: 0x888888 })
  )
  pole.position.y = 0.5; g.add(pole)
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.3, 0.3),
    new THREE.MeshToonMaterial({ color: 0xff4444 })
  )
  box.position.y = 1.15; box.castShadow = true; g.add(box)
  return g
}

export type PropType = 'tree' | 'flower' | 'lamp' | 'bench' | 'mailbox'
export const PROP_TYPES: PropType[] = ['tree', 'flower', 'lamp', 'bench', 'mailbox']

export function createProp(type: PropType): THREE.Group {
  const assets = AssetManager.getInstance()
  const assetKey = PROP_ASSET_KEYS[type]
  if (assetKey && assets.has(assetKey)) {
    const g = assets.clone(assetKey)
    const s = PROP_GLTF_SCALE[type] ?? 1
    g.scale.setScalar(s)
    return g
  }
  switch (type) {
    case 'tree':    return makeTree()
    case 'flower':  return makeFlower()
    case 'lamp':    return makeLamp()
    case 'bench':   return makeBench()
    case 'mailbox': return makeMailbox()
  }
}
