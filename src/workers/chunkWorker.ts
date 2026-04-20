import { generateChunk } from '../world/ChunkGenerator'
import type { ChunkData } from '../world/ChunkGenerator'

interface WorkerRequest {
  cx: number
  cz: number
  worldSeed: number
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { cx, cz, worldSeed } = e.data
  const data: ChunkData = generateChunk(cx, cz, worldSeed)
  self.postMessage(data)
}
