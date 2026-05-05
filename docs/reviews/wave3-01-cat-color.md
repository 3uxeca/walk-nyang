# Wave 3 #1 — 고양이 색상 커스터마이즈 UI (Review)

> 2026-05-05 · 실행 모드: **Level 3 (ralph 자율 루프)** — 주간보고서 E1 실험 케이스
> spec: [`.omc/plans/wave3-01-cat-color.md`](../../.omc/plans/wave3-01-cat-color.md)

## 결과 요약

| 항목 | 값 |
|------|-----|
| 결과 | ✅ APPROVED (2차 reviewer) |
| ralph 라운드 수 | 7 (PRD 셋업 → 병렬 구현 2 → 모달 → 통합 → 1차 리뷰 → fix → 2차 리뷰 → deslop) |
| 적발 결함 (1차) | CRITICAL 0 / HIGH 3 / MEDIUM 8 / LOW 9 |
| 반영률 | CRITICAL/HIGH **100%** · MEDIUM 3/8 (의도적 스킵 5건) · LOW 0/9 (의도적 스킵) |
| 최종 테스트 | **131 passed** (13 → 14 files), 회귀 0 |
| 빌드 | TS strict 통과, app 89.87 kB / 26.63 kB gzip |
| 변경 파일 | 12 (신규 6 / 수정 6) |

## 1차 reviewer 적발 → 반영 매트릭스

| 등급 | ID | 이슈 | 위치 | 반영 결과 |
|------|----|------|------|-----------|
| HIGH | 1 | CatColorButton bottom-left 좌표가 모바일 VirtualJoystick과 픽셀 충돌 (가드 부재) | `CatColorButton.ts:32`, `main.ts:185` | ✅ 컴포넌트 내부 `isMobileEnvironment()` 자동 분기. `position` 옵션 `@deprecated`. main.ts 호출부에서 인자 제거. |
| HIGH | 2 | `main.ts:194` `{ ...buildSaveData(), catColor: hex }` catColor 이중 적용 | `main.ts:194` | ✅ `saveSystem.save(buildSaveData())`로 단순화. `currentCatColor`가 single source of truth. |
| HIGH | 3 | GLTF 모드에서 `setFurColor` silent no-op (토스트만 뜨고 색 안 변함) | `Character.ts`, `main.ts` | ✅ `Character.supportsFurColor()` 게터 + main.ts에서 가드 블록으로 모달/버튼 생성 자체를 분기. JSDoc에 "Wave 3 #3 의상에서 GLTF 지원 예정" TODO. |
| MEDIUM | 1 | swatch 키보드 활성화 미지원 (a11y) | `CatColorModal.ts:185` | ✅ keydown 핸들러 (Enter/Space → handleSelect, preventDefault). 단위 테스트 2개. |
| MEDIUM | 2 | swatch click backdrop 버블링 (실제 버그는 없으나 detached node 의존) | `CatColorModal.ts:214` | ✅ `e.stopPropagation()` 추가. |
| MEDIUM | 3 | swatch 리스너 explicit removeEventListener 없음 | `CatColorModal.ts:214` | ⏭ 의도적 스킵 — `el.remove()`로 backdrop 통째 제거 후 GC 회수, 누수 없음. |
| MEDIUM | 4 | hex 정규식이 3자리/8자리(alpha) 거부 | `Character.ts` | ⏭ 의도적 스킵 — 현재 프리셋 모두 6자리, 회귀 위험 낮음. |
| MEDIUM | 5 | Toast 시각적 큐잉 없음, RegionUnlockFX와 동시 표시 시 시각 혼잡 | `main.ts:195` | ⏭ 의도적 스킵 — 색상 변경은 사용자 능동 액션, RegionUnlockFX와 동시 발생 확률 낮음. MANUAL_TEST에 검증 항목 추가. |
| MEDIUM | 6 | `currentCatColor` 모듈 전역, 캡슐화 약함 | `main.ts:57` | ⏭ 의도적 스킵 — main.ts 13개 다른 전역과 일관 패턴, spec 범위 외. |
| MEDIUM | 7 | CatColorButton aria-haspopup 미지원 | `CatColorButton.ts` | ✅ `aria-haspopup="dialog"` 추가. 단위 테스트 1개. |
| MEDIUM | 8 | 모달 닫는 순간 손가락 키 떼면 stuck-key 가능성 | `Controller.ts` | ⏭ 의도적 스킵 — input gate가 막아주고, keyup이 정상 반영되어 회귀 없음. |
| LOW | 1~9 | (전부) | 다양 | ⏭ 의도적 스킵 — DRY/스타일 권장, 회귀 가드 약함 등 spec 범위 외. |

## 회귀 위험 5개 점검 결과 (spec 명시)

