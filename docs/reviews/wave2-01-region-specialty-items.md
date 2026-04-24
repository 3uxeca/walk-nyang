# Wave 2 · #1 — 지역별 특산품 아이템 시스템

**상태**: ✅ 완료 (Level 2 — code-reviewer 1회 + HIGH 1 / MEDIUM 3 반영, LOW 3 의도적 스킵)
**날짜**: 2026-04-24
**스코프**: 지역 × 아이템 매트릭스 foundation + 4종 특산품 에셋 + HUD/토스트 힌트 (Wave 2 #1 + #3 통합)

## 목표

1. 각 지역에 시그니처 아이템을 부여해 방문 동기 부여
2. 기본 아이템(star/coin/gem)은 전 지역 공통 스폰 유지 — 진행감 보호
3. 특산품은 **덜 스폰되지만 수집 가치가 높음** (weight 3)
4. 플레이어가 "이 지역엔 뭐가 있지"를 토스트·HUD로 즉시 인지

## 매핑

| 지역 | 특산품 | 타입 | 쉐입 | 색 |
|------|--------|------|------|-----|
| 0 초원 마을 🌿 | 꽃 🌸 | `flower` | 노란 중심 + 분홍 꽃잎 5장 | pink/yellow |
| 1 항구 마을 ⚓ | 물고기 🐟 | `fish` | 방추형 몸 + 꼬리 + 눈 | cyan |
| 2 숲 마을 🌲 | 네잎클로버 🍀 | `clover` | 4장 십자 + 연한 중심 | green |
| 3 황야 마을 ✨ | 물방울 💧 | `droplet` | 구 + 원뿔 + 내부 글로우 | blue 반투명 |

## 규칙

- **스폰**: 기본 2–4개/청크는 그대로. 특산품은 청크당 **15% 확률**로 1개 추가 슬롯 (기본과 별도)
- **보상**: 특산품 수집 시 `totalCollected += 3` (기본은 +1)
- **레벨업 임계치**: 변화 없음 (20). 특산품 1개 = 기본 3개분
- **힌트 노출**:
  - HUD의 지역명 옆에 특산품 이모지 상시 표시 (`🌿 초원 마을 🌸`)
  - 지역 잠금 해제 토스트에 특산품 안내 (`🎉 새 지역 해제! 🌲 숲 마을 — 🍀 네잎클로버가 자라요`)

## 변경 사항

### 신규 파일
- `src/game/ItemTypes.ts` — `ItemType` union, `BASE_ITEM_TYPES`, `ITEM_WEIGHT` record. 순환 import 방지 위해 독립 모듈.

### 수정 파일
- `src/game/RegionManager.ts` — `RegionInfo.specialty?: RegionSpecialty` 필드 추가 · 4 지역 데이터 채움
- `src/world/ChunkGenerator.ts` — 기본 풀 `BASE_ITEM_TYPES`로 교체 · regionId 기반 특산품 슬롯 (id 접미사 `sp`로 기본 슬롯과 충돌 방지)
- `src/game/ItemSystem.ts`
  - `CollectHandler` 시그니처 `(id) => void` → `(id, type) => void`
  - `createItemMesh`에 4 타입(꽃·물고기·클로버·물방울) 절차적 지오메트리 추가
  - `ActiveItem`에 `type` 필드 — 수집 시 콜백에 전달
  - 끝에 `never` 분기로 exhaustiveness 가드 (code-reviewer MED)
- `src/game/ProgressSystem.ts`
  - `collect(id, weight=1)` 확장 (backward compat)
  - `setTotalCollected(total, collectedIds?)` 신설 — 로드 시 리플레이 대신 누적값·dedup Set을 한 번에 복원 (code-reviewer HIGH)
  - 레벨 계산은 기존 `calcLevel()` 재사용 (code-reviewer MED)
- `src/game/SaveSystem.ts` — `SaveData.totalCollected?: number` 옵션 필드 (backward compat 폴백: `collectedItemIds.length`)
- `src/main.ts`
  - 로드 경로: `progressSystem.setTotalCollected(total, ids)` — 과거 replay 루프 대체
  - Collect 콜백: `ITEM_WEIGHT[type]`로 weight 전달, 특산품은 전용 FX 색상(`Partial<Record<ItemType, number>>`)
  - HUD 호출 3곳에 `specialty.emoji` 전달
- `src/ui/HUD.ts` — 지역명 옆 `specialtyIcon` span 추가 · `update(...)` 시그니처에 `specialtyEmoji?` 추가
- `src/ui/RegionUnlockFX.ts` — 토스트 텍스트에 특산품 한 줄 (textContent 기반, XSS 안전 유지)

### 테스트 (+11 → 90/90)
- ProgressSystem: weight=3, 레벨업, dedup, `setTotalCollected` 복원 (6건 신규)
- SaveSystem: `totalCollected` round-trip + legacy 폴백 (2건 신규)
- ChunkGenerator: 특산품 id/타입 매칭, 기본 아이템 범위, 결정성 (3건 신규)

## Level 2 리뷰 결과

### code-reviewer 1차 — COMMENT

| 등급 | 이슈 | 조치 |
|------|------|------|
| 🟠 HIGH | `setTotalCollected`가 `collectedIds` Set을 동기화 안 함 → 로드 후 재수집 시 dedup 깨짐 | ✅ 두 번째 인자 `collectedIds?`로 Set 함께 복원 + 회귀 테스트 추가 |
| 🟡 MED | `specialtyColors: Record<string, number>` 타입 안전성 느슨 | ✅ `Partial<Record<ItemType, number>>`로 교체 |
| 🟡 MED | `createItemMesh` 새 타입 추가 시 조용히 빈 Group 반환 | ✅ 마지막에 `const _: never = type` 가드 + throw |
| 🟡 MED | `setTotalCollected`의 레벨 계산이 `collect()`와 중복 | ✅ 공용 `calcLevel()` 재사용 |
| 🟢 LOW | `createItemMesh` ~90줄 | 스킵 — MVP 적정. 5번째 특산품 추가 시 factory map으로 분리 예정 |
| 🟢 LOW | 기본 아이템 FX 색상 `Math.random()` | 스킵 — cosmetic만, 결정성 영향 없음 |
| 🟢 LOW | `.DS_Store` 기추적 | 스킵 — 별도 `.gitignore` 정리 작업 |

## 의도적으로 *안* 한 것

- **새 지역 추가**: 현재 4개 지역(초원/항구/숲/황야) 그대로. 지역 확장은 Wave 4 #2 스코프.
- **지역별 고유 건물 팔레트 (Wave 2 #2)**: 같은 5종 건물을 지역마다 다른 비율로 배치하는 건 아직 미작업. 다음 Wave 2 항목.
- **특산품 전용 수집 FX/사운드 차별**: 색상만 다르게 했고 파티클/사운드는 기본과 공유. 플레이 피드백 받아보고 결정.
- **특산품 카탈로그 UI (어느 지역에 뭐가 있는지 한눈에)**: Wave 3(UI 확장) 후보.

## Acceptance Criteria

- [x] 각 지역이 고유 특산품을 스폰하며 기본 아이템은 공통 유지
- [x] 특산품은 기본보다 적게 스폰, 수집 시 3배 weight
- [x] HUD 지역명 옆에 특산품 이모지 상시 노출
- [x] 지역 잠금 해제 토스트에 특산품 안내
- [x] 예전 세이브(필드 없음) backward compat 로드
- [x] 90/90 테스트 통과 · 빌드 깨끗 · TS exhaustiveness 가드
- [x] code-reviewer HIGH + MEDIUM 모두 반영

## 회귀 트리거 파일

- `src/game/ItemTypes.ts`, `src/game/RegionManager.ts`, `src/game/ProgressSystem.ts`, `src/game/SaveSystem.ts`
- `src/world/ChunkGenerator.ts`, `src/game/ItemSystem.ts`
- `src/main.ts` init/collect 콜백/HUD 호출
- `src/ui/HUD.ts`, `src/ui/RegionUnlockFX.ts`
