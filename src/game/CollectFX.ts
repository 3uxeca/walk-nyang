import * as THREE from 'three'

const CONFETTI_COLORS = [
  0xff6b9d, 0xffd93d, 0x6bcb77, 0x4d96ff,
  0xff922b, 0xcc5de8, 0xff4d6d, 0x74c69d,
]

interface Confetto {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  spin: THREE.Vector3
  life: number
  maxLife: number
}

export class CollectFX {
  private scene: THREE.Scene
  private particles: Confetto[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  spawn(x: number, y: number, z: number, _color: number) {
    for (let i = 0; i < 18; i++) {
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
      const mat = new THREE.MeshToonMaterial({ color, transparent: true, opacity: 1, side: THREE.DoubleSide })

      // Thin flat rectangle (confetti piece)
      const w = 0.10 + Math.random() * 0.10
      const h = 0.06 + Math.random() * 0.06
      const geo = new THREE.BoxGeometry(w, h, 0.012)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.4,
        y + Math.random() * 0.3,
        z + (Math.random() - 0.5) * 0.4
      )
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )
      this.scene.add(mesh)

      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.6
      const hSpeed = 1.8 + Math.random() * 2.4
      const vel = new THREE.Vector3(
        Math.cos(angle) * hSpeed,
        4.5 + Math.random() * 2.5,
        Math.sin(angle) * hSpeed
      )
      const spin = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14
      )
      const life = 0.7 + Math.random() * 0.5
      this.particles.push({ mesh, velocity: vel, spin, life, maxLife: life })
    }
  }

  update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= delta
      if (p.life <= 0) {
        this.scene.remove(p.mesh)
        p.mesh.geometry.dispose()
        ;(p.mesh.material as THREE.Material).dispose()
        this.particles.splice(i, 1)
        continue
      }
      // Gravity + gentle air resistance on horizontal
      p.velocity.y -= 9 * delta
      p.velocity.x *= 1 - delta * 1.5
      p.velocity.z *= 1 - delta * 1.5
      p.mesh.position.addScaledVector(p.velocity, delta)
      p.mesh.rotation.x += p.spin.x * delta
      p.mesh.rotation.y += p.spin.y * delta
      p.mesh.rotation.z += p.spin.z * delta

      const t = p.life / p.maxLife
      // fade out in last 30%
      ;(p.mesh.material as THREE.MeshToonMaterial).opacity = t < 0.3 ? t / 0.3 : 1
    }
  }

  dispose() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh)
      p.mesh.geometry.dispose()
      ;(p.mesh.material as THREE.Material).dispose()
    }
    this.particles = []
  }
}
