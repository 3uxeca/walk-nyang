# walk3d 통합 로드맵

> Phase 0(기획)부터 현재 진행 중인 Wave 1.5, 그리고 미래 Wave 2–5까지 한 화면으로 정리한 마스터 인덱스.
> 각 항목은 관련 문서 링크와 현재 상태를 포함한다.

**범례**: ✅ 완료 · 🔧 진행 중 · ⏳ 계획 · 🚫 보류

---

## 🌱 Phase 0 — 기획 · 합의 (2026-04-17)

> OMC 파이프라인을 통한 요구사항 정립 + 아키텍처 합의.

| 항목 | 상태 | 산출물 | 비고 |
|------|------|--------|------|
| Deep Interview | ✅ | [`.omc/specs/deep-interview-walk3d.md`](../.omc/specs/deep-interview-walk3d.md) | 6 rounds, 모호도 18% PASSED (threshold 20%) |
| RALPLAN-DR Consensus | ✅ | [`.omc/plans/walk3d-village-game.md`](../.omc/plans/walk3d-village-game.md) | Planner→Architect→Critic, CRITICAL 5 + MAJOR 3 반영 |
| PRD 작성 | ✅ | [`.omc/prd.json`](../.omc/prd.json) | 12 user stories US-001~US-012 |
| 미해결 질문 | ✅ | [`.omc/plans/open-questions.md`](../.omc/plans/open-questions.md) | 차후 결정 항목 정리 |

---

## 🏗 Phase 1 — v1 구현 (ralph 자동 실행, 2026-04-17 ~ 04-20)

> Ralph PRD 루프가 12 스토리를 순차 자동 실행. 각 스토리당 평균 7개의 acceptance criteria.

| Story | 제목 | 상태 |
|-------|------|------|
| US-001 | 프로젝트 초기화 + 테스트 인프라 | ✅ |
| US-002 | Low-poly chibi 캐릭터 + WASD 이동 + 3인칭 카메라 | ✅ |
| US-003 | ChunkGenerator + ChunkManager | ✅ |
| US-004 | 콘텐츠 다양화 + 격자 도로 | ✅ |
| US-005 | Web Worker + 오브젝트 풀링 | ✅ |
| US-006 | ChunkGenerator 아이템 + ItemSystem | ✅ |
| US-007 | ProgressSystem + RegionManager + 프록시 메시 | ✅ |
| US-008 | ChunkManager 연계 + 세션 게이트 | ✅ |
| US-009 | SaveSystem + HUD + 언락 FX | ✅ |
| US-010 | 비주얼 폴리싱 | ✅ |
| US-011 | 코드 리뷰 + QA | ✅ |
| US-012 | 평가 + 최종 검증 | ✅ |

**진행 로그**: [`.omc/progress.txt`](../.omc/progress.txt)

---

## 🔧 Phase 2 — v2 버그 수정 (3회차 · 2026-04-20)

> 12건 이슈 수정. 자세한 원인/패치는 [`FIXES.md`](../FIXES.md) 참조.

| 회차 | 이슈 수 | 영역 |
|------|---------|------|
| 1회차 | 4 | 도로/건물 충돌, 벤치 크기, 고양이 통과, 경계 아이템 |
| 2회차 | 5 | 가로등/나무/코인 비주얼, 건물 occlusion, 도로 위 소품 |
| 3회차 | 3 | 잠긴 지역 아이템 근본수정, 도로/지형 비주얼, Z-fighting |

---

## 🎨 Phase 3 — 비주얼 폴리싱 (2026-04-20)

| 항목 | 상태 | 파일 |
|------|------|------|
| SkySystem (그라디언트 돔 + 구름) | ✅ | `src/world/SkySystem.ts` |
| HeartFX (idle 5초 하트 파티클) | ✅ | `src/game/HeartFX.ts` |
| 도로 RoadGrid 전면 재작성 (인도/엣지/대시) | ✅ | `src/world/RoadGrid.ts` |
| 지형 ShaderMaterial 격자 | ✅ | `src/world/ChunkMeshFactory.ts` |
| 카메라→고양이 occlusion 투명화 | ✅ | `src/main.ts` |

---

## 🩹 Phase 4 — 근본 수정 + Z-fighting (2026-04-20 ~ 04-21)

| 항목 | 상태 | 패치 |
|------|------|------|
| 청크 좌표계 `(cx+0.5)*32` 전환 | ✅ | 잠긴 지역 아이템 스폰 근본 차단 |
| Z-fighting 종합 (Y 레이어 + polygonOffset) | ✅ | RoadGrid + ChunkMeshFactory |
| 글로벌 바닥 중복 제거 | ✅ | main.ts 300×300 plane 삭제 |
| GLTF 머티리얼 깊은 복제 | ✅ | AssetManager.clone — 투명화 전염 버그 해결 |
| 도로 EW/NS non-overlap 타일 | ✅ | RoadGrid 토막 분할 |

