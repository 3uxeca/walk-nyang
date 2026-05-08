# Wave 3 메타 회고 — HITL 지배 패턴 분석

> 2026-05-08 작성 · 작성자: Dasha · 분석 대상: Wave 3 #1·#2 진행 (2026-05-04 ~ 05-08)
>
> Q. 멀티 에이전트(autopilot/ralph/team)를 거의 안 쓰고 HITL(Human-in-the-Loop)로 수렴한 이유는?

## 한 줄 결론

HITL은 부정적 기본값이 아니라, walk3d가 현재 머물러 있는 **discovery phase의 적정 도구**다. 멀티 에이전트는 "가설이 한 번 얼면" 활성화되는 도구지만, walk3d Wave 3은 가설 자체가 플레이로 발견되는 단계였다. 다만 의식적 선택이라기보단 환경에 떠밀린 면이 있어, 다음 phase 트리거를 명문화해 둘 필요가 있다.

---

## 1. 구조적 원인 (왜 HITL로 수렴했나)

### (a) 스펙이 플레이로 발견됨
Wave 3 #2의 9커밋 중 **6건이 playtest 피드백 후속**:
- `6a9c952` 특산품 weight 0 — 일반 게이지 분리
- `4bec292` 게이지 캡 + 토스트
- `267f6fe` 잠긴 지역 토스트 특산품 힌트
- `53c0ad2` 기본 색상 블랙
- `f9fb497` 캡 도달 시 일반 아이템 제거
- `55ad6d0` → `4082aa3` → `f6b9ccc` 게이트 region 진화 3단계

이 결정들은 spec에 없었다. **"특산품을 일반 게이지에서 빼면 어때?", "40/40에서 멈춰야 하는 거 아닌가?", "뒷마을 가니 풀려요"** — 사용자가 게임을 직접 해봐야만 떠오르는 디자인 판단이었다. 사전 spec freeze가 본질적으로 불가능.

### (b) 검증이 시각·감각 기반
빗살무늬 디버깅이 대표적: 시뮬레이션 PNG 4종을 만들어 놓고도 결국 **"둘 다 이상해, classic이 맞는 것 같아"**가 결정 신호였다. 에이전트는 cat fur가 어떻게 보이는지, 게이지 캡이 자연스러운지 못 본다.

자동화하려면:
- Headless browser (Playwright/Puppeteer)
- 시각 회귀 (visual diff)
- 게임플레이 시뮬레이터 또는 LLM 플레이어

→ 현재 인프라엔 없음.

### (c) 변경 단위가 너무 작음
- "FUR_LOW을 10으로" — 1줄
- "기본색 블랙으로" — 1줄
- "FUR_HIGH=230 시도" — 1줄

이런 단위에 ralph 7라운드를 돌리면 ROI 음수. 에이전트 오버헤드 > 작업 시간.

### (d) Sequential 의존성
한 fix가 다음 이슈를 노출:
1. "캡 추가" → 플레이
2. "뒷마을 가니 풀려요" → 게이트 region 추가
3. 플레이 → "specialty 2/3에서 미리 풀려요" → recompute timing 수정
4. 플레이 → "뒷마을 복귀 회귀" → 게이트 region을 "최상위 unlocked"로

이걸 미리 다 알 수 없으므로 병렬화 불가능 → 멀티 에이전트의 핵심 이점(병렬 실행) 소멸.

### (e) 1인 개발자 + 단일 사이드 프로젝트
PR 리뷰어 없음, QA 팀 없음, 디자이너 없음. **사용자가 PM·QA·디자이너·플레이어 4역할을 동시에 수행**. 그 4역할이 곧 "loop의 H".

---

## 2. 멀티 에이전트가 실제 작동한 지점

| 단계 | 어떻게 적용됐나 | 효과 |
|------|----------------|------|
| Wave 3 #1 (색상 UI) | **Level 3 ralph 자율 루프 7라운드** | spec이 Phase 0 deep-interview로 미리 얼어있어 작동. CRITICAL 0 |
| Wave 3 #2 1차 구현 | **Level 2 (executor → code-reviewer)** | **CRITICAL 1건**(모달 닫기 시 입력 영구 잠김)을 reviewer가 catch. 작성자 주체에선 못 잡았을 통합 결함 |

