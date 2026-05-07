# Wave 3 #2 — 내 고양이 정보 패널 (HUD 확장) (Review)

> 2026-05-06 ~ 05-07 · 실행 모드: **Level 2** — 주간보고서 E1 비교 케이스 (Wave 3 #1 = Level 3)
> spec: [`.omc/plans/wave3-02-info-panel.md`](../../.omc/plans/wave3-02-info-panel.md)

## 결과 요약

| 항목 | 값 |
|------|-----|
| 결과 | ✅ APPROVED (2차 reviewer) |
| 라운드 | executor 1차 → reviewer 1차 (NEEDS FIX) → executor fix → reviewer 2차 (APPROVED) |
| 적발 결함 (1차) | CRITICAL **1** / HIGH 0 / MEDIUM 1 / LOW 1 |
| 반영률 | CRITICAL **100%** · MEDIUM 1/1 (13자 거부 회귀 테스트) · LOW 0/1 (의도적 스킵 — 무관 변경) |
| 최종 테스트 | **177 passed** (Wave 3 #1 종착 131 → 신규 +35 → playtest 후속 +11) |
| 빌드 | TS strict 통과, app 100.49 kB / 29.03 kB gzip |
| 변경 파일 | 핵심 8 (#2 spec) + playtest 후속 7 (별도 커밋) |

## 주요 결정

### 정보 패널 형태
**좌상단 HUD 확장**으로 결정 (별도 패널 미생성). 이유:
- 시선 분산 최소화 — 한 카드에서 닉네임 + 진행도 + 지역 정보 일괄 노출
- 기존 카드 톤(주황 #FF8C42, Nunito) 일관성 유지
- 모바일 가상조이스틱·액션버튼과의 좌표 충돌 회피

### HUD 구성
```
🐱 산책냥 ✏️       ← row0 (신규: 닉네임 + 편집)
🐾 138/140 [bar]   ← row1 (기존: 레벨 게이지)
🌿 풀숲마을 🌹 1/3  ← row2 (기존 + 특산품 카운트 추가)
```

## 1차 reviewer 적발 → 반영 매트릭스

| 등급 | 이슈 | 위치 | 반영 |
|------|------|------|------|
| CRITICAL | 모달 닫기(ESC/배경/✕/취소) 시 `controller.setInputEnabled(true)`가 호출 안 돼 게임 입력이 영구 잠김 — 새로고침해야 풀림 | `CatNameModal.ts`, `main.ts:181-197` | ✅ `CatColorModal` 패턴 재사용. `open(name, onSave, onClose?)` 시그니처로 확장. `close()`가 모든 닫기 경로에서 onClose 호출. main.ts onSave에서 `setInputEnabled(true)` 제거 → onClose에서만 호출 (중복 방지). |
| MEDIUM | 13자 입력 거부 회귀 테스트 누락 — `maxlength=12` HTML 속성을 우회한 programmatic `.value` 케이스 미검증 | `CatNameModal.test.ts` | ✅ "13자 이상 → onSave 미호출" 케이스 + onClose 5경로(ESC/배경/취소/✕/저장 후) 회귀 테스트 7개 추가. |
| LOW | `vite.config.ts` 포트 3000 → 3900 변경이 본 작업과 무관 | `vite.config.ts:8` | ⏭ 의도적 스킵 — 본 spec 외 변경, 별도 처리. |

## 변경 파일

### 신규
- `src/ui/CatNameModal.ts` — 닉네임 편집 모달 (CatColorModal 패턴 재사용)
- `src/ui/CatNameModal.test.ts` — 25개 단위 테스트 (열림/닫힘/저장/검증/onClose 5경로/13자 거부)
- `src/ui/HUD.test.ts` — 11개 단위 테스트 (nickname/specialtyCount 표시, count undefined 비표시, ✏️ 콜백)

### 수정
- `src/game/SaveSystem.ts` — `DEFAULT_NICKNAME = '산책냥'`, `SaveData.nickname?: string`, sanitize 확장
- `src/game/SaveSystem.test.ts` — nickname 라운드트립/폴백/비정상 타입 (6 케이스 추가)
- `src/ui/HUD.ts` — row0 신규 (닉네임 + ✏️), row2 특산품 `n/3` 추가, `update()` 시그니처 확장, `HUDOptions`
- `src/main.ts` — CatNameModal wiring, currentNickname 로드/세이브, hud.update 호출 5사이트 갱신

## playtest 후속 조정 (Wave 3 #2 종착 후 추가 커밋)

사용자 플레이테스트 피드백을 반영해 게임플레이 균형·UX 보완. 본 spec 범위 외이지만 같은 세션에서 처리.

| 커밋 | 변경 | 이유 |
|------|------|------|
| `6a9c952` | `ITEM_WEIGHT[specialty] = 3 → 0` | 일반 게이지(레벨)와 특산품 진행을 시각·기능적으로 분리. 다음 마을 해제는 특산품 단독 게이팅 명확화 |
| `4bec292` | 게이지 캡 + 토스트 (`ProgressSystem.collect(gateLevelUp)`) | 특산품 미완 + 다음 마을 대기 시 일반 아이템으로 게이지가 threshold를 넘지 않게 캡. "특산품 X개 더 모아!" 토스트 (지역별 throttle) |
| `267f6fe` | 잠긴 지역 토스트 특산품 힌트 | "🔒 🌸을 N개 더 모으면 잠금 해제!" — 잠긴 region 진입 시도에서 prereq region 특산품 진행 가시화 |
| `53c0ad2` | 기본 색상 #ff8c32 → #272727 (블랙) | 신규 사용자 첫 인상 톤. CatColorModal '블랙' 프리셋과 동일 hex |
| `f9fb497` | 캡 도달 시 일반 아이템 일괄 제거 (`ItemSystem.removeBaseItems`) | 더 모아도 진행 안 되는 일반 아이템이 시각 노이즈로 남지 않게. 특산품은 보존 → 탐색 동기 유지 |
| `55ad6d0` → `4082aa3` → `f6b9ccc` | 게이트 region 모델 정착 (`findGateRegionId`, `recomputeLevel`) | playtest에서 (1) 마을 진입 시 threshold 미동기화, (2) specialty 1·2개에서 threshold 미리 풀림, (3) 뒷마을 복귀 시 cap 회귀 — 세 회귀를 거쳐 "최상위 unlocked region 기준 단일 게이트"로 수렴 |

### 게이트 region 진화 과정 (Level 2의 디버그 비용)
| 시도 | 기준 | 발견된 회귀 |
|------|------|-----------|
| v1 | `currentRegionId`(물리 위치) + `gateLevelUp` | 캡 후 다음 마을 walk → threshold 안 풀림 |
| v2 | + region 진입 시 `recomputeLevel` | specialty 2/3에서 threshold가 풀려버림 |
| v3 | + recomputeLevel은 `onRegionUnlock`에서만 | 뒷마을 복귀 시 cap 회귀 (gate region 잘못 봄) |
| **v4 (정착)** | `findGateRegionId() = 최상위 unlocked region` (specialty<3 + 다음 region 존재 시) | ✅ 모든 케이스 일관 |

## Level 2 메타 관찰 (E1 비교 데이터)

| 메트릭 | Wave 3 #1 (Level 3 ralph) | **Wave 3 #2 (Level 2)** |
|--------|--------------------------|------------------------|
| executor 호출 | 4 | **2** (1차 + fix) |
| code-reviewer 호출 | 2 | **2** (1차 NEEDS FIX, 2차 APPROVE) |
| ai-slop-cleaner 호출 | 1 | 0 |
| reviewer 1차 적발 | CRITICAL 0 / HIGH 3 / MEDIUM 8 / LOW 9 | **CRITICAL 1 / HIGH 0 / MEDIUM 1 / LOW 1** |
| 1차 → 종착 fix 라운드 | 1 (HIGH 3 + MEDIUM 3 묶음) | **1 (CRITICAL 1 + MEDIUM 1)** |
| 사용자 개입 | 0 (spec 후 ralph 진입) | **1 (spec 결정 1회) + playtest 피드백 N회** |
| 핵심 작업 외 회귀 | 0 (deslop으로 해결) | **3건** (게이트 region 진화) |
| 최종 테스트 | 131 | 177 (+46) |

### E1 가설 검증 (Level 2 vs Level 3)
- **품질**: Level 3는 reviewer 1차에서 HIGH 3건 적발, Level 2는 CRITICAL 1건 + MEDIUM 1건. **CRITICAL 적발률은 Level 2가 높음** — 게임 입력 잠김 같은 통합적 버그는 단발 ralph가 놓치기 쉽지만, 별도 reviewer 호출은 catch.
- **개입 비용**: Level 2가 spec 단계 + playtest 피드백 단계에서 사용자 개입 多. 게이트 메커니즘은 4번 진화. → **콘텐츠성(#1)은 Level 3, 게임 메커니즘 튜닝(#2)은 Level 2 적합** 가설 부분 검증.
- **회귀 비용**: Level 2의 playtest 회귀 3건이 본 작업 외에서 발생 — 가설 다듬기 단계의 자연스러운 학습 비용. spec에 더 많은 시나리오 명시했더라면 줄였을 가능성.

## 다음 단계

- E3: 토큰 사용량 `cost-log.md`에 기록.
- ROADMAP에 Wave 3 #2 ✅ 표시.
- 후속: Wave 3 #3 (의상·액세서리) 또는 #4 (수집 히스토리). #3은 GLTF body 추출이 필요해 Level 3 후보, #4는 콘텐츠성 작업이라 Level 3 후보 — E1 가설 추가 검증.