---

## 📚 Phase 5 — v2 문서화 + 배포 (2026-04-21)

| 항목 | 상태 | 산출물 |
|------|------|--------|
| `ASSETS.md` 에셋 정리 | ✅ | Kenney/Quaternius/Freesound CC0 |
| `docs/walk3d-v2.pptx` (19 슬라이드) | ✅ | + `build_pptx.py` 재생성 스크립트 |
| `README.md` (히어로/배지/Quick Start) | ✅ | 라이브 데모 링크 포함 |
| GitHub Pages 자동 배포 | ✅ | `.github/workflows/deploy.yml` |
| `docs/PROMPT_HISTORY.md` | ✅ | 사용자 프롬프트 전체 타임라인 |
| `docs/AGENT_STATS.md` | ✅ | 9 에이전트 / 22+ 스폰 통계 |
| 잠긴 지역 하드 블록 + 토스트 (hotfix) | ✅ | onRoad 예외 제거 |
| 미로딩 청크 진입 차단 (hotfix) | ✅ | activeRadius 2→3, hasChunk 가드 |

---

## 🚀 Wave 1 — 퀵윈 (2026-04-21, 완료)

> 의존성 없는 6개 항목. 각 작업당 평균 10–20분. 직접 실행(Level 1).

| # | 항목 | 상태 | 리뷰 문서 | 커밋 |
|---|------|------|-----------|------|
| 1 | 지역 네이밍 (REGION_NAMES 단일 소스) | ✅ | [`wave1-01`](reviews/wave1-01-region-naming.md) | `a1bc0a3` |
| 2 | 코드 스플리팅 (three vendor 청크) | ✅ | [`wave1-02`](reviews/wave1-02-code-splitting.md) | `c8bea54` |
| 3 | Idle zoom 카메라 | ✅ | [`wave1-03`](reviews/wave1-03-idle-zoom-camera.md) | `758145d` |
| 4 | 대시 속도감 FX (FOV + 먼지 트레일) | ✅ | [`wave1-04`](reviews/wave1-04-dash-speed-fx.md) | `8e82bb5` |
| 5 | 대시 점프 더 높이 | ✅ | [`wave1-05`](reviews/wave1-05-dash-jump-higher.md) | `3e36cfc` |
| 6 | 경계면 토스트 (Toast 컴포넌트) | ✅ | [`wave1-06`](reviews/wave1-06-boundary-toast.md) | `ad63949` |

**Hotfix**:
- ✅ 미로딩 청크 진입 차단 ([`hotfix-unloaded-chunk`](reviews/wave1-hotfix-unloaded-chunk.md), `4c990fd`)
- ✅ 잠긴 지역 하드 블록 ([`hotfix2-hard-lock`](reviews/wave1-hotfix2-hard-lock.md), `32bedae`)

---

## 📱 Wave 1.5 — 모바일 컨트롤 (진행 중)

> Wave 2 이전에 우선순위 조정으로 삽입. Level 2 (writer + code-reviewer 분리) 적용.

| Phase | 항목 | 상태 | 리뷰 문서 | 커밋 |
|-------|------|------|-----------|------|
| 1 | Controller 리팩토링 (InputSource 추상화) | ✅ | [`phase1`](reviews/wave1.5-phase1-controller-refactor.md) | `3f957eb` |
| 2 | VirtualJoystick + MobileActionButtons + TouchInputSource | ✅ | [`phase2`](reviews/wave1.5-phase2-touch-controls.md) | `2f1c2e7` |
| 3 | **랜딩(시작) 화면** — 로고 + START 버튼, 모바일/데스크탑 공통 | ⏳ | — | — |
| 4 | 실기 테스트 + Vitest pointer event 스텁 | ⏳ | — | — |

### Phase 3 — 랜딩 화면 (다음 작업)

- 사용자 제공 로고 (`public/walk-nyang-logo.png`, 585KB)
- 게임 시작 전 풀스크린 오버레이 — 로고 + 타이틀 + START 버튼
- 모바일/데스크탑 공통 (조이스틱이 START 버튼 위에 그려지지 않도록 표시 순서 관리)
- 첫 사용자 인터랙션을 START 클릭으로 강제 → Web Audio context의 autoplay 정책도 자연스럽게 unlock
- 추후: 세이브 있는 경우 "이어하기" 보조 버튼, 옵션(소리 끄기 등)

---

## 🌳 Wave 2 — 콘텐츠 기반 구조 (계획)

