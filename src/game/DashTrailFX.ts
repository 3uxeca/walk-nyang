import * as THREE from 'three'

interface Puff {
  mesh: THREE.Mesh
  age: number
  life: number
  startScale: number
  endScale: number
}

/**
 * 대시 중 고양이 발 아래에서 작은 먼지 퍼프가 뒤로 스폰되며 페이드아웃.
 * 속도감 강화용 이펙트.
 */
export class DashTrailFX {
  private scene: THREE.Scene
  private puffs: Puff[] = []
  private spawnTimer = 0
  private readonly spawnInterval = 0.05   // 50ms 간격으로 퍼프 생성
  private readonly material: THREE.MeshBasicMaterial
  private readonly geometry: THREE.CircleGeometry

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.material = new THREE.MeshBasicMaterial({
      color: 0xfff0d8,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    })
    this.geometry = new THREE.CircleGeometry(0.32, 10)
  }

  /**
   * @param dt 프레임 delta
   * @param isDashing 대시 중 여부
   * @param x, y, z 고양이 위치
   * @param vx, vz 고양이 수평 속도 (이동 역방향으로 퍼프 배치)
   */
  update(dt: number, isDashing: boolean, x: number, y: number, z: number, vx: number, vz: number) {
    // 새 퍼프 스폰
    if (isDashing) {
      this.spawnTimer -= dt
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.spawnInterval
        this.spawnPuff(x, y, z, vx, vz)
      }
    } else {
      this.spawnTimer = 0
    }

    // 기존 퍼프 업데이트
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i]
      p.age += dt
      const t = p.age / p.life
      if (t >= 1) {
        this.scene.remove(p.mesh)
        ;(p.mesh.material as THREE.Material).dispose()
        this.puffs.splice(i, 1)
        continue
      }
      const s = p.startScale + (p.endScale - p.startScale) * t
      p.mesh.scale.set(s, s, s)
      ;(p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - t)
    }
  }

  private spawnPuff(x: number, y: number, z: number, vx: number, vz: number) {
    const mat = this.material.clone()
    const mesh = new THREE.Mesh(this.geometry, mat)
    mesh.rotation.x = -Math.PI / 2

    // 이동 역방향으로 약간 뒤에 배치
    const speed = Math.hypot(vx, vz)
    const dirX = speed > 0.001 ? -vx / speed : 0
    const dirZ = speed > 0.001 ? -vz / speed : 0
    const backOffset = 0.4
    const lateral = (Math.random() - 0.5) * 0.4
    mesh.position.set(
      x + dirX * backOffset + dirZ * lateral,
      y + 0.05,
      z + dirZ * backOffset - dirX * lateral,
    )

    this.scene.add(mesh)
    this.puffs.push({
      mesh,
      age: 0,
      life: 0.45,
      startScale: 0.55 + Math.random() * 0.25,
      endScale: 1.4 + Math.random() * 0.4,
    })
  }

  clear() {
    for (const p of this.puffs) {
      this.scene.remove(p.mesh)
      ;(p.mesh.material as THREE.Material).dispose()
    }
    this.puffs = []
    this.spawnTimer = 0
  }

  dispose() {
    this.clear()
    this.geometry.dispose()
    this.material.dispose()
  }
}
