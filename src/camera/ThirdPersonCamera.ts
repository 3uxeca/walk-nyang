import * as THREE from 'three'

export class ThirdPersonCamera {
  camera: THREE.PerspectiveCamera
  // 활동 중(이동/점프/대시)일 때 약간 멀리 + 위에서 내려다보는 시점
  private offsetActive = new THREE.Vector3(0, 6.5, 12)
  // 5초 이상 idle일 때 가까이 당겨 고양이를 더 크게 보여줌
  private offsetIdle   = new THREE.Vector3(0, 5, 9)
  private currentOffset = this.offsetActive.clone()
  private lerpFactor = 0.1
  // 오프셋 전환은 한 박자 느리게 (2초 안에 부드럽게)
  private offsetLerpFactor = 0.025
  // FOV — 대시 시 살짝 넓어져 속도감 생성
  private readonly fovBase  = 70
  private readonly fovDash  = 82
  private fovLerpFactor = 0.12

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(this.fovBase, aspect, 0.1, 200)
  }

  update(targetPosition: THREE.Vector3, isIdle: boolean = false, isDashing: boolean = false) {
    const targetOffset = isIdle ? this.offsetIdle : this.offsetActive
    this.currentOffset.lerp(targetOffset, this.offsetLerpFactor)
    const desired = targetPosition.clone().add(this.currentOffset)
    this.camera.position.lerp(desired, this.lerpFactor)
    this.camera.lookAt(targetPosition.x, targetPosition.y + 1.2, targetPosition.z)

    // FOV 부드러운 전환
    const targetFov = isDashing ? this.fovDash : this.fovBase
    if (Math.abs(this.camera.fov - targetFov) > 0.01) {
      this.camera.fov += (targetFov - this.camera.fov) * this.fovLerpFactor
      this.camera.updateProjectionMatrix()
    }
  }

  get angle(): number {
    return 0
  }

  onResize(aspect: number) {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }
}