> Wave 1 #1 (지역 네이밍) 의존성 해소됨 → 시작 가능.

| 항목 | 의존성 | 추정 |
|------|--------|------|
| 지역 × 아이템 매트릭스 (어느 지역에 어떤 아이템이 나오는지) | Wave 1 #1 ✅ | 0.5d |
| 지역별 고유 건물 팔레트 | Wave 1 #1 ✅ | 1d |
| 고양이 테마 아이템 (츄르 · 사냥장난감 · 깃털) | 매트릭스 | 1d |
| 지역별 필수 수집 아이템 (언락 조건) | 매트릭스 + 테마 아이템 | 0.5d |

**총 추정**: 3일

---

## 🐱 Wave 3 — UI · 커스터마이징 (계획)

| 항목 | 의존성 | 추정 |
|------|--------|------|
| 고양이 색상 커스터마이즈 UI (세이브 연동) | 없음 | 1d |
| 내 고양이 정보 패널 (좌/우 하단) | 색상 UI | 0.5d |
| 의상·액세서리 (리본·모자) | 색상 UI | 1d |
| 수집 히스토리 타임라인 | 없음 | 0.5d |

**총 추정**: 3d (모바일 UI 레이아웃 검증 추가 시 +0.5d)

---

## 🏔 Wave 4 — 대형 시스템 (계획)

> 각 항목이 신규 시스템이라 Phase 분리 권장. Level 3 (ralph) 적합 후보.

| 항목 | 리스크 | 추정 |
|------|-------|------|
| 점프로 올라갈 수 있는 지형 (낮은 플랫폼) | 🟡 중 | 1.5d |
| 지역 5–8개 확장 + 랜드마크 | 🟡 중 | 2d |
| NPC 고양이 + 일기 퀘스트 | 🔴 대 | 4d (Level 3 권장) |
| 모바일 가상 조이스틱 | ✅ Wave 1.5에서 처리됨 | — |
| 주야간 셰이더 + 날씨 (비/눈) | 🔴 대 | 3d |

**총 추정**: 1.5–2주

---

## ✨ Wave 5 — 폴리싱 · 성능 (계획)

> 실측 성능 이슈 또는 콘텐츠 확장 후 필요 시.

| 항목 | 트리거 | 추정 |
|------|--------|------|
| KTX2/Basis 압축 텍스처 | Wave 4 #2 (지역 확장) 후 | 1d |
| 계절감 BGM | Wave 4 #5 (주야간) 후 | 1d |
| 추가 코드 스플리팅 (lazy import) | 번들 1MB 초과 시 | 0.5d |

---

## 🔮 향후 의존성 그래프

```
Phase 0–5 (완료)
   │
   ├─▶ Wave 1 (퀵윈, 완료)
   │      └─▶ Wave 1.5 모바일 컨트롤 (Phase 3 남음)
   │             └─▶ Wave 2 (모바일 검증 매번 추가)
   │
   └─▶ Wave 2 콘텐츠 ─┬─▶ Wave 3 UI/커스터마이즈
                       └─▶ Wave 4 대형 시스템 ─▶ Wave 5 폴리싱
```

---

## 📊 메타 통계

| 지표 | 값 |
|------|-----|
| 총 작업 기간 | 2026-04-17 ~ 진행 중 (약 5일 활성) |
| OMC 파이프라인 사용 | deep-interview · ralplan · ralph · code-reviewer · ai-slop-cleaner |
| 사용 에이전트 타입 | 9종 (planner · architect · critic · executor · designer · code-reviewer · qa-tester · scientist · verifier) |
| 누적 커밋 수 | 18+ (main 기준) |
| 테스트 커버리지 | 65 tests · 9 files · 100% pass |
| 빌드 | TypeScript strict · Vite 6 · 분리된 청크 (app 66KB / three 619KB gzip) |
| 프로덕션 배포 | https://3uxeca.github.io/walk-nyang/ (자동 배포) |

---

## 🔗 관련 문서 일람

- 사용자 프롬프트 타임라인: [`PROMPT_HISTORY.md`](PROMPT_HISTORY.md)
- 에이전트 실행 통계: [`AGENT_STATS.md`](AGENT_STATS.md)
- 에셋 출처/라이선스: [`../ASSETS.md`](../ASSETS.md)
- v2 버그 수정 내역: [`../FIXES.md`](../FIXES.md)
- v2 발표 자료 (PPTX): [`walk3d-v2.pptx`](walk3d-v2.pptx)
- 개별 작업 리뷰: [`reviews/`](reviews/)
- README (라이브 데모 + Quick Start): [`../README.md`](../README.md)

---

*문서 마지막 업데이트: 2026-04-21 · Wave 1.5 Phase 2 완료 시점*
