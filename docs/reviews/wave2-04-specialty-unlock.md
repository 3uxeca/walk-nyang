# Wave 2 · #4 — 지역 특산품 3개 모으기로 다음 지역 언락

**상태**: ✅ 완료 (Level 2 — code-reviewer 1회 + CRITICAL 1 · MEDIUM 2 반영, LOW 2 스킵)
**날짜**: 2026-04-24
**스코프**: 언락 주체를 "누적 20개 자동" → "지역 특산품 3개 명시" 로 전환

## 동기

Wave 2 #1에서 지역 특산품이 도입됐지만, 언락 트리거는 여전히 total 기반이라 특산품 자체는 "큰 보상"일 뿐 진행 흐름과 직접 엮이지 않았다. #4는 특산품을 언락의 주체로 승격해 "이 지역의 꽃 3개를 찾으면 다음 마을이 열려요" 라는 명확한 루프를 만든다.

## 규칙

- 각 지역의 특산품 3번째 수집 시 `regionId + 1` 언락
- 4번째 이상은 계속 카운트되지만 언락 콜백은 재발화하지 않음 (통계 목적)
- 지역 카탈로그 밖(regionId=4 이상)은 `main.ts`에서 `REGION_NAMES` 가드로 drop
- 기존 총량 기반 level/threshold는 **HUD 진행바 표시용으로 보존**하되 언락 로직에서 분리

## 변경 사항

### `src/game/ItemTypes.ts`
- `SPECIALTY_REGION_BY_TYPE: Partial<Record<ItemType, number>>` — flower→0, fish→1, clover→2, droplet→3
- `SPECIALTY_UNLOCK_THRESHOLD = 3`

### `src/game/ProgressSystem.ts`
- `onLevelUp` 필드 + `regionForLevel` export 제거 (dead code — code-reviewer MED)
- `collect()`가 `boolean` 반환 — 신규면 true, dedup이면 false (code-reviewer CRITICAL)
- `onRegionUnlock: ((nextRegionId) => void) | null` 신설
- `specialtyCountByRegion: Map<number, number>` 상태 + `recordSpecialty()`, `getSpecialtyCount()`
- 로드/세이브 연동: `setSpecialtyCounts()` (NaN/비숫자 값 필터 — code-reviewer MED) · `getSpecialtyCountsSnapshot()`

### `src/game/SaveSystem.ts`
- `SaveData.specialtyCountByRegion?: Record<number, number>` 옵션 필드

### `src/main.ts`
- Import: `REGION_NAMES` + `SPECIALTY_REGION_BY_TYPE` 추가
- 기존 `onLevelUp` 핸들러 제거, `onRegionUnlock` 핸들러로 교체 (`REGION_NAMES` 가드)
- Collect 콜백: `collect()`의 boolean으로 `recordSpecialty()` 게이팅 — dedup 시 특산품 카운트 중복 증가 방지
- `buildSaveData`: `getSpecialtyCountsSnapshot()` 포함
- 로드: `setSpecialtyCounts(saveData.specialtyCountByRegion)` (존재 시만)

### 테스트 (103 → 99 net; 기존 5건 obsolete 제거, 신규 8건 추가)
- **제거**: `regionForLevel` describe (3건), `collecting 19/20 → onLevelUp` (2건)
- **신규**:
  - `collect()` boolean 반환
  - `weight=3` × 7 → level 1 진입 (이제 `currentLevel`/`threshold`만 확인)
  - `setTotalCollected`는 `onRegionUnlock` 미발화
  - `recordSpecialty` 3회 트리거 / 4회 이후 재발화 없음 / 지역 독립 / 마지막 지역(3) 콜백 4 발화
  - `setSpecialtyCounts` round-trip · load-silent
  - `setSpecialtyCounts` 비정상 키/값 필터
  - `SaveData.specialtyCountByRegion` round-trip · legacy 호환

## Level 2 리뷰 결과

### code-reviewer 1차 — REQUEST CHANGES → 재검증 후 통과

| 등급 | 이슈 | 조치 |
|------|------|------|
| 🔴 CRITICAL | `recordSpecialty`가 `collect()` dedup 게이트 바깥에서 호출됨 → 같은 id 재수집 시 특산품 카운트 중복 증가 (오늘 `ItemSystem`이 막지만 구조적 취약) | ✅ `collect()`가 boolean 반환, main.ts에서 `if (!isNew) return` 게이트 |
| 🟡 MED | `onLevelUp` dead field — `collect()` while-loop 안에서도 발화하지만 아무도 assign 안 함 | ✅ 필드 + 호출 + `regionForLevel` 모두 삭제. while-loop는 HUD용 `currentLevel`/`threshold`만 갱신 |
| 🟡 MED | `setSpecialtyCounts` localStorage 수동 편집 방어 부재 (NaN 키 등) | ✅ `Number.isFinite` 필터 추가 + 전용 테스트 |
| 🟢 LOW | `REGION_NAMES`의 `Record<number, ...>` 타입이 `in` 가드 의도를 약하게 함 | 스킵 — 런타임 정확성은 유지, 타입 타이트닝은 별도 PR |
| 🟢 LOW | `.DS_Store` 기추적 | 스킵 — 기존 이슈, `.gitignore` 정리는 별도 정리 작업 |

## 의도적으로 *안* 한 것

- **HUD 진행바를 특산품 기반으로 재설계** — 현재 특산품 이모지(Wave 2 #1) + 언락 토스트로 피드백 충분. 바 재설계는 복잡도 대비 이득 작고, Wave 3 UI 확장 스코프에 맞물림.
- **특산품 수집 시 진행 토스트 ("꽃 2/3")** — 모든 수집마다 알림은 소음. 언락 토스트로만 피드백.
- **언락 완료 지역에서 같은 특산품이 추가로 나오게 제한** — 다른 이슈. 플레이어가 계속 모으고 싶어할 수 있으므로 제한 없이 스폰 유지.

## Acceptance Criteria

- [x] 한 지역 특산품 3번째 수집 → 다음 지역 언락
- [x] 4번째 이상 수집은 언락 재발화 없이 카운트만 증가
- [x] 마지막 지역(황야) 3개 수집 시 조용히 drop (카탈로그 밖)
- [x] 예전 세이브(필드 없음) backward compat
- [x] 로드 시 언락 콜백 발화 없음
- [x] 99/99 테스트 통과 · 빌드 깨끗
- [x] code-reviewer CRITICAL + MED 모두 반영

## 회귀 트리거 파일

- `src/game/ItemTypes.ts`, `src/game/ProgressSystem.ts`, `src/game/SaveSystem.ts`
- `src/main.ts` collect 콜백, save/load 경로, `onRegionUnlock` 핸들러
- `src/game/RegionManager.ts` — `REGION_NAMES` 키셋 변경 시 main.ts 가드 재검토
