# Wave 1 · Task 4 — 대시 속도감 FX

**상태**: ✅ 완료
**날짜**: 2026-04-21
**추정 → 실제**: 0.5일 → 약 20분

---

## 목표

대시 중일 때 속도감·박력이 느껴지도록 시각 이펙트 추가.

1. **FOV 확대** — 카메라 시야각 70 → 82로 서서히 벌어져 "앞으로 돌진하는 느낌"
2. **먼지 퍼프 트레일** — 고양이 발 뒤에 작은 베이지 퍼프가 스폰되며 페이드아웃

---

## 변경 사항

### `src/camera/ThirdPersonCamera.ts`
- `fovBase = 70`, `fovDash = 82`, `fovLerpFactor = 0.12` 추가
- `update(pos, isIdle, isDashing)` 시그니처 확장 — `isDashing` 값에 따라 FOV lerp
- `camera.updateProjectionMatrix()` 매 프레임 변경 시 호출

### `src/game/DashTrailFX.ts` (신규, 약 100줄)
- `Puff` 인터페이스: 메시 + age + life + startScale + endScale
- 스폰 간격 50ms — 대시 + 접지 상태에서만 스폰
- 각 퍼프: 0.45s 수명, 크기 0.55x → 1.4x로 커지며 opacity 0.6 → 0 페이드
- 위치: 고양이 이동 역방향으로 0.4 유닛 뒤 + 측면 랜덤 오프셋
- 재질은 CircleGeometry(0.32, 10) + MeshBasicMaterial 클론 (인스턴스별 opacity 독립)

### `src/main.ts`
- `DashTrailFX` import + 모듈 레벨 변수 선언
- `dashTrailFX = new DashTrailFX(scene)` 초기화
- animate 루프에서 `dashTrailFX.update(delta, isDashing && isOnGround, x, y, z, vel.x, vel.z)` 호출
- 카메라에 `isDashing` 전달
- HMR cleanup에 dispose 추가

---

## 디자인 선택

- **접지 조건 (`isDashing && isOnGround`)**: 공중에서는 퍼프 안 나옴 — 먼지라는 속성상 바닥에 닿아야 자연스러움
- **opacity 0.6 시작**: 너무 진하면 시야 방해, 너무 흐리면 안 보임
- **색상 `0xfff0d8` (연한 베이지)**: 도로(회색)·풀(초록) 어디서든 과하지 않음
- **billboard 아님**: 바닥 평면이라 rotation.x=-π/2로 고정 — 바닥에서 퍼지는 느낌 강조

---

## 검증

- ✅ `npm run build` — 앱 청크 55.78 KB (+1.56 KB vs Task 3 — DashTrailFX 클래스)
- ✅ `npm test` — 65 passed
- ✅ FOV가 대시 시작 시 부드럽게 확대되고 멈출 때 복귀
- ✅ 공중에서 대시하면 (점프+Shift) 퍼프가 안 스폰 — 의도대로

---

## Acceptance Criteria

- [x] 대시 시작 시 카메라 FOV가 확대되어 속도감 생성
- [x] 대시 중 고양이 뒤쪽에 먼지 퍼프가 연속 스폰
- [x] 대시 종료 시 FOV 복귀, 퍼프 스폰 중단
- [x] 공중 대시(점프 중)에는 퍼프 안 나옴
- [x] 기존 테스트 전부 통과
- [x] 메모리 누수 없음 (HMR 시 dispose 호출)

---

## 다음 작업

Wave 1 Task 5 — **대시+점프 더 높이** (`JUMP_FORCE` 분기).
