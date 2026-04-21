import * as THREE from 'three'
import { generateChunk, CHUNK_SIZE } from './ChunkGenerator'
import { buildChunkMesh, buildProxyMesh, disposeChunkMesh } from './ChunkMeshFactory'
import type { ItemSystem } from '../game/ItemSystem'
import type { RegionManager } from '../game/RegionManager'

export const WORLD_SEED = 12345

interface ChunkEntry {
  group: THREE.Group
  cx: number
  cz: number
  isProxy: boolean
}

interface SwapJob {
  cx: number
  cz: number
  key: string
}

export class ChunkManager {
  private scene: THREE.Scene
  private chunks = new Map<string, ChunkEntry>()
  // 7x7 청크 = 약 224 유닛 반경 — worker 비동기 로딩 지연을 흡수하기에 충분
  private activeRadius = 3
  private worker: Worker | null = null
  private pendingChunks = new Set<string>()
  private useWorker = false
  private itemSystem: ItemSystem | null = null
  private regionManager: RegionManager | null = null
  private swapQueue: SwapJob[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.initWorker()
  }

  setItemSystem(itemSystem: ItemSystem) {
    this.itemSystem = itemSystem
  }

  setRegionManager(regionManager: RegionManager) {
    this.regionManager = regionManager
  }

  /** 해당 청크가 메시까지 빌드되어 있는지 — 펜딩 상태(요청은 보냈지만 도착 전)는 false */
  hasChunk(cx: number, cz: number): boolean {
    return this.chunks.has(`${cx},${cz}`)
  }

  private initWorker() {
    try {
      this.worker = new Worker(new URL('../workers/chunkWorker.ts', import.meta.url), { type: 'module' })
      this.worker.onmessage = (e: MessageEvent) => {
        const data = e.data
        const key = `${data.cx},${data.cz}`
        if (!this.pendingChunks.has(key)) return
        this.pendingChunks.delete(key)
        if (!this.chunks.has(key)) {
          this.addChunk(data.cx, data.cz, key, data)
        }
      }
      this.worker.onerror = () => {
        this.useWorker = false
        this.worker = null
        for (const key of this.pendingChunks) {
          const [cx, cz] = key.split(',').map(Number)
          const data = generateChunk(cx, cz, WORLD_SEED)
          this.addChunk(cx, cz, key, data)
        }
        this.pendingChunks.clear()
      }
      this.useWorker = true
    } catch {
      this.useWorker = false
      this.worker = null
    }
  }

  private addChunk(cx: number, cz: number, key: string, data: ReturnType<typeof generateChunk>) {
    const isLocked = this.regionManager
      ? this.regionManager.getChunkState(cx, cz) === 'locked'
      : false

    if (isLocked) {
      const group = buildProxyMesh(cx, cz, this.scene)
      this.chunks.set(key, { group, cx, cz, isProxy: true })
    } else {
      const group = buildChunkMesh(data, this.scene)
      this.chunks.set(key, { group, cx, cz, isProxy: false })
      this.itemSystem?.addChunkItems(data.items)
    }
  }

  onRegionUnlocked(_regionId: number) {
    for (const [key, entry] of this.chunks) {
      if (!entry.isProxy) continue
      const entryRegion = this.regionManager?.getChunkState(entry.cx, entry.cz)
      if (entryRegion === 'unlocked') {
        this.swapQueue.push({ cx: entry.cx, cz: entry.cz, key })
      }
    }
  }

  processSwaps(maxPerFrame = 1) {
    let processed = 0
    while (this.swapQueue.length > 0 && processed < maxPerFrame) {
      const job = this.swapQueue.shift()!
      const entry = this.chunks.get(job.key)
      if (!entry || !entry.isProxy) continue

      disposeChunkMesh(entry.group, this.scene)
      const data = generateChunk(job.cx, job.cz, WORLD_SEED)
      const group = buildChunkMesh(data, this.scene)
      this.chunks.set(job.key, { group, cx: job.cx, cz: job.cz, isProxy: false })
      this.itemSystem?.addChunkItems(data.items)
      processed++
    }
  }

  update(playerX: number, playerZ: number) {
    const pcx = Math.floor(playerX / CHUNK_SIZE)
    const pcz = Math.floor(playerZ / CHUNK_SIZE)

    const needed = new Set<string>()
    for (let dz = -this.activeRadius; dz <= this.activeRadius; dz++) {
      for (let dx = -this.activeRadius; dx <= this.activeRadius; dx++) {
        needed.add(`${pcx + dx},${pcz + dz}`)
      }
    }

    for (const [key, entry] of this.chunks) {
      if (!needed.has(key)) {
        disposeChunkMesh(entry.group, this.scene)
        if (!entry.isProxy) {
          this.itemSystem?.removeChunkItems(entry.cx, entry.cz)
        }
        this.chunks.delete(key)
        this.pendingChunks.delete(key)
      }
    }

    for (const key of needed) {
      if (!this.chunks.has(key) && !this.pendingChunks.has(key)) {
        const [cx, cz] = key.split(',').map(Number)
        this.regionManager?.registerChunk(cx, cz)
        this.loadChunk(cx, cz, key)
      }
    }
  }

  private loadChunk(cx: number, cz: number, key: string) {
    if (this.useWorker && this.worker) {
      this.pendingChunks.add(key)
      this.worker.postMessage({ cx, cz, worldSeed: WORLD_SEED })
    } else {
      const data = generateChunk(cx, cz, WORLD_SEED)
      this.addChunk(cx, cz, key, data)
    }
  }

  dispose() {
    for (const [, entry] of this.chunks) {
      disposeChunkMesh(entry.group, this.scene)
    }
    this.chunks.clear()
    this.pendingChunks.clear()
    this.swapQueue = []
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}
