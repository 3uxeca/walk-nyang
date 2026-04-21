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

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 200)
  }

  update(targetPosition: THREE.Vector3, isIdle: boolean = false) {
    const targetOffset = isIdle ? this.offsetIdle : this.offsetActive
    this.currentOffset.lerp(targetOffset, this.offsetLerpFactor)
    const desired = targetPosition.clone().add(this.currentOffset)
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
