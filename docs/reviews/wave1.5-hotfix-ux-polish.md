# Wave 1.5 · Hotfix — UX Polish (사운드 힌트 + 튜토리얼 안내)

**상태**: ✅ 완료 (Level 2 — code-reviewer 1회 + CRITICAL 1 / HIGH 1 / MEDIUM 2 / LOW 2 모두 반영 또는 의도적 스킵 설명)
**날짜**: 2026-04-24
**트리거**: 플레이 피드백 — "소리를 듣고 하는 게임이라는 걸 모르고 뮤트로 플레이" + "게임 목표를 모르고 들어옴"

## 목표

1. 랜딩 화면에서 사운드 켜기를 자연스럽게 권장.
2. 첫 게임 진입 직후 "무슨 게임인지" 5초 정도 안내.
3. 이후에도 언제든 다시 볼 수 있도록 `?` 버튼 상시 제공.
4. 재방문 사용자에겐 토스트가 반복 노출되지 않도록 세이브 플래그 관리.

## 변경 사항

### 신규 파일
- `src/ui/HelpButton.ts` — `?` 원형 버튼. 데스크탑 좌하단, 모바일 우상단(조이스틱 회피). `aria-label` 설정.
- `src/ui/TutorialModal.ts` — 튜토리얼 모달. backdrop 클릭 / ESC / 닫기 버튼 3가지 경로로 닫힘. open/close 멱등, 재사용 가능. `textContent` 기반 DOM 조립으로 XSS 안전.

### 수정 파일
- `src/ui/LandingScreen.ts` — 기본 `hint` 문구를 `🎧 소리를 켜고, 고양이에게 귀 기울여봐요`로 교체.
- `src/ui/Toast.ts`
  - `show()`에 `displayMs` 파라미터 + `opts.wrap` 옵션 추가. 튜토리얼 토스트는 5500ms + wrap true.
  - **XSS 수정**: `innerHTML` 조립을 `createElement` + `textContent` 조립으로 교체. 현재 호출처는 모두 하드코딩이지만 공개 API라 방어적으로 정리 (code-reviewer CRITICAL).
  - 새 CSS 클래스 `.w3d-toast-wrap` — 좁은 뷰포트에서 긴 튜토리얼 메시지 자동 줄바꿈.
- `src/ui/RegionUnlockFX.ts` — 같은 `innerHTML` 패턴을 `textContent` 기반으로 교체 (동일 CRITICAL 리뷰 맥락).
- `src/game/SaveSystem.ts` — `SaveData.tutorialSeen?: boolean` 추가 (옵션 필드). `isValidSaveShape`는 그대로 → 필드 없는 예전 세이브도 정상 로드.
- `src/game/SaveSystem.test.ts` — 2개 테스트 추가: `tutorialSeen` round-trip + 필드 없는 legacy 세이브 로드.
- `src/main.ts`
  - `hint` 전달값 교체.
  - `TUTORIAL_MESSAGE` / `TUTORIAL_EMOJI` 상수 (토스트·모달 공용). 초기엔 분리했다가 최종적으로 동일 본문이 자연스럽다는 결론으로 재병합. pre-line 렌더로 `\n\n`이 빈 줄 섹션 구분 역할.
  - `tutorialSeen` 추적 변수 + `buildSaveData()`에 필드 포함.
  - `toast = new Toast()` 직후 `TutorialModal` + `HelpButton` 생성. 모바일이면 `top-right`, 아니면 `bottom-left`.
  - `!tutorialSeen`이면 700ms 지연 후 토스트 표시. **save는 토스트가 뜬 뒤 실행** — 700ms 안에 탭이 닫히면 다음 세션에서 다시 노출.
  - `tutorialTimerId` 모듈 변수 + HMR dispose에서 `clearTimeout` 호출 (setTimeout 누수 방지).

