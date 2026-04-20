import { createNoise2D } from 'simplex-noise'
import type { NoiseFunction2D } from 'simplex-noise'

// 결정적 seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function createSeededNoise(seed: number): NoiseFunction2D {
  return createNoise2D(mulberry32(seed))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1)
}
