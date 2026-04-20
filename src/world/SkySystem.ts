import * as THREE from 'three'

const CLOUD_CONFIGS = [
  { x:  45, y: 34, z: -65, s: 5.5 },
  { x: -75, y: 40, z: -28, s: 4.2 },
  { x:  85, y: 32, z:  22, s: 6.0 },
  { x: -42, y: 44, z:  55, s: 4.8 },
  { x:  18, y: 38, z:  85, s: 5.2 },
  { x: -95, y: 36, z: -68, s: 5.8 },
  { x: 115, y: 42, z: -18, s: 3.8 },
  { x: -22, y: 46, z: -88, s: 4.4 },
  { x:  62, y: 30, z:  72, s: 3.6 },
  { x: -82, y: 39, z:  42, s: 5.0 },
  { x:  30, y: 35, z: -40, s: 4.0 },
  { x: -55, y: 33, z:  15, s: 5.5 },
]

const PUFFS: [number, number, number, number][] = [
  [ 0.0,  0.0,  0.0, 1.00],
  [ 1.3,  0.25, 0.0, 0.85],
  [-1.2,  0.15, 0.0, 0.82],
  [ 0.6,  0.80, 0.1, 0.72],
  [-0.5,  0.70, 0.0, 0.68],
  [ 0.1,  0.05, 0.9, 0.78],
  [-0.9,  0.30, 0.8, 0.62],
]

function makeCloud(mat: THREE.Material): THREE.Group {
  const g = new THREE.Group()
  for (const [px, py, pz, r] of PUFFS) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), mat)
    sphere.position.set(px, py, pz)
    g.add(sphere)
  }
  return g
}

export class SkySystem {
  private dome: THREE.Mesh
  private clouds: THREE.Group[] = []
  private time = 0

  constructor(scene: THREE.Scene) {
    const skyGeo = new THREE.SphereGeometry(180, 16, 10)
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor:     { value: new THREE.Color(0x3a82cc) },
        horizonColor: { value: new THREE.Color(0xb8d9f0) },
      },
      vertexShader: `
        varying float vY;
        void main() {
          vY = normalize(position).y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        varying float vY;
        void main() {
          float t = clamp(vY * 2.0, 0.0, 1.0);
          gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
        }
      `,
    })
    this.dome = new THREE.Mesh(skyGeo, skyMat)
    scene.add(this.dome)

    const cloudMat = new THREE.MeshToonMaterial({ color: 0xfafcff })
    for (const cfg of CLOUD_CONFIGS) {
      const cloud = makeCloud(cloudMat)
      cloud.position.set(cfg.x, cfg.y, cfg.z)
      cloud.scale.setScalar(cfg.s)
      cloud.userData.baseX = cfg.x
      cloud.userData.speed = 0.6 + Math.random() * 0.8
      scene.add(cloud)
      this.clouds.push(cloud)
    }
  }

  update(delta: number) {
    this.time += delta
    for (const cloud of this.clouds) {
      const spd = cloud.userData.speed as number
      const bx  = cloud.userData.baseX as number
      cloud.position.x = bx + Math.sin(this.time * spd * 0.03) * 20
    }
  }

  dispose() {
    this.dome.geometry.dispose()
    ;(this.dome.material as THREE.ShaderMaterial).dispose()
    for (const cloud of this.clouds) {
      cloud.traverse(o => {
        if (o instanceof THREE.Mesh) o.geometry.dispose()
      })
    }
  }
}