### 문서
- `docs/MANUAL_TEST.md` — 섹션 1 힌트 문구 갱신, 섹션 1-b 튜토리얼 신설 (10개 체크 항목), 회귀 트리거 파일 목록에 `Toast/HelpButton/TutorialModal/SaveSystem` 추가.

## Level 2 리뷰 결과

### code-reviewer 1차 — REQUEST CHANGES → 재검증 후 APPROVE

| 등급 | 이슈 | 조치 |
|------|------|------|
| 🔴 CRITICAL | `Toast.show()` `innerHTML` 조립 → 향후 동적 컨텐츠 XSS | ✅ `textContent` + `createElement`로 재작성. `RegionUnlockFX`의 동일 패턴도 같이 수정 |
| 🟠 HIGH | 튜토리얼 `setTimeout(700)` 핸들 미보관 → HMR 재-init 시 타이머 누수 | ✅ `tutorialTimerId` 모듈 변수 도입, dispose에서 `clearTimeout` |
| 🟡 MED | save-before-show 순서 — 700ms 안에 탭 닫히면 튜토리얼 못 봄 | ✅ save를 `setTimeout` 콜백 안으로 이동. `?` 버튼이 있어 차선책 있지만 여전히 이 순서가 더 관대 |
| 🟡 MED | 토스트 `nowrap`이 긴 튜토리얼 메시지를 좁은 뷰포트에서 자름 | ✅ `.w3d-toast-wrap` 클래스 + `opts.wrap: true` 옵션 |
| 🟢 LOW | 모달 스타일 eager inject — 모달을 한 번도 안 열면 낭비 | 스킵. HelpButton/Toast 등 기존 패턴이 모두 eager. 전반적 리팩토 전까지 일관성 유지 |
| 🟢 LOW | HelpButton + TutorialModal 파일 분리 | 스킵. 현재 구조가 SRP 정답이라는 리뷰어 결론 동의 |

**재검증**: 79/79 테스트, 빌드 깨끗. pre-push hook 재실행해서 회귀 없음 확인 예정.

## 의도적으로 *안* 한 것

- **`tutorialSeen`의 schema version bump**: 옵션 필드라 validator 통과. 예전 세이브 호환성을 깨지 않음.
- **튜토리얼 모달 자동 노출**: 첫 진입은 토스트(비방해), 모달은 사용자 요청(`?`) 시에만. 힐링 톤 보호.
- **모달 포커스 트랩 / 라이브 리전**: 접근성 향상 여지 있지만 Wave 1.5 스코프 초과. 후속 폴리싱 후보.
- **keyboard 등장 테스트 자동화**: `KeyboardInputSource`/`HelpButton`/`TutorialModal`은 DOM·window 이벤트 의존. Phase 4에서 세운 "DOM 테스트는 manual 체크리스트" 정책 유지.

## Acceptance Criteria

- [x] 랜딩 힌트가 사운드 권장 문구로 교체
- [x] 최초 플레이에서 튜토리얼 토스트 1회 노출, 이후 미노출
- [x] `?` 버튼이 데스크탑/모바일 각각 충돌 없는 위치에 상주
- [x] 모달 닫기 경로 3종(backdrop, ESC, 닫기 버튼) 모두 동작
- [x] 예전 세이브(필드 없음) 그대로 로드
- [x] Toast·RegionUnlockFX의 `innerHTML` XSS 벡터 제거
- [x] HMR 재-init 시 타이머 누수 없음
- [x] code-reviewer CRITICAL + HIGH + MEDIUM 모두 반영
- [x] 79/79 테스트 통과, 빌드 깨끗

## 회귀 트리거 파일

이 변경은 다음 파일을 수정할 때마다 MANUAL_TEST 섹션 1·1-b 재검증:
- `src/ui/LandingScreen.ts`, `src/ui/Toast.ts`, `src/ui/HelpButton.ts`, `src/ui/TutorialModal.ts`, `src/ui/RegionUnlockFX.ts`
- `src/main.ts` init/dispose 블록
- `src/game/SaveSystem.ts` 스키마 변경
