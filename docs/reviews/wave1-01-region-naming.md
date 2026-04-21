# Wave 1 · Task 1 — 지역 네이밍

**상태**: ✅ 완료
**날짜**: 2026-04-21
**추정 → 실제**: 0.5일 → 약 20분

---

## 목표

- 숫자(0/1/2/3)로만 표시되던 지역 라벨을 이름+이모지로 교체
- 이름을 여러 파일에 흩어놓지 않고 `RegionManager`에 단일 소스로 중앙화
- Wave 2의 "지역 × 아이템 매트릭스" 선행 해제

---

## 변경 사항

### `src/game/RegionManager.ts`
- `REGION_NAMES` 상수 + `RegionInfo` 인터페이스 추가
- `getRegionInfo(regionId)` export — fallback `{ name: '새 마을', emoji: '🗺️' }`

### `src/ui/RegionUnlockFX.ts`
- 중복되던 REGION_NAMES 로컬 선언 제거 → `RegionManager`에서 import

### `src/ui/HUD.ts`
- `this.regionIcon`를 동적 이모지로 변경 (기존 🌸 하드코딩 제거)
- `update(collected, threshold, regionName, regionEmoji?)` 시그니처 확장
- "지역 " prefix 제거 — 이름 자체가 "초원 마을" 같은 완결형

### `src/main.ts`
- `regionForChunk` + `getRegionInfo` import
- `currentRegionInfo()` 헬퍼로 플레이어 현재 지역 계산
- `lastRegionId` 트래킹 → 지역 경계 이동 시 HUD 즉시 갱신
- 초기 HUD 업데이트 + 아이템 수집 시 HUD 업데이트 모두 이름/이모지 전달

---

## 지역 매핑

| ID | 이름 | 이모지 |
|----|------|-------|
| 0 | 초원 마을 | 🌿 |
| 1 | 항구 마을 | ⚓ |
| 2 | 숲 마을 | 🌲 |
| 3 | 황야 마을 | ✨ |
| 4+ | 새 마을 | 🗺️ |

---

## 검증

- ✅ `npm run build` — TypeScript 컴파일 OK, 672KB (gzip 177KB)
- ✅ `npm test` — 65 tests, 9 files, all pass
- ✅ `RegionUnlockFX` 언락 토스트도 동일 소스를 사용하므로 HUD ↔ 토스트 이름 불일치 위험 제거

---

## Acceptance Criteria

- [x] HUD 하단 라벨이 "지역 0" → "🌿 초원 마을"로 변경됨
- [x] 레벨업 토스트의 지역 이름이 HUD의 지역 이름과 일치
- [x] 플레이어가 청크 경계를 넘어 다른 region으로 이동하면 HUD가 자동 갱신
- [x] 정의되지 않은 regionId(5+)에 대해 fallback 동작
- [x] 기존 테스트 전부 통과

---

## 다음 작업

Wave 1 Task 2 — **코드 스플리팅** (`vite.config.ts`에 manualChunks 설정).
Wave 2 Task 1 — "지역 × 아이템 매트릭스"는 이제 REGION_NAMES를 바로 참조 가능.
