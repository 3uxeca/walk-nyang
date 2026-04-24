import * as THREE from 'three'

/**
 * 입력 상태.
 * - held 필드(forward/backward/left/right): 키/버튼이 눌린 동안 true
 * - 토글 필드(dash): 입력 소스에서 누를 때마다 반전, 다음 누름까지 유지
 * - 엣지 필드(jump): 눌린 프레임에 한해 true, 다음 프레임 자동 false
 */
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

/**
 * 입력 소스 공통 인터페이스.
 *
 * 각 소스는 자체 `state`를 관리하고 Controller가 매 프레임 OR-reduce해서
 * `Controller.input`에 반영한다. 여러 소스가 공유 객체에 덮어쓰는 last-writer-wins
 * 문제를 원천 차단.
 */
export interface InputSource {
  /** 이 소스의 독립적 held 상태 (jump는 held가 아닌 edge라 항상 false 유지) */
  readonly state: InputState

  /** 선택: 프레임마다 호출 (아날로그 조이스틱 등에서 사용) */
  update?(dt: number): void

  /** 선택: 이번 프레임에 jump 엣지가 발생했는지 한 번만 반환 (호출 후 리셋) */
  consumeJump?(): boolean

  /** 리소스 정리. 멱등이어야 함. */
  dispose(): void
}

/** 키보드(W/A/S/D/Arrow, Space, Shift) 입력 소스. */
export class KeyboardInputSource implements InputSource {
  readonly state: InputState = {
    forward: false, backward: false, left: false, right: false, jump: false, dash: false,
  }
  private jumpPressed = false
  private disposed = false
  private onKeyDown: (e: KeyboardEvent) => void
  private onKeyUp: (e: KeyboardEvent) => void
  private onBlur: () => void

  constructor() {
    this.onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    this.state.forward = true; break
        case 'KeyS': case 'ArrowDown':  this.state.backward = true; break
        case 'KeyA': case 'ArrowLeft':  this.state.left = true; break
        case 'KeyD': case 'ArrowRight': this.state.right = true; break
        case 'Space':                   this.jumpPressed = true; break       // edge
        // DASH는 토글: 누른 프레임(edge)에만 상태 반전. OS 자동 키반복(e.repeat=true)은 무시.
        case 'ShiftLeft': case 'ShiftRight':
          if (!e.repeat) this.state.dash = !this.state.dash
          break
      }
    }
    this.onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    this.state.forward = false; break
        case 'KeyS': case 'ArrowDown':  this.state.backward = false; break
        case 'KeyA': case 'ArrowLeft':  this.state.left = false; break
        case 'KeyD': case 'ArrowRight': this.state.right = false; break
        // Shift/Space는 keyup에서 리셋 안 함 — dash는 토글이라 유지, jump는 edge 소비로 자동 false
      }
    }
    // dash 토글이라 alt-tab/포커스 상실 시 Shift keyup을 놓치면 "켜진 채" 방치될 수 있음.
    // 포커스 상실을 dash OFF로 정의해 안전한 기본값 유지.
    this.onBlur = () => {
      this.state.dash = false
    }

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
  }

  consumeJump(): boolean {
    const was = this.jumpPressed
    this.jumpPressed = false
    return was
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.state.dash = false
  }
}

export class Controller {
  input: InputState = {
    forward: false, backward: false, left: false, right: false, jump: false, dash: false,
  }
  private sources: InputSource[] = []

  constructor() {
    // 기본 소스는 키보드. 터치 소스는 이후 Phase 2-3에서 addSource()로 추가.
    this.sources.push(new KeyboardInputSource())
  }

  /** 추가 입력 소스 등록 (모바일 조이스틱/버튼 등). */
  addSource(source: InputSource): void {
    this.sources.push(source)
  }

  /**
   * 소스를 배열에서 제거만 하고 dispose는 하지 않는다.
   * 소스의 라이프사이클은 호출자가 관리한다 (일시 분리 후 재등록 시나리오 지원).
   * `Controller.dispose()`는 아직 등록된 모든 소스를 dispose한다.
   */
  removeSource(source: InputSource): boolean {
    const idx = this.sources.indexOf(source)
    if (idx === -1) return false
    this.sources.splice(idx, 1)
    return true
  }

  /**
   * 매 프레임 호출. 순서:
   *  1) 모든 소스의 update(dt) 먼저 실행 — 아날로그 소스가 자체 state를 최신화
   *  2) held 필드 OR-reduce
   *  3) jump 엣지 수집
   * (1)이 (2)보다 앞서야 터치 조이스틱 방향이 1 프레임 지연 없이 반영됨.
   */
  update(dt: number): void {
    for (const s of this.sources) {
      s.update?.(dt)
    }

    this.input.forward  = this.sources.some(s => s.state.forward)
    this.input.backward = this.sources.some(s => s.state.backward)
    this.input.left     = this.sources.some(s => s.state.left)
    this.input.right    = this.sources.some(s => s.state.right)
    // dash는 토글이라 서로 다른 소스 간 상호 취소가 되지 않음 (각 소스의 토글은 독립).
    // 현재 UX는 데스크탑/모바일 소스 동시 활성 시나리오가 없다는 전제에 의존.
    this.input.dash     = this.sources.some(s => s.state.dash)

    let jump = false
    for (const s of this.sources) {
      if (s.consumeJump?.()) jump = true
    }
    this.input.jump = jump
  }

  isMoving(): boolean {
    return this.input.forward || this.input.backward || this.input.left || this.input.right
  }

  dispose() {
    for (const s of this.sources) s.dispose()
    this.sources = []
  }
}
