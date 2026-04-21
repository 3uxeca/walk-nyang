# 에이전트 실행 통계 — walk3d 전 과정

> `.omc/` 산출물, 체크포인트, 커밋 메타데이터를 기반으로 재구성한 멀티에이전트 실행 통계.
> 정확한 스폰 타임스탬프는 `subagent-tracking.json`이 세션 재시작으로 리셋되어 소실됐으나, PRD/Plan/체크포인트/커밋이 남아 있어 역추적 가능.

---

## 📊 전체 요약

| 지표 | 값 |
|------|-----|
| 총 개발 기간 | 2026-04-17 ~ 2026-04-21 (5일, 활성 3일) |
| OMC 모드 사용 | `deep-interview` · `ralplan` · `ralph` |
| 사용된 에이전트 타입 | **9종** (planner · architect · critic · executor · designer · code-reviewer · qa-tester · scientist · verifier) |
| Ralph PRD 스토리 | 12개 (US-001 ~ US-012) |
| Total acceptance criteria | **84개** (평균 7/story) |
| 체크포인트 | **7개** (자동 저장) |
| 합의 리뷰 피드백 | CRITICAL 5 + MAJOR 3 (8건) |
| 최종 커밋 | 10개 (main 브랜치) |

---

## 🎭 에이전트별 역할 · 호출 빈도

### RALPLAN 단계 (Phase 0 — 계획 수립)

| 에이전트 | 호출 | 모델 | 역할 |
|----------|------|------|------|
| `planner` | 1회 + 재작성 N회 | opus | 12 스토리 분해, acceptance criteria 작성 |
| `architect` | 1회 + 반복 | opus | 아키텍처 검토, steelman 반대, tradeoff |
| `critic` | 1회 + 반복 | opus | 원칙/옵션/리스크/검증 일관성 검증 |

**결과**: CRITICAL 5 + MAJOR 3 피드백 → Planner 재작성 → Critic 승인 (RALPLAN-DR Consensus SHORT 모드).

### Ralph 실행 단계 (Phase 1 — 구현)

계획 파일에 명시된 Phase별 에이전트 배정:

| Phase | Story | 주 에이전트 | 부 에이전트 | 모델 |
|-------|-------|------------|------------|------|
| 1 — 초기화+테스트 | US-001 | `executor` | — | sonnet |
| 2 — 캐릭터 | US-002 | `executor` | `designer` (비주얼 게이트) | opus |
| 3a — 청크 기초 | US-003 | `executor` | — | opus |
| 3b — 콘텐츠+도로 | US-004 | `executor` | — | opus |
| 3c — 최적화+Worker+폴백 | US-005 | `executor` | — | opus |
| 3d-1 — Generator+Item | US-006 | `executor` | — | opus |
| 3d-2 — Progress+Region | US-007 | `executor` | — | opus |
| 3d-3 — Manager 연계 | US-008 | `executor` | — | opus |
| 3e — Save+HUD+FX | US-009 | `executor` | `designer` (FX 게이트) | opus |
| 4 — 비주얼 폴리싱 | US-010 | `executor` | `designer` | sonnet |
| 5 — 리뷰/QA | US-011 | `code-reviewer` | `qa-tester` | opus/sonnet |
| 6 — 평가 | US-012 | `scientist` | `verifier` | opus/sonnet |

**에이전트 스폰 횟수 집계** (기본 스폰; 재시도는 포함하지 않음)

| 에이전트 | 스폰 횟수 | 주 모델 |
|----------|-----------|---------|
| `executor` | **10** (opus 8 + sonnet 2) | opus 우세 |
| `designer` | **3** (비주얼/FX 게이트) | — |
| `planner` | **1+** (재작성 포함) | opus |
| `architect` | **2+** (consensus loop) | opus |
| `critic` | **2+** (consensus loop) | opus |
| `code-reviewer` | **1** (Phase 5) | opus |
| `qa-tester` | **1** (Phase 5) | sonnet |
| `scientist` | **1** (Phase 6) | opus |
| `verifier` | **1** (Phase 6) | sonnet |
| **합계** | **≥ 22 에이전트 스폰** | — |

> Ralph의 `team-verify` / `team-fix` 루프는 각 스토리 실패 시 추가 실행되므로 실제 호출은 더 많을 수 있음.

---

## 🧩 모델 티어 분포

### Ralph 구현 단계

```
opus tier      ████████████████░░  80%  (8 phases)
sonnet tier    ████░░░░░░░░░░░░░░  20%  (2 phases, Phase 1/4)
```

- **Opus**: 복잡한 아키텍처 결정(Phase 2–3e), 자율 작업 필요한 큰 태스크
- **Sonnet**: 표준 작업(Phase 1 설정, Phase 4 폴리싱)
- **Haiku**: 직접 구현에는 미사용(탐색/룩업에는 내부적으로 사용 가능성)

### Phase 2 (버그 수정 · 문서화 단계, 2026-04-20 ~ 04-21)

| 세션 | 모델 | 커밋 수 |
|------|------|---------|
| 초기 버그 수정 세션 | Claude Sonnet 4.6 | 5 |
| 후반 수정 + 문서 세션 | Claude Opus 4.7 (1M context) | 4 |
| 합계 | 2 모델 | **10 커밋** |

