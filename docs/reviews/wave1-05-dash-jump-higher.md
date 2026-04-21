# Wave 1 · Task 5 — 대시 점프 (더 높이)

**상태**: ✅ 완료
**날짜**: 2026-04-21
**추정 → 실제**: 0.5일 → 약 5분

---

## 목표

대시(Shift) 중에 점프(Space)하면 일반 점프보다 더 높이 뜨도록 — 플랫폼 넘나들기 재미 추가.

---

## 변경 사항

### `src/main.ts`
```diff
  const GRAVITY = -25
  const JUMP_FORCE = 11
+ // 대시 중 점프 — 체감상 약 1.7배 높이 (v^2 비례이므로 force 1.32배면 높이 ~1.75배)
+ const JUMP_FORCE_DASH = 14.5
```

```diff
  if (controller!.input.jump && isOnGround) {
-   verticalVelocity = JUMP_FORCE
+   verticalVelocity = isDashing ? JUMP_FORCE_DASH : JUMP_FORCE
    isOnGround = false
    controller!.input.jump = false
    playJump()
  }
```

---

## 물리 계산

점프 최대 높이 공식: `h = v² / (2g)`

| 상태 | force v | 최대 높이 | 체공 시간 |
|------|---------|----------|-----------|
| 일반 점프 | 11 | 2.42 유닛 | 0.88s |
| **대시 점프** | 14.5 | **4.20 유닛** | **1.16s** |

약 **1.74배 높이** + 체공 시간 1.3배 → 다음 Wave 4의 "점프 플랫폼"과 자연스럽게 이어짐.

---

## 검증

- ✅ `npm run build` — 앱 청크 55.80 KB (+0.02 KB, 상수 2개 추가분)
- ✅ `npm test` — 65 passed
- ✅ 기존 점프 감각 유지 (걷기/정지 상태에서의 점프는 그대로)
- ✅ 공중에서는 jump 입력이 먹지 않아 더블 점프 없음 (`isOnGround` 가드)

---

## Acceptance Criteria

- [x] Shift를 누른 채 Space 누르면 일반 점프보다 확실히 높이 뜸
- [x] 일반 점프(Shift 없이)는 높이 변화 없음
- [x] 대시 상태가 아닐 때는 `JUMP_FORCE`만 사용
- [x] 기존 중력/착지 감지 그대로 동작
- [x] 모든 테스트 통과

---

## 다음 작업

Wave 1 Task 6 — **경계면 토스트** (잠긴 지역/월드 끝에 닿았을 때 안내 메시지).
Wave 1 마지막 작업이며, 이후 Wave 2 시작 가능.
