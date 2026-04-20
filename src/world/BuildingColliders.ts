interface Collider { x: number; z: number; radius: number }

const registry = new Map<string, Collider[]>()

export function registerChunkColliders(cx: number, cz: number, colliders: Collider[]) {
  registry.set(`${cx},${cz}`, colliders)
}

export function unregisterChunkColliders(cx: number, cz: number) {
  registry.delete(`${cx},${cz}`)
}

export function checkBuildingCollision(x: number, z: number, catRadius = 0.45): boolean {
  for (const colliders of registry.values()) {
    for (const c of colliders) {
      const dx = x - c.x
      const dz = z - c.z
      if (dx * dx + dz * dz < (c.radius + catRadius) ** 2) return true
    }
  }
  return false
}
