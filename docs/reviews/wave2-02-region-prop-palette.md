# Wave 2 · #2 — 지역별 소품 팔레트 + 집 앞 우편함 세트

**상태**: ✅ 완료 (Level 2 — code-reviewer 1회 + HIGH 1 · MEDIUM 2 · LOW 1 반영)
**날짜**: 2026-04-24
**트리거**: 지역마다 건물/소품 분위기가 같아 "다른 동네"라는 느낌이 약함

## 목표

1. 환경 소품(tree/flower/lamp/bench)이 지역마다 다른 비율로 나와 시각적 차별화
2. mailbox는 무작위 롤에서 빼고 **집 앞 우편함**으로 배치해 장면에 생활감 추가
3. 건물 타입 자체는 이번 스코프에서 건드리지 않음 (사용자가 props 규칙만 지정)

## 규칙

**지역별 시그니처 소품 (weight=3, 나머지 1)**

| 지역 | 시그니처 |
|------|----------|
| 0 초원 마을 | 🌼 flower |
| 1 항구 마을 | 🪑 bench |
| 2 숲 마을 | 🌳 tree |
| 3 황야 마을 | 🏮 lamp |

- 가중치 합 6 → 시그니처 소품이 전체 스폰의 약 50% 차지
- 미정의 지역은 기본 weight 1 유니폼으로 폴백

**집 앞 우편함**

- 각 `house` 건물에 대해 1:1로 `mailbox` 1개 동반 배치
- 위치: 건물 중심에서 **청크 중심 방향**(도로 쪽)으로 5.0 유닛 오프셋
- 회전: mailbox 정면이 집을 향하도록 `atan2(-off.x, -off.z)`

## 변경 사항

### `src/world/Props.ts`
- `PROP_TYPES` export 제거 (dead code, 외부 consumer 0)
- `ENVIRONMENTAL_PROP_TYPES: readonly PropType[]` 신설 (tree/flower/lamp/bench만)
- `PROP_WEIGHT_BY_REGION: Record<number, Partial<Record<PropType, number>>>` — 4 지역 시그니처 매핑
- `pickEnvironmentalProp(regionId, rng)` — cumulative-subtraction weighted pick, FP 경계 fallback 포함

### `src/world/ChunkGenerator.ts`
- Import 정리: `PROP_TYPES` → `pickEnvironmentalProp`
- `MAILBOX_OFFSET = 5.0` 상수 (GLTF house scale 5 기준 집 외곽 바로 앞)
- `regionForChunk(cx, cz)` 호출을 위로 이동 (소품 + 특산품 공유)
- 환경 소품 루프: `PROP_TYPES[rng()*5]` → `pickEnvironmentalProp(regionId, rng)`
- **새 루프**: 건물 중 `house`에 대해 dominant-axis 방향으로 mailbox 동반 스폰

### `src/world/ChunkGenerator.test.ts` (+5 신규)
- region 0 flower 우세, region 2 tree 우세 (60 샘플 통계 검증)
- mailbox는 house 없는 청크에서 0개 (house-free 청크 존재 가드 포함)
- house 수 == mailbox 수 (10개 케이스 샘플링)
- mailbox 거리 = 5.0 ± 0.1

## Level 2 리뷰 결과

### code-reviewer 1차 — REQUEST CHANGES → 재검증 후 통과

| 등급 | 이슈 | 조치 |
|------|------|------|
| 🟠 HIGH | `MAILBOX_OFFSET` 선언이 import 사이에 끼어 있음 | ✅ 모든 import 아래로 이동 |
| 🟡 MED | 2.5 오프셋 → GLTF house(scale 5 ~10 유닛)에 mailbox 파묻힘 | ✅ 5.0으로 증가. localX/Z ±12 → ±7, 도로밴드(|l|<7) 밖 안착 |
| 🟡 MED | "house 없는 케이스" 테스트가 조용히 통과 가능 | ✅ `checkedHouseless` 플래그 + 최종 `expect(...).toBe(true)` |
| 🟢 LOW | `PROP_TYPES` export dead code | ✅ 제거 |

재검증: 95/95 테스트 · 빌드 깨끗.

## 의도적으로 *안* 한 것

- **건물 타입 지역별 가중치** — 사용자가 props 규칙만 지정. 건물 변주는 후속 패치 후보.
- **mailbox 회전을 집 정확히 겨냥** — dominant-axis로만 스냅하므로 45° 단위. 충분히 자연스러움.
- **`pickEnvironmentalProp`을 `utils/rng`로 추출** — 현재 단일 사용처, YAGNI 유지.

## Acceptance Criteria

- [x] 지역별 시그니처 소품이 다른 환경 소품보다 통계적으로 많이 나옴 (각 지역 테스트)
- [x] `house`가 있는 청크에만 mailbox 동반 (없는 청크엔 0개)
- [x] house 수 == mailbox 수 (엄격 1:1)
- [x] mailbox 위치가 도로 밴드 안으로 들어가지 않음
- [x] 기존 92 테스트 회귀 없음 · 신규 95/95 통과
- [x] code-reviewer HIGH/MED 모두 반영

## 회귀 트리거 파일

- `src/world/Props.ts`, `src/world/ChunkGenerator.ts`
- `src/world/Buildings.ts` (house 스케일 바뀌면 MAILBOX_OFFSET 재검토)
- `src/world/BuildingColliders.ts`, `src/world/ChunkMeshFactory.ts`
