import * as THREE from 'three'

export interface InputState {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  dash: boolean
}

export function inputToVelocity(input: InputState, speed: number, cameraAngle: number): THREE.Vector3 {
  const dir = new THREE.Vector3()
  if (input.forward) dir.z -= 1
  if (input.backward) dir.z += 1
  if (input.left) dir.x -= 1
  if (input.right) dir.x += 1

  if (dir.lengthSq() === 0) return dir

  dir.normalize().multiplyScalar(speed)

  // 카메라 방향 기준으로 회전
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngle)
  return dir
}

export class Controller {
  input: InputState = { forward: false, backward: false, left: false, right: false, jump: false, dash: false }
  private onKeyDown: (e: KeyboardEvent) => void
  private onKeyUp: (e: KeyboardEvent) => void

  constructor() {
    this.onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.input.forward = true; break
        case 'KeyS': case 'ArrowDown': this.input.backward = true; break
        case 'KeyA': case 'ArrowLeft': this.input.left = true; break
        case 'KeyD': case 'ArrowRight': this.input.right = true; break
        case 'Space': this.input.jump = true; break
        case 'ShiftLeft': case 'ShiftRight': this.input.dash = true; break
      }
    }
    this.onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.input.forward = false; break
        case 'KeyS': case 'ArrowDown': this.input.backward = false; break
        case 'KeyA': case 'ArrowLeft': this.input.left = false; break
        case 'KeyD': case 'ArrowRight': this.input.right = false; break
        case 'Space': this.input.jump = false; break
        case 'ShiftLeft': case 'ShiftRight': this.input.dash = false; break
      }
    }
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  isMoving(): boolean {
    return this.input.forward || this.input.backward || this.input.left || this.input.right
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }
}
