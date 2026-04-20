import * as THREE from 'three'

export class ThirdPersonCamera {
  camera: THREE.PerspectiveCamera
  private offset = new THREE.Vector3(0, 5, 9)
  private lerpFactor = 0.1

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 200)
  }

  update(targetPosition: THREE.Vector3) {
    const desired = targetPosition.clone().add(this.offset)
    this.camera.position.lerp(desired, this.lerpFactor)
    this.camera.lookAt(targetPosition.x, targetPosition.y + 1.2, targetPosition.z)
  }

  get angle(): number {
    return 0
  }

  onResize(aspect: number) {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }
}