### 핵심 관찰
- Wave 3 #1은 디자인 자유도가 낮고(`8 프리셋, 모달, 입력 차단`처럼 명확) ralph가 잘 돌았다.
- Wave 3 #2도 **1차 구현은 Level 2가 가치 있었다** (`setInputEnabled` 누수 catch).
- 그 이후 playtest 후속 7커밋은 **사실상 Level 1**이었고, 이게 본 회고의 핵심 패턴.

---

## 3. 진단

### 본질적 진단
**HITL은 부정적 기본값이 아니라 "discovery 단계의 적정 도구"다.** walk3d는 지금 디자인 가설 검증 phase고, 이 단계의 정보 흐름은 본질적으로:

```
사용자 플레이 → 가설 발견 → 코드 변경 → 사용자 재플레이 → 가설 재발견
```

짧은 루프다. 멀티 에이전트는 가설이 한 번 얼면 — 즉 "Wave N의 user story X개를 spec대로 구현"으로 정의되는 phase에서 — ralph/team으로 치환된다.

### 본 패턴이 비효율인가?
**아니다.** 디자인 가설 검증을 멀티 에이전트로 시뮬레이션하려면:
1. Playable specification language
2. AI playtester (LLM 플레이어)
3. UX feel을 정량화하는 지표

세 가지 중 어느 하나도 현 walk3d에 없다. HITL이 가장 빠르고 정확하다.

### 다만 두 가지 누수
1. **Playtest 회귀를 review 문서·spec에 사후 흡수만 함**.
   다음 spec 작성 시 같은 시나리오를 미리 명세하지 않으면 Wave 3 #3에서 같은 패턴 반복.
2. **시각/플레이 검증 자동화 부재**.
   Playwright MCP 같은 도구로 "게이지가 캡되는지", "토스트가 떴는지" 정도는 헤드리스로 검증 가능. 시도해볼 가치.

---

## 4. 다음 phase 트리거 (멀티 에이전트로 부드럽게 넘어가는 조건)

| 트리거 | 진입 가능 워크플로우 |
|--------|---------------------|
| Wave 4 (대형 시스템) 진입 — 신규 시스템은 spec freeze 강제 | Level 3 ralph 적합 |
| Playwright MCP 도입 — 헤드리스 시각 + 게임플레이 검증 일부 자동화 | Level 2 reviewer 단계에 visual diff 통합 |
| 새 user story 패키지 (예: 의상 5종 일괄 구현) | team 워크플로우 명확 |
| "User-Trigger Event Library" — 매번 발견되는 playtest 이슈를 시나리오 카탈로그로 누적 | spec에 "사전 회귀 시나리오"로 주입 가능 |

---

## 5. 메타 — 이 회고를 명문화하는 이유

지금까지의 HITL은 "할 수 없어서가 아니라 이 단계에선 그게 최적이라서"라는 걸 사용자도 에이전트도 명시적으로 의식하지 않은 채 떠밀려 왔다. 그러면:

- 다음 phase에서 멀티 에이전트가 적합한 시점에도 같은 관성으로 HITL을 계속하거나
- 반대로 너무 일찍 ralph를 시도해 spec freeze 안 된 상태에서 발산하거나

둘 중 하나의 실수를 할 가능성이 있다. **본 회고의 가치는 "현 패턴을 의식적 선택으로 변환하는 것"**.

---

## 6. 행동 항목

- [ ] Wave 3 #3·#4 spec 작성 시 "사전 회귀 시나리오" 섹션 신설 — playtest로 발견됐던 패턴을 미리 spec에 주입
- [ ] Playwright MCP 도입 검토 — Level 2 reviewer 단계에 시각/플레이 검증 통합 가능성 PoC
- [ ] Wave 4 진입 시점에 본 회고 재독 — phase 트리거 충족 여부 확인
- [ ] 본 회고 결과를 `docs/AGENT_STATS.md`에도 한 줄 추가 (HITL phase 명시)

---

📎 *참고: `docs/reviews/wave3-01-cat-color.md` · `docs/reviews/wave3-02-info-panel.md` · `docs/AGENT_STATS.md` · git log f33a511 ~ e95dfef*
