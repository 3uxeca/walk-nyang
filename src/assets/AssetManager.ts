import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'

interface ModelEntry {
  scene: THREE.Group
  animations: THREE.AnimationClip[]
  isSkinned: boolean
}

export class AssetManager {
  private static _instance: AssetManager | null = null
  private models = new Map<string, ModelEntry>()
  private loader = new GLTFLoader()

  static getInstance(): AssetManager {
    if (!AssetManager._instance) AssetManager._instance = new AssetManager()
    return AssetManager._instance
  }

  async preload(manifest: { key: string; url: string }[]): Promise<void> {
    await Promise.all(manifest.map(({ key, url }) => this.tryLoad(key, url)))
  }

  private async tryLoad(key: string, url: string): Promise<void> {
    try {
      const gltf = await this.loader.loadAsync(url)
      let isSkinned = false
      gltf.scene.traverse(obj => {
        if ((obj as THREE.SkinnedMesh).isSkinnedMesh) isSkinned = true
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true
          obj.receiveShadow = true
        }
      })
      this.models.set(key, { scene: gltf.scene, animations: gltf.animations, isSkinned })
    } catch {
      // Model not available — game will use procedural fallback
    }
  }

  has(key: string): boolean {
    return this.models.has(key)
  }

  clone(key: string): THREE.Group {
    const entry = this.models.get(key)!
    if (entry.isSkinned) {
      return skeletonClone(entry.scene) as THREE.Group
    }
    return entry.scene.clone()
  }

  getAnimations(key: string): THREE.AnimationClip[] {
    return this.models.get(key)?.animations ?? []
  }

  // Reset for HMR
  static reset() {
    AssetManager._instance = null
  }
}

export const ASSET_MANIFEST: { key: string; url: string }[] = [
  { key: 'cat',            url: '/models/cat/Cat.glb' },
  { key: 'building_house', url: '/models/town/suburban/house.glb' },
  { key: 'building_shop',  url: '/models/town/commercial/shop.glb' },
  { key: 'building_cafe',  url: '/models/town/commercial/cafe.glb' },
  { key: 'building_apt',   url: '/models/town/suburban/apartment.glb' },
  { key: 'building_tower', url: '/models/town/commercial/tower.glb' },
  { key: 'prop_tree',      url: '/models/props/tree.glb' },
  { key: 'prop_flower',    url: '/models/props/flower.glb' },
  { key: 'prop_lamp',      url: '/models/props/lamp.glb' },
  { key: 'prop_bench',     url: '/models/props/bench.glb' },
  { key: 'prop_mailbox',   url: '/models/props/mailbox.glb' },
  { key: 'item_star',      url: '/models/items/star.glb' },
  { key: 'item_coin',      url: '/models/items/coin.glb' },
  { key: 'item_gem',       url: '/models/items/gem.glb' },
]
