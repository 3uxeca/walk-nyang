# Wave 1.5 · Phase 1 — Controller 리팩토링

**상태**: ✅ 완료 (Level 2 — writer/reviewer 분리)
**날짜**: 2026-04-21
**목적**: Phase 2–3(터치 컨트롤) 착수 전 입력 레이어 추상화

---

## 목표

- `KeyboardInputSource`를 독립 클래스로 분리
- 이후 `TouchInputSource` 추가 시 `Controller.addSource()` 한 줄로 확장 가능
- 기존 데스크탑 키보드 경험 유지 (회귀 0건)

---

## 변경 사항

### `src/character/Controller.ts` — 전면 리팩토링

**기존**: `Controller`가 키보드 리스너를 직접 보유, `input` 필드에 직접 write.

**변경 후**:
- `InputSource` 인터페이스 신설 — `{ readonly state, update?(dt), consumeJump?(), dispose() }`
- `KeyboardInputSource` — 자체 state, jump는 edge-triggered
- `Controller.update(dt)` — 매 프레임 모든 소스의 state를 **OR-reduce** + jump 엣지 수집
- `Controller.addSource(s)` / `removeSource(s)` — 런타임 소스 관리

### `src/main.ts`

- animate 루프 상단에 `controller!.update(delta)` 추가

### `src/character/Controller.test.ts`

변경 없음 (pure function 테스트만 존재, 5개 그대로 통과)

---

## Level 2 검증 흐름

### 1. 자동 검증 (`vitest` + `vite build`)
- ✅ 65 tests passed (9 files)
- ✅ TypeScript 컴파일 0 에러
- ✅ 앱 청크 58.96 KB (+0.56 KB — InputSource 추상화 비용)

### 2. 1차 code-reviewer 독립 리뷰
- Verdict: **APPROVE with notes**
- HIGH 1건, MEDIUM 2건, LOW 1건 지적

### 3. 피드백 반영 재작성
| 지적 | 반영 방식 |
|------|----------|
| HIGH — 공유 state 충돌 | 각 소스가 own state, Controller가 OR-reduce |
| MEDIUM — dispose 비멱등 | `private disposed = false` guard 추가 |
| MEDIUM — removeSource 강제 dispose | splice만 수행, 호출자가 dispose 소유 |
| Minor — jump edge 트리거 없음 | `consumeJump()` 엣지 메서드 추가 |
| 추가 — 아날로그 소스 훅 없음 | optional `update?(dt)` 추가 |

### 4. 2차 code-reviewer 재호출
- Verdict: **APPROVE** (크리티컬 0 / HIGH 0 / MEDIUM 0 / LOW 1)
- LOW는 `readonly state: InputState`의 TypeScript 한계(필드 mutation은 여전히 가능)로, 기능 이슈 아님
- "Ready for Phase 2" 확인

---

## 핵심 설계 결정

### 왜 per-source state + OR-reduce?

키보드와 터치가 **동시에** 활성화된 상황(태블릿에 블루투스 키보드 연결 등)에서,
공유 `input` 객체에 둘 다 write하면 keyup이 touch의 hold를 덮어써서 입력 유실 발생.

`Controller.update()`에서 `some(s => s.state.X)`로 OR-reduce하면 이 문제가 원천 차단됨.

### 왜 jump만 edge-triggered?

`main.ts`가 `input.jump && isOnGround` 조건으로 점프를 발동하고, 공중 상태에서 Space를 계속 눌러도 연속 점프되지 않아야 한다.

기존 코드는 `input.jump = false`를 수동 consume으로 처리했는데, 이는 공유 InputState 전제에서만 깨끗함. per-source 구조에선 각 소스가 내부 `jumpPressed` 플래그를 갖고 `consumeJump()` 호출 시 리셋하는 편이 명확.

### 왜 `removeSource`는 dispose 안 하는가?

"키보드를 잠시 분리했다가 이후 재등록" 같은 시나리오 대비. 소유권은 호출자에게 있고, `Controller.dispose()`만 아직 연결된 모든 소스를 강제 정리.

---

## Acceptance Criteria

- [x] `Controller` 공개 API 유지 (`input`, `isMoving`, `dispose`)
- [x] `main.ts` 호출부 수정 최소 (한 줄 `update(delta)` 추가만)
- [x] 기존 테스트 전부 통과
- [x] code-reviewer 2회 독립 검증 APPROVE
- [x] `TouchInputSource` 추가가 0 코드 수정(인터페이스 구현 + `addSource`)으로 가능한 구조

---

## Phase 2 준비 완료

다음 구현할 `TouchInputSource`는:
```ts
class TouchInputSource implements InputSource {
  readonly state: InputState = { ... }
  private jumpPressed = false
  constructor(joystickEl, jumpBtn, dashBtn) { ... }
  consumeJump() { ... }
  update(dt) { /* 조이스틱 아날로그 값 읽기 */ }
  dispose() { ... }
}
// 사용처
controller.addSource(new TouchInputSource(...))
```
→ Controller 수정 없음.

---

## 다음 작업

Wave 1.5 Phase 2 — **VirtualJoystick 컴포넌트** (`src/ui/VirtualJoystick.ts` + `TouchInputSource`)
