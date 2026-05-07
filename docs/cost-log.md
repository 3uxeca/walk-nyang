# 💰 토큰 비용 로그 (E3)

> 주간보고서 E3 실험 — Level 1/2/3 단가 차이를 정량화하기 위해 매일 `/cost` 출력을 누적한다.
> 작성 시작: 2026-05-05

## 기록 방법

1. Claude Code에서 `/cost` 입력 → 출력값 캡쳐
2. 아래 표 한 줄로 누적
3. 가능하면 그날의 주된 워크플로우(Level 1/2/3, 작업 항목)를 **메모** 칸에 기재

## 일별 로그

| 날짜 | session $ | 일 누적 $ | 입력 토큰 | 출력 토큰 | cache read | 주된 작업 / Level | 메모 |
|------|-----------|-----------|-----------|-----------|------------|-------------------|------|
| 2026-05-05 | _baseline_ | _baseline_ | — | — | — | E1·E3 부트스트랩 | `/usage` dismiss로 수치 미캡쳐 — ralph 종료 후 차이로 추정 예정 |
| 2026-05-05 | ralph 1세션 | — | — | — | — | **Level 3 / ralph** — Wave 3 #1 색상 UI | 7 라운드, executor 4 / reviewer 2 (opus+sonnet) / cleaner 1. 자세한 사용량은 사용자가 `/cost`로 캡쳐 시 갱신 |
| 2026-05-06 ~ 07 | Level 2 1세션 | — | — | — | — | **Level 2** — Wave 3 #2 정보 패널 + 게이트 캡 + playtest 후속 튜닝 | executor 2 (1차+fix) / reviewer 2 (1차 NEEDS FIX → 2차 APPROVED). reviewer 1차 적발 CRITICAL 1 + MEDIUM 1. playtest 후속 7커밋 (게이트 region 진화 4단계 포함). 최종 177 tests passed |

## 워크플로우별 누적 (주차 마감 시 채움)

| 워크플로우 | 작업 건수 | 누적 토큰 | 적발 결함 (CRITICAL/HIGH) | 회귀 발생 | per-feature 평균 |
|-----------|-----------|-----------|---------------------------|-----------|------------------|
| Level 1 (직접 실행) | — | — | — | — | — |
| Level 2 (writer + reviewer) | 1 (Wave 3 #2) | _측정 보류_ | CRITICAL 1 / HIGH 0 (1차 reviewer) | 3 (playtest 후속 게이트 진화 — 본 spec 외) | _측정 보류_ |
| Level 3 (ralph 자율 루프) | 1 (Wave 3 #1) | _ralph 종료 후 측정 보류_ | CRITICAL 0 / HIGH 3 (1차 reviewer) | 0 (회귀 없음, 131 passed) | _측정 보류_ |

## 주차 결산

> 매주 금요일 저녁에 한 줄씩.

- W18 (2026-05-04 ~ 05-10): _작성 예정_
