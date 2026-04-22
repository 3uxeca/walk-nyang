# Wave 1.5 · Phase 4 — Vitest 스텁 테스트 + 실기 테스트 가이드

**상태**: ✅ 완료 (Level 2 — code-reviewer 1회 + 4건 피드백 모두 반영)
**날짜**: 2026-04-22
**목적**: Wave 1.5의 모바일 입력 매핑을 자동 테스트로 잠그고, DOM/실제 기기 검증은 사람용 체크리스트로 위임

---

## 변경 사항

### 신규 파일
- `src/character/TouchInputSource.test.ts` — 12 케이스
  - DOM 없이 `FakeJoystick` / `FakeButtons` stub만으로 모든 매핑 검증
  - 의존성 주입 디자인 덕에 happy-dom 추가 없이 가능
  - 케이스: 초기 상태 (jump 포함) · 각 축 방향 · threshold 미만/경계값(0.3)/초과 · 대각선 · zero 복귀 · dash held · consumeJump 엣지 · dispose state 초기화
  - `isMobileEnvironment` Node 환경 guard 검증
- `docs/MANUAL_TEST.md` — 사람용 체크리스트 10 섹션
  - 검증 환경 (iOS Safari · Android Chrome · DevTools device mode)
  - 랜딩 → UI 자동 전환 → 조이스틱 → JUMP → DASH → 카메라 → 토스트 → 사운드 → 성능 → 회전 검증
  - 알려진 한계 + 회귀 검증 트리거 파일 목록

### 테스트 결과
- 65 → **77 passed** (TouchInputSource 11 + isMobileEnvironment 1, 기존 65 유지)
- `npm run build` 영향 없음 (테스트는 dist에 포함 안 됨)

---

## Level 2 리뷰 결과

### code-reviewer 1차 — APPROVE
| 등급 | 이슈 | 조치 |
|------|------|------|
| 🟡 MED | threshold 경계값(0.3 정확) 테스트 누락 | ✅ 양/음 양쪽 boundary 케이스 추가 |
| 🟡 MED | threshold 0.3을 테스트가 직접 하드코딩 | ✅ 파일 상단에 "변경 시 boundary 함께 수정" 주석 명시 |
| 🟢 LOW | 초기 상태 테스트에 `state.jump` assertion 누락 | ✅ 추가 |
| 🟢 LOW | `isMobileEnvironment()` 테스트 누락 | ✅ Node 환경 guard 케이스 추가 |

블로커 없이 APPROVE — 4건 모두 반영하고 마감.

---

## 의도적으로 *안* 한 것

- **happy-dom 추가** — 새 devDependency, vitest 환경 전환, 빌드 시간 증가 비용 대비 이득 작음
- **VirtualJoystick / MobileActionButtons / LandingScreen DOM 테스트** — 대부분 setup/teardown + 이벤트 위임이라 DOM 시뮬레이션은 한계가 큼. 매뉴얼 체크리스트가 더 현실적
- **Controller 통합 테스트** — `KeyboardInputSource`가 `window.addEventListener`에 의존해서 node에서 인스턴스화 불가. 추후 happy-dom 도입 시 재고

스텁 + 매뉴얼이라는 이중 전략이 현재 스코프엔 최적.

---

## Acceptance Criteria

- [x] TouchInputSource axis-to-direction 매핑 자동 테스트
- [x] threshold 경계값까지 포함한 회귀 보호
- [x] consumeJump 엣지 의미론 검증 (한 번 소비 후 false)
- [x] 매뉴얼 체크리스트로 DOM/실기 영역 커버
- [x] 모든 코드 변경에 대해 회귀 트리거 파일 명시
- [x] 65 → 77 tests, 모두 통과
- [x] code-reviewer APPROVE + 피드백 4건 반영

---

## Wave 1.5 전체 완료

| Phase | 항목 | 상태 |
|-------|------|------|
| 1 | Controller InputSource 추상화 | ✅ |
| 2 | VirtualJoystick + MobileActionButtons + TouchInputSource | ✅ |
| 3 | 랜딩(시작) 화면 | ✅ |
| 4 | Vitest 스텁 + 실기 가이드 | ✅ |

Wave 1.5 종료. 다음 후보:
- Wave 2 #1 — 지역 × 아이템 매트릭스 (다음 기본)
- 후속 — 로고 압축은 이미 처리됨, happy-dom 도입은 보류