---

## ⏱ 타임라인 (체크포인트 기반)

Ralph는 iteration 경계마다 자동 체크포인트를 저장. 실제 저장된 체크포인트 7개:

| 체크포인트 | 시각 (로컬) | 대략적 단계 |
|-----------|------------|------------|
| 2026-04-17 02:27 | 11:27 KST | RALPLAN 계획 확정 직후 |
| 2026-04-17 03:43 | 12:43 KST | Phase 1 초기화 완료 |
| 2026-04-20 04:19 | 13:19 KST | Phase 3 후반 (재개) |
| 2026-04-20 05:26 | 14:26 KST | Phase 4 폴리싱 시작 |
| 2026-04-20 06:53 | 15:53 KST | v1 버그 1차 수정 |
| 2026-04-20 08:08 | 17:08 KST | v2 비주얼 폴리싱 |
| 2026-04-20 09:00 | 18:00 KST | Z-fighting 해결 직후 |

**관찰**
- 2026-04-17: 하루 안에 계획 수립 → Phase 1 완료
- 2026-04-18 ~ 19: 비활성 (주말 가설 또는 다른 작업)
- 2026-04-20: 집중 세션 (약 5시간, 5 체크포인트)
- 2026-04-21: 수동 디버깅 + 문서화 (Opus 4.7)

---

## 🔁 Ralph 반복 루프

Ralph의 `team-exec → team-verify → team-fix` 루프 증거:

| 메커니즘 | 증거 |
|----------|------|
| 스토리별 acceptance criteria 검증 | 84 criteria, 전부 pass 체크 |
| 실패 시 재시도 | Plan에 "CRITICAL 5 + MAJOR 3 피드백 반영 패치" 기록 |
| deslop 자동 적용 | 커밋 메시지에 "ai-slop-cleaner" 태그 없음 → skill 호출만 |
| 최종 Architect 검증 | `.omc/plans/` 최종 수정 `(Architect + Critic 피드백 반영 패치)` |

**verify/fix 카운트 추정**
- 12 스토리 × 평균 1회 재시도 ≈ **15–20 번의 verify 패스**
- 체크포인트 7개는 메이저 통과 지점만 기록 → 중간 루프 다수

---

## ✍️ Writer / Reviewer 분리 준수

OMC의 "자기 승인 금지" 원칙에 따라 **작성자와 리뷰어가 분리된 에이전트**:

```
  ┌──────────────┐           ┌──────────────┐
  │  executor    │  ──write──▶│ verifier     │
  │  (opus/sonnet)│           │ code-reviewer│
  └──────────────┘           │ qa-tester    │
                              └──────────────┘
                                  │
                                  ▼
                       acceptance criteria 검증
```

구체적 적용:
- Phase 1–4 Writer: `executor` / `designer`
- Phase 5 Reviewer: `code-reviewer` + `qa-tester` (별도 에이전트)
- Phase 6 최종 평가: `scientist` + `verifier` (또 별도)

---

## 🧠 사용 컨텍스트 양 (추정)

PRD + Plan 파일 크기로 산출:
- `prd.json` 9,546 bytes ≈ 2.4k tokens
- `walk3d-village-game.md` 크기 파싱 안 된 상태이지만 실무적으로 8–15k tokens 추정
- 각 executor 호출 시 관련 파일 읽기 + 출력 약 5–20k tokens

**총 토큰 소비 추정**: RALPLAN + Ralph 12 스토리 = 대략 **200–400k tokens** 범위 (1M context opus의 20–40%)

---

## 🎯 효율성 포인트

### 성공 요인
- **RALPLAN consensus가 초기에 아키텍처를 단단히 고정** → Ralph 실행 시 재작업 최소화
- **acceptance criteria 평균 7개/story** → "실제 동작하는 기능"까지 확인
- **Writer/Reviewer 분리** → 자기 승인 방지
- **체크포인트 기반 재개** → 세션이 끊겨도 손실 없음

### 개선할 점
- Phase 5 `code-reviewer`/`qa-tester`가 발견했어야 할 문제가 Phase 2로 넘어가서 수동 리포트 (Z-fighting 2회 재발, 머티리얼 공유 전염)
- GLTF 에셋 검증 단계가 없어 벤치/가로등/나무 스케일 이슈가 QA 후 발견됨
- 스크린샷/비디오 기반 `visual-verdict` 스킬을 Phase 5에 통합했다면 조기 발견 가능했을 것

---

## 🔍 데이터 출처

| 데이터 | 파일 |
|--------|------|
| 스토리·criteria | `.omc/prd.json` |
| 에이전트 배정 | `.omc/plans/walk3d-village-game.md` |
| 체크포인트 타임라인 | `.omc/state/checkpoints/` (런타임 제외) |
| 모델 co-author | `git log --format="%b"` → Co-Authored-By |
| Deep Interview 결과 | `.omc/specs/deep-interview-walk3d.md` |
| Ralph progress | `.omc/progress.txt` |

---

*본 통계는 2026-04-21 기준 세션 재시작 이후 남아있는 자료에서 재구성됐으며,
정확한 개별 에이전트 호출 타임스탬프와 토큰 사용량은 보존되지 않아 추정치를 포함합니다.*
