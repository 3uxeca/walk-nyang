# Wave 1.5 · Hotfix — DASH 홀드 → 토글 (공통)

**상태**: ✅ 완료 (Level 2 — code-reviewer 1회 + HIGH 1 / MEDIUM 2 / LOW 1 모두 반영)
**날짜**: 2026-04-24
**트리거**: 모바일 실기 피드백 — "DASH 버튼을 누르고 있으면서 조이스틱을 움직이기 어렵다"

## 배경

Phase 2에서 도입한 DASH는 데스크탑 Shift와 동일하게 "누르는 동안만 빠름" (hold-to-dash). 데스크탑에선 Shift+WASD 동시 입력이 근육 기억상 자연스럽지만, 모바일에선 조이스틱을 드래그 중인 손과 DASH 버튼을 누르는 손이 동시에 필요해 부담이 큼.

데스크탑만 토글로 바꾸면 플랫폼별 감각이 어긋나고 Controller 분기 + 테스트가 늘어나, **공통 토글**로 통일.

## 변경 사항

### `src/character/Controller.ts` — KeyboardInputSource
- **Shift keydown (non-repeat)**: `state.dash = !state.dash` 토글. OS 자동 키리피트는 `e.repeat` 가드로 무시해 빠른 연속 토글 방지.
- **Shift keyup**: 더 이상 `dash = false` 하지 않음 (토글 상태 유지).
- **blur 리스너**: `window.addEventListener('blur', …)` 추가. alt-tab/포커스 상실 시 dash를 강제 OFF — 돌아왔을 때 "켜진 채 방치" 방지.
- **dispose**: blur 리스너 해제 + `state.dash = false` 리셋 (대칭성).
- **`InputState` doc 주석**: held/edge에 "토글" 필드를 추가해 의미 명시.

### `src/ui/MobileActionButtons.ts`
- 공개 필드 `dashHeld` → `dashActive` 리네임 (의미 정확화).
- `onDashDown`: `dashActive = !dashActive` + `classList.toggle('w3d-mbtn-active', dashActive)`.
- `onDashUp` 및 pointerup/cancel/leave 리스너 삭제 — 토글엔 릴리즈 의미 없음.
- `setPointerCapture`도 제거 (hold 용도였음).
- `dispose()`: 남은 리스너만 정리, `dashActive = false` 유지.

### `src/character/TouchInputSource.ts`
- `update()` 한 줄: `buttons.dashHeld` → `buttons.dashActive`.

### `src/character/TouchInputSource.test.ts`
- `FakeButtons.dashHeld` → `dashActive` 리네임.
- 기존 테스트 확장: 토글 상태가 여러 프레임에 걸쳐 유지되는지 추가 assertion.

### `src/main.ts:249` · `src/ui/ControlsHUD.ts:124`
- 변경 없음. `input.dash`만 읽던 양쪽 모두 토글 의미론과 호환:
  - `isDashing = input.dash && isMoving()` — 토글 ON이어도 멈춰 있으면 효과 없음 (의도).
  - Shift 키 하이라이트 — 토글 ON 동안 지속 하이라이트 (새 UX로 자연스럽게 동작).

### `docs/reviews/wave1.5-phase2-touch-controls.md`
- 과거 기록 유지 + "이후 Hotfix에서 토글로 변경" 주석만 추가.

### `docs/MANUAL_TEST.md`
- 섹션 5 DASH 버튼: 토글 시나리오 + blur 복구 + HUD 하이라이트 지속 체크로 교체.
- "알려진 한계" 중 "finger leave 시 release" 항목 삭제 → 모바일 화면 복귀 시 토글 유지 안내로 대체.

---

## Level 2 리뷰 결과

### code-reviewer 1차 — COMMENT
| 등급 | 이슈 | 조치 |
|------|------|------|
| 🔴 HIGH | alt-tab/blur 시 dash 토글이 켜진 채 방치 (데스크탑) | ✅ `window.blur` 리스너로 OFF |
| 🟡 MED | `KeyboardInputSource.dispose()`가 `state.dash` 미리셋 | ✅ `this.state.dash = false` 추가 |
| 🟡 MED | 여러 소스 `OR`-reduce 시 토글 상호 취소 불가 (잠재적) | ✅ 현재 UX는 단일 소스 전제라는 주석 명시 |
| 🟢 LOW | Phase 2 리뷰 문서에 `dashHeld` 스테일 참조 | ✅ 후속 변경 주석으로 보강 |

모든 피드백 반영 후 빌드/테스트 재검증 — 77/77 유지, 빌드 깨끗.

---

## 의도적으로 *안* 한 것

- **happy-dom/jsdom 도입해 KeyboardInputSource/MobileActionButtons DOM 테스트 작성**: 기존 Phase 4 정책(스텁 + 매뉴얼) 유지. 토글 엣지 검증은 매뉴얼 체크리스트가 더 현실적.
- **다중 소스 토글 합산 로직 (XOR/latest-writer)**: 현재 UX는 데스크탑 ⊕ 모바일 단일 소스 전제라 오버엔지니어링.
- **모바일 `visibilitychange` 기반 자동 OFF**: 화면 복귀 후 "꺼져 있어서 다시 탭해야 함"이 오히려 UX 퇴행. 버튼 색 유지로 상태가 보이므로 명시적 OFF만 지원.

---

## Acceptance Criteria

- [x] Shift/DASH 버튼 둘 다 토글 의미론
- [x] OS 키리피트(길게 누름)로 빠른 연속 토글 불가
- [x] alt-tab 후 데스크탑 dash 자동 OFF
- [x] 모바일 DASH 버튼 색이 토글 상태를 시각적으로 반영
- [x] 기존 downstream 로직(main.ts, ControlsHUD) 재작성 없이 호환
- [x] 77/77 테스트 모두 통과 · 빌드 깨끗
- [x] code-reviewer 피드백 4건 모두 반영
- [x] 매뉴얼 체크리스트 업데이트

---

## 회귀 트리거 파일

이 변경은 다음 파일에 포함된 입력 경로를 재확인해야 할 때 재검증:
- `src/character/Controller.ts`, `src/ui/MobileActionButtons.ts`, `src/character/TouchInputSource.ts`
- `src/main.ts`의 animate 루프에서 `input.dash` 사용처
- `src/ui/ControlsHUD.ts` Shift 하이라이트 로직
