# Wave 1 · Task 3 — Idle zoom 카메라

**상태**: ✅ 완료
**날짜**: 2026-04-21
**추정 → 실제**: 0.5일 → 약 10분

---

## 목표

- 평상시(이동·점프·대시)엔 카메라가 살짝 **멀리+위에서** 내려다보는 시점
- 5초 이상 가만히 있을 때 **현재 zoom으로 서서히 당김** — 고양이가 더 크고 귀엽게 보이도록
- 상태 전환은 부드럽게 (lerp)

---

## 변경 사항

### `src/camera/ThirdPersonCamera.ts`

기존:
```ts
private offset = new THREE.Vector3(0, 5, 9)
```

변경:
```ts
private offsetActive = new THREE.Vector3(0, 6.5, 12)  // 활동 중 — 멀리/위
private offsetIdle   = new THREE.Vector3(0, 5, 9)     // idle — 가까이
private currentOffset = this.offsetActive.clone()
private offsetLerpFactor = 0.025   // 오프셋 전환 속도 (≈ 1.5–2초)
```

`update(targetPosition, isIdle)` 시그니처 확장 — `isIdle` 따라 두 오프셋 사이를 lerp.

### `src/main.ts`
- `thirdPersonCamera.update(pos)` → `thirdPersonCamera.update(pos, idleTime >= 5)`
- 기존에 이미 있던 `idleTime` 상태를 그대로 재사용 (하트 파티클 트리거와 공유)

---

## 전환 타이밍

| 상태 | 오프셋 목표 | 도달 시간 |
|------|-------------|-----------|
| 이동 중 → idle | `offsetIdle` (5, 9) | 5초 대기 + 약 1.5–2초 lerp |
| idle → 이동 시작 | `offsetActive` (6.5, 12) | 즉시 트리거, 약 1.5–2초 lerp |

`lerpFactor` 0.025 @ 60fps → 1초에 약 78% 수렴 → 자연스러운 전환.

---

## 검증

- ✅ `npm run build` — 앱 청크 54.22 KB (이전 53.98 KB에서 +0.24)
- ✅ `npm test` — 65 passed
- ✅ 기본 카메라 lookAt/aspect 로직은 그대로 유지

---

## Acceptance Criteria

- [x] 시작 직후 카메라가 기존보다 살짝 멀리/위에서 보임
- [x] 5초 idle → 고양이에 가까이 줌인
- [x] 움직이기 시작하면 다시 멀리 줌아웃
- [x] 전환이 뚝뚝 끊어지지 않고 부드러움
- [x] 기존 테스트 전부 통과

---

## 다음 작업

Wave 1 Task 4 — **대시 속도감 FX** (FOV lerp + 파티클 트레일).
