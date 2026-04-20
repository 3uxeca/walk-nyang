import * as THREE from 'three'

const LIFETIME = 2.2
const SPAWN_INTERVAL = 0.35

interface HeartParticle {
  mesh: THREE.Mesh
  mat: THREE.MeshBasicMaterial
  vx: number
  vy: number
  age: number
}

function makeHeartGeo(s = 0.28): THREE.ShapeGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(0, s * 0.25)
  shape.bezierCurveTo(0, s * 0.5,  s * 0.5, s * 0.5,  s * 0.5, s * 0.25)
  shape.bezierCurveTo(s * 0.5, 0,  0, -s * 0.2,  0, -s * 0.5)
  shape.bezierCurveTo(0, -s * 0.2,  -s * 0.5, 0,  -s * 0.5, s * 0.25)
  shape.bezierCurveTo(-s * 0.5, s * 0.5,  0, s * 0.5,  0, s * 0.25)
  return new THREE.ShapeGeometry(shape, 8)
}

const COLORS = [0xff6b9d, 0xff8fab, 0xff4d7a, 0xffb3c6]

export class HeartFX {
  private scene: THREE.Scene
  private particles: HeartParticle[] = []
  private spawnTimer = 0
  private geo: THREE.ShapeGeometry

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.geo = makeHeartGeo()
  }

  update(delta: number, active: boolean, catX: number, catY: number, catZ: number, camPos: THREE.Vector3) {
    if (active) {
      this.spawnTimer -= delta
      if (this.spawnTimer <= 0) {
        this.spawn(catX, catY, catZ)
        this.spawnTimer = SPAWN_INTERVAL + (Math.random() - 0.5) * 0.1
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.age += delta

      if (p.age >= LIFETIME) {
        this.scene.remove(p.mesh)
        p.mat.dispose()
        this.particles.splice(i, 1)
        continue
      }

      const t = p.age / LIFETIME
      // Fade in 0→20%, hold, fade out 60→100%
      let opacity: number
      if (t < 0.2) opacity = t / 0.2
      else if (t > 0.6) opacity = 1 - (t - 0.6) / 0.4
      else opacity = 1

      p.mat.opacity = opacity
      p.mesh.position.x += p.vx * delta
      p.mesh.position.y += p.vy * delta
      p.mesh.scale.setScalar(0.7 + t * 0.5)
      p.mesh.lookAt(camPos)
    }
  }

  private spawn(catX: number, catY: number, catZ: number) {
    const mat = new THREE.MeshBasicMaterial({
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(this.geo, mat)
    const ox = (Math.random() - 0.5) * 1.0
    const oz = (Math.random() - 0.5) * 1.0
    mesh.position.set(catX + ox, catY + 2.8 + Math.random() * 0.4, catZ + oz)
    this.scene.add(mesh)
    this.particles.push({
      mesh,
      mat,
      vx: (Math.random() - 0.5) * 0.25,
      vy: 0.45 + Math.random() * 0.3,
      age: 0,
    })
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh)
      p.mat.dispose()
    }
    this.particles = []
    this.spawnTimer = 0
  }

  dispose() {
    this.clear()
    this.geo.dispose()
  }
}
