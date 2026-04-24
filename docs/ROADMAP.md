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
| 3 | 랜딩(시작) 화면 — 로고 + START 버튼, Jua 폰트, 모바일/데스크탑 공통 | ✅ | [`phase3`](reviews/wave1.5-phase3-landing-screen.md) | `823cc90` |
| 4 | Vitest 스텁 테스트 + 실기 테스트 가이드 | ✅ | [`phase4`](reviews/wave1.5-phase4-tests-and-manual-guide.md) | `834ce44` |

**Hotfix**:
- ✅ DASH 홀드 → 토글 공통 전환 (Shift + 모바일 DASH 버튼) · alt-tab blur OFF · [`hotfix-dash-toggle`](reviews/wave1.5-hotfix-dash-toggle.md) · `c718149`
- ✅ UX Polish: 랜딩 사운드 힌트 · 튜토리얼 토스트(1회) + ? 모달 · `tutorialSeen` 세이브 플래그 · Toast/RegionUnlockFX XSS 방어 · [`hotfix-ux-polish`](reviews/wave1.5-hotfix-ux-polish.md) · `4051dae`

**Wave 1.5 종료** — 모바일 컨트롤 + 랜딩 화면 + 회귀 보호 + 플레이 피드백 hotfix 2건까지 완료.

---

## 🌳 Wave 2 — 콘텐츠 기반 구조 (진행 중)

> Wave 1 #1 (지역 네이밍) 의존성 해소됨. Foundation으로 매트릭스 + 특산품 에셋부터 처리.

| # | 항목 | 상태 | 리뷰 | 커밋 |
|---|------|------|------|------|
| 1 | 지역 × 아이템 매트릭스 + 특산품 4종 (꽃·물고기·클로버·물방울) weight 3 + HUD/토스트 힌트 | ✅ | [`wave2-01`](reviews/wave2-01-region-specialty-items.md) | `6dbe74a` |
| 2 | 지역별 고유 건물 팔레트 (같은 5종 건물을 지역마다 다른 비율로) | ⏳ | — | — |
| 3 | 고양이 테마 아이템 (츄르 · 사냥장난감 · 깃털) | ⏳ | — | 원래 #1에 흡수 검토 후 별도 유지 — 테마 아이템은 "특별 이벤트성"으로 분리 |
| 4 | 지역별 필수 수집 아이템 (언락 조건 강화) | ⏳ | — | — |

**진행**: 1/4 (#1 완료, 특산품 4종이 매트릭스의 체감 가치를 바로 제공)

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

## 🚀 배포 전략 — 웹 우선, 앱 출시는 검증 후 (2026-04-22 결정)

> 지금은 **웹(GitHub Pages) 플레이 유지**가 기본 경로.
> 콘텐츠 볼륨이 차오르고 재미가 검증되면 그때 네이티브 래핑/엔진 포팅 결정.

### 왜 웹 우선?

- 지금 스택(TS + Three.js + Vite)이 이미 네이티브 웹 표준 → 기획·UX·밸런싱은 나중에도 **이전 가능한 자산**
- 재미·콘텐츠 검증 전에 스토어 출시 인프라 태우는 건 낭비
- URL 공유로 지인 피드백 수집이 가장 가볍고 빠름
- Apple Developer $99/년 · Google Play $25 일회 비용은 출시가 확정될 때만 지불

### 출시 가능성 체크리스트 (6개 이상 만족 시 래핑 고려)

- [ ] 지인 10명 이상이 5분 이상 플레이하고 "또 하고 싶다"고 말함
- [ ] 핵심 게임 루프가 15분 이상 안 지루함
- [ ] 한 바퀴 도는 엔딩/목표 존재 (현재는 무한 수집만)
- [ ] 세이브 불러오기 재미가 있음 (재방문 동기)
- [ ] 콘텐츠 볼륨 최소 지역 5개+ 퀘스트
- [ ] 사운드·음악이 들어찬 상태
- [ ] 튜토리얼 없이도 조작법이 직관적
- [ ] 주요 브라우저/디바이스에서 60fps 유지
- [ ] 본인이 "남한테 돈 받아도 될 것 같다"고 느낌
- [ ] 일일 플레이어가 한 명이라도 꾸준히 있음

현재 예상 달성: 0–3개 → **아직 웹 유지 단계.**

### 3단 경로 (상황별)

**현재 ~ 수 주**: 웹 플레이 유지 · Wave 2 ~ 5 콘텐츠 확장

**3–6개월 (볼륨 차오르면)**: PWA 전환 (manifest.json + service worker, **0.5d · 무료**) + 선택적 APK 사이드로드

**출시 결단 시**:
- **A안. Capacitor 래핑** — 현재 스택 그대로 iOS/Android 앱화 (**2–4d + $124**)
  - Tauri 데스크탑 추가: +0.5–1d, 무료
- **B안. 엔진 재작성 (Unity/Godot)** — 완전 새 프로젝트 (**2–3개월**)
  - 웹 3D로는 정밀한 게임 감각이 부족할 때만 선택
  - walk3d처럼 산책/힐링 장르엔 과한 선택

### 유료 등록 필요 시점 요약

| 배포 방식 | 비용 | 필요 시점 |
|-----------|------|-----------|
| GitHub Pages 웹 | 무료 | 현재 (기본) |
| PWA 설치 | 무료 | 브라우저 "홈 화면 추가"로 해결 |
| Tauri 데스크탑 (.dmg/.exe) | 무료 | 코드사이닝 생략 시 |
| Android APK 사이드로드 | 무료 | 지인 배포용 |
| **iOS App Store 출시** | **$99/년** | 일반 사용자 배포 |
| **Google Play Store 출시** | **$25 일회** | 일반 사용자 배포 |

→ 첫 해 스토어 출시 총비용: **약 $124 (17만원)**, 이후 매년 $99 갱신.

---

## 🔮 향후 의존성 그래프

```
Phase 0–5 (완료)
   │
   ├─▶ Wave 1 ✅ (퀵윈)
   │      └─▶ Wave 1.5 ✅ (모바일 + 랜딩 + 테스트)
   │
   ├─▶ Wave 2 콘텐츠 ─┬─▶ Wave 3 UI/커스터마이즈
   │                   └─▶ Wave 4 대형 시스템 ─▶ Wave 5 폴리싱
   │
   └─▶ 배포: 웹 유지 → (검증 후) PWA → Capacitor / 엔진 포팅
```

---

## 📊 메타 통계

| 지표 | 값 |
|------|-----|
| 총 작업 기간 | 2026-04-17 ~ 진행 중 (약 7일 활성) |
| OMC 파이프라인 사용 | deep-interview · ralplan · ralph · code-reviewer · ai-slop-cleaner |
| 사용 에이전트 타입 | 9종 (planner · architect · critic · executor · designer · code-reviewer · qa-tester · scientist · verifier) |
| 누적 커밋 수 | 40+ (main 기준) |
| 테스트 커버리지 | 90 tests · 10 files · 100% pass |
| 빌드 | TypeScript strict · Vite 6 · 분리된 청크 (app 81KB / three 620KB gzip) |
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

*문서 마지막 업데이트: 2026-04-24 · Wave 1.5 hotfix 2건 + Wave 2 #1 (지역 특산품) 완료*
