# Wave 3 #1 — 고양이 색상 커스터마이즈 UI (Spec)

> 작성: 2026-05-05 · 실행 모드: **Level 3 (ralph 자율 루프)** — 주간보고서 E1 실험 케이스
> 비교 대상: Wave 3 #2 또는 #3을 Level 2로 진행해 적발/회귀/토큰 비교

## 목표

플레이어가 고양이의 메인 fur 컬러를 프리셋에서 골라 바꿀 수 있고, 새로고침 후에도 유지된다.

## 범위

- **포함**: 메인 fur 컬러(orangeFur 슬롯) 변경, 프리셋 5–8종, 저장/복원, HUD 진입 버튼, 모달 UI.
- **제외 (별 wave/항목)**: 의상·액세서리(Wave 3 #3), RGB 자유 슬라이더, 무늬 패턴, 반려묘 다중 슬롯.

## 진입점

- HUD 좌측(데스크탑) / 모바일 하단 안전영역 "🎨" 버튼 → 모달 오픈.
- 모달은 ESC, 외부 클릭, 닫기 버튼으로 닫힘.

## 프리셋 후보 (조정 가능)

| 이름 | hex | 비고 |
|---|---|---|
| 오렌지 (기본) | `#ff8c32` | 현재 메인 |
| 화이트 | `#fff5e8` | whiteFur 톤 |
| 코코아 | `#7a4a2a` | |
| 그레이 | `#9aa0a6` | |
| 블랙 | `#272727` | darkFur 톤 |
| 크림 | `#ffe1a8` | |
| 핑크 | `#ffb3c6` | earInner 톤 |
| 민트 | `#a8e6cf` | |

## 저장

- `src/game/SaveSystem.ts` 스키마에 `catColor: string` (hex) 추가.
- 마이그레이션: 기존 세이브에 필드 누락 시 `#ff8c32` 기본 적용 (절대 throw 금지).
- 저장 시점: 색상 변경 즉시 + 기존 자동 저장 트리거에 포함.

## 적용 대상

- `src/character/Character.ts`의 메인 fur 슬롯 `MeshToonMaterial.color`만 변경.
- 머티리얼 **재생성 금지** — 기존 인스턴스의 `.color.set(hex)` 사용 (HMR·메모리 누수 방지).
- public API: `Character.setFurColor(hex: string): void`

## 구현 가이드

1. `src/ui/CatColorModal.ts` 신규 — 프리셋 그리드 + 현재 선택 강조.
2. `Character.ts`에 `setFurColor` 추가 + 메인 fur 머티리얼 노출.
3. `SaveSystem.ts` 스키마 `catColor` 추가 + 마이그레이션 + 단위 테스트.
4. HUD에 🎨 버튼 (HelpButton.ts 패턴 재사용).
5. `main.ts`에서 `modal ↔ Character.setFurColor` + `SaveSystem` 연결.
6. 게임 부팅 시점에 저장된 색상 1회 적용 (LandingScreen → Game 전환 시점).

## 비기능 요구사항

- 모달 오픈 중에는 캐릭터 입력(WASD/조이스틱) 무시 — input gate.
- 모바일 터치로 프리셋 선택 가능 (VirtualJoystick과 z-index/영역 충돌 없게).
- 색상 변경 시 HUD 토스트 "🎨 {이름} 컬러로 변경" 노출 (RegionUnlockFX와 겹침 회피).
- 부팅 시점 색상 적용은 첫 프레임 안에 끝나야 함 (껍질 깜빡임 금지).

## 회귀 위험 지점 (의도적 점검)

- HelpButton/HUD 버튼들과 z-index·터치 영역 충돌
- LandingScreen → Game 전환 시 적용 타이밍 (1프레임 안)
- HMR 시 색상 리셋
- 색상 토스트와 RegionUnlockFX 토스트 동시 발생
- 마이그레이션이 잘못된 hex 값(레거시 저장)에서 throw 안 하는지

## Acceptance

- [ ] 프리셋 클릭 → 즉시 캐릭터 fur 색 변경
- [ ] 새로고침 후 색상 유지
- [ ] localStorage 비우기 → 기본 오렌지 복귀 (throw 없음)
- [ ] 모바일 터치로 모달 조작 OK
- [ ] ESC 키로 모달 닫힘
- [ ] 모달 열린 동안 캐릭터 이동 입력 무시
- [ ] TS strict 통과
- [ ] 기존 99 테스트 그대로 통과 + 단위 테스트 추가 (SaveSystem 마이그레이션 1, setFurColor 1, 모달 close 1)
- [ ] `npm run build` 성공, app 번들 100KB 이하 유지

## 리뷰어 게이트 (ralph 종료 조건)

- ralph 패스 종료 후 `code-reviewer` 호출 → CRITICAL/HIGH 모두 반영될 때까지 루프
- 결함과 fix를 `docs/reviews/wave3-01-cat-color.md`에 기록
- 종료 시 `docs/cost-log.md`에 ralph 토큰 사용량 + 적발 결함 카운트 누적
- 최종 빌드 + 전체 테스트 + 매뉴얼 체크리스트 추가 (MANUAL_TEST.md)