| # | 위험 지점 | 점검 결과 |
|---|-----------|-----------|
| 1 | z-index / 터치 영역 충돌 | ✅ 컴포넌트 내부 자동 분기로 충돌 가드. backdrop 9600 > Toast 180 > VirtualJoystick 150 > Button 140 > HUD 100. |
| 2 | LandingScreen → Game 전환 시 부팅 색 적용 타이밍 | ✅ `main.ts:163-164` `saveSystem.load()` 직후, `animate()` 호출 전 동기 실행. 첫 프레임 깜빡임 없음. |
| 3 | HMR 시 색상 리셋 | ✅ `import.meta.hot.dispose`에서 modal/button 정리 + `currentCatColor` 기본값 리셋. 새 모듈 로드 시 `getCatColor(saveData)`로 복원. |
| 4 | 색상 토스트 vs RegionUnlockFX 토스트 동시 발생 | ⚠️ 별도 컴포넌트라 동시 표시 가능. 위치 분리(toast top:130 vs RegionUnlockFX 별도)로 시각 충돌 회피. MANUAL_TEST에 검증 항목 추가. |
| 5 | 마이그레이션이 잘못된 hex 값에서 throw 안 하는지 | ✅ `SaveSystem.load`의 catColor 가드(잘못된 타입 시 reset 대신 필드만 제거). 단위 테스트 4 케이스로 커버. |

## 변경 파일

### 신규
- `src/character/Character.test.ts` — setFurColor + supportsFurColor 단위 테스트 3개 (deslop 후)
- `src/character/Controller.inputGate.test.ts` — input gate 단위 테스트 4개
- `src/ui/CatColorModal.ts` — 모달 UI + `CAT_COLOR_PRESETS` 8개
- `src/ui/CatColorModal.test.ts` — 18개 단위 테스트 (`@vitest-environment jsdom`)
- `src/ui/CatColorButton.ts` — HUD 🎨 버튼, 모바일 자동 분기
- `src/ui/CatColorButton.test.ts` — 3개 단위 테스트

### 수정
- `src/character/Character.ts` — `furMat` 필드 보존, `setFurColor`, `supportsFurColor`
- `src/character/Controller.ts` — `setInputEnabled` + `inputEnabled` 게이트
- `src/character/Controller.test.ts` — import 한 줄
- `src/game/SaveSystem.ts` — `catColor?: string`, `DEFAULT_CAT_COLOR`, `getCatColor`
- `src/game/SaveSystem.test.ts` — 4 케이스 추가
- `src/main.ts` — wiring (부팅 색 적용 / 모달·버튼 생성 / onSelect / HMR cleanup / buildSaveData에 catColor)

### 인프라
- `package.json`, `package-lock.json` — `jsdom` devDep 추가 (UI 테스트 환경)

## 의도적으로 도입한 패턴

- **DIP 준수**: `CatColorModal`이 `Character`를 직접 import하지 않고 콜백으로만 통신.
- **단일 인스턴스 머티리얼 보존**: `furMat`을 클래스 필드로 잡아 `.color.set(hex)`로 갱신 (재생성 금지). HMR/메모리 누수 회귀 방지.
- **마이그레이션 안전성**: `catColor` 필드는 optional. 잘못된 타입은 reset 대신 필드만 제거. 4 케이스 단위 테스트.
- **input gate**: `Controller.setInputEnabled(false)` 시 즉시 input 초기화 + 다음 update에서 jump edge buffer까지 소비. 4 단위 테스트.
- **GLTF 모드 가드**: `supportsFurColor()`가 false면 색상 UI 자체 비노출 → 사용자 혼란 차단. 향후 GLTF 지원 시 게터 한 곳만 수정.

## ralph 자율 루프 메타 관찰 (E1 실험 데이터)

| 메트릭 | 값 |
|--------|-----|
| 라운드 수 | 7 |
| executor 호출 | 4 (병렬 2 + 단독 2) |
| code-reviewer 호출 | 2 (1차 opus, 2차 sonnet) |
| ai-slop-cleaner 호출 | 1 (Step 7.5) |
| reviewer 1차 적발 | CRITICAL 0 / HIGH 3 / MEDIUM 8 / LOW 9 |
| 1차 적발 → 종착 사이 fix 라운드 | 1 (한 번에 HIGH 3 + MEDIUM 3 묶음 처리) |
| 사용자 개입 횟수 | 0 (spec 작성 단계 1회 후 ralph 진입) |

**E1 가설 검증**: "콘텐츠성 작업"은 자율 루프로 critical 결함 없이 통과 가능 — **부분 PASS**. CRITICAL 0이지만 HIGH 3 발생, fix 라운드 1회로 해결. Level 2와 비교는 다음 항목(Wave 3 #2 또는 #3)을 Level 2로 진행한 후 정량.

## 다음 단계

- US-W3-02 (정보 패널) 또는 US-W3-04 (수집 히스토리)을 Level 2로 진행 → E1 비교 데이터 확보.
- E3: 토큰 사용량은 `cost-log.md`에 기록.
