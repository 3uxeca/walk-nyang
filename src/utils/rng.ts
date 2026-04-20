export function seededRandom(seed: number): () => number {
  let s = seed
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export function chunkSeed(worldSeed: number, cx: number, cz: number): number {
  return (worldSeed * 73856093) ^ (cx * 19349663) ^ (cz * 83492791)
}
