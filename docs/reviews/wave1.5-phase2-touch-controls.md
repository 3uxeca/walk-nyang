# Wave 1.5 · Phase 2 — 모바일 터치 컨트롤

**상태**: ✅ 완료 (Level 2 — code-reviewer 2회 반복)
**날짜**: 2026-04-21
**목적**: 모바일/터치 디바이스에서 플레이 가능하도록 조이스틱 + 버튼 UI 추가

---

## 변경 사항

### 신규 파일
- `src/ui/VirtualJoystick.ts` — 좌하단 가상 조이스틱
  - Pointer Events API 사용 (touch + mouse 통합)
  - `setPointerCapture`로 베이스 밖으로 나가도 드래그 유지
  - 반경 50px, 데드존 0.15, 정규화 벡터 `{ x, y }` in [-1, 1] 공개
- `src/ui/MobileActionButtons.ts` — 우하단 JUMP / DASH 버튼
  - JUMP: edge-triggered (`consumeJump()` 후 리셋)
  - DASH: held 방식 (`dashHeld: boolean`) · Wave 1.5 Hotfix에서 토글(`dashActive`)로 변경됨
- `src/character/TouchInputSource.ts` — `InputSource` 구현체
  - `update(dt)`에서 조이스틱 벡터 → 방향 boolean 변환 (축 임계값 0.3)
  - `consumeJump()`는 MobileActionButtons로 위임
  - `isMobileEnvironment()` 헬퍼 export (`pointer: coarse` OR viewport < 820px)

### 수정 파일
- `src/character/Controller.ts`
  - `update(dt)` 순서 변경: 먼저 `s.update?.(dt)` 루프 실행 → OR-reduce → consumeJump
  - 이전 순서는 터치 조이스틱 방향을 1 프레임 지연시키는 버그 (리뷰어 HIGH)
- `src/main.ts`
  - `isMobileEnvironment()` 감지 → 데스크탑은 `ControlsHUD`, 모바일은 조이스틱+버튼+`TouchInputSource`
  - `controlsHUD?.update(...)` 옵셔널 체인 적용
  - 모듈 레벨 변수 3개 추가(joystick/buttons/touchSource) + HMR dispose 추가

---

## Level 2 리뷰 이터레이션

### 1차 리뷰 (ITERATE)
| 등급 | 이슈 | 조치 |
|------|------|------|
| 🔴 HIGH | `Controller.update()` OR-reduce가 source.update(dt)보다 먼저 실행 → 터치 방향 1프레임 지연 | ✅ 순서 재배치 |
| 🟡 MED | VirtualJoystick `pointerleave`가 capture 중에도 reset 발동 | ✅ `hasPointerCapture` 가드 |
| 🟡 MED | HMR dispose 순서 미세함 | 주석으로 현재 안전함 명시 |
| 🟡 MED | 모바일 감지 one-shot (리사이즈 무시) | 알려진 한계로 스코프 내 허용 |
| 🟢 LOW | `<style>` 태그 dispose 시 미제거 | 기존 프로젝트 컨벤션 일치, 패스 |
| 🟢 LOW | 조이스틱 ARIA 라벨 없음 | 게임 UI라 허용, 패스 |

### 2차 리뷰 (APPROVE)
- HIGH + MED 1건 수정 확인
- `KeyboardInputSource`는 `update()` 미구현이라 pre-loop이 no-op임을 교차 검증
- `pointerleave` 가드가 `pointercancel` 경로에 영향 없음 확인

---

## UX 설계 결정

- **축 임계값 0.3**: 조이스틱을 살짝 건드려도 캐릭터가 걷지 않도록 버퍼 확보
- **데드존 0.15**: knob 시각 미세 흔들림과 입력 안정성 동시 확보
- **`isMobileEnvironment()` OR 조건**: `pointer: coarse` 만으로는 구형 터치 디바이스 놓칠 수 있고, `innerWidth < 820` 만으로는 데스크탑 작은 창 오판 가능. 둘을 OR로 결합해서 보수적으로 모바일 UI 활성화
- **`ownsUi = false`**: main.ts가 UI 라이프사이클을 직접 관리 → 테스트·교체 시 유연

---

## 데스크탑/모바일 UI 차이

| | 데스크탑 | 모바일 |
|---|---------|--------|
| 좌상단 HUD | 진행도·지역 (공통) | 진행도·지역 (공통) |
| 하단 | ControlsHUD (WASD + DASH + JUMP 키가이드) | 없음 |
| 좌하단 | — | VirtualJoystick |
| 우하단 | — | JUMP / DASH 원형 버튼 |
| 입력 소스 | KeyboardInputSource | KeyboardInputSource + TouchInputSource (addSource) |

---

## Acceptance Criteria

- [x] 모바일(또는 `pointer: coarse`) 감지 시 자동 UI 전환
- [x] 조이스틱 아날로그 벡터 → 방향 입력 반영 (1프레임 지연 없음)
- [x] JUMP 버튼 탭 → 1회 점프 (홀드해도 반복 점프 안 함)
- [x] DASH 버튼 홀드 → 눌린 동안 대시
- [x] 데스크탑 키보드 플레이는 영향 없음
- [x] HMR 시 UI 요소 정리 (스타일은 idempotent 재주입)
- [x] `npm test` 65 pass, `npm run build` 성공
- [x] code-reviewer 독립 리뷰 최종 APPROVE

---

## 다음 작업

Wave 1.5 Phase 3 — **실기 테스트 + 마무리** (iOS Safari / Android Chrome에서 조이스틱 반응성·멀티터치·버튼 히트박스 확인).
실제 기기 없이 최대한 할 수 있는 건 Chrome DevTools device mode + 자동화된 pointer event 스텁 테스트.
