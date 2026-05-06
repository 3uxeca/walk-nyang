# Wave 3 #2 — 내 고양이 정보 패널 (HUD 확장)

> 실행 모드: **Level 2** — E1(Level 3 vs Level 2) 비교용 케이스
> 선행: Wave 3 #1 (색상 UI) 완료

## 목표

좌상단 HUD 카드에 (1) 고양이 닉네임 + 편집, (2) 현재 지역 특산품 진행도 `n/3`을
추가해 "특산품 3개로 다음 마을 해제" 정보를 상시 노출한다. 별도 패널을 만들지
않고 기존 `HUD.ts`를 확장.

## 표시 변경

기존 HUD (좌상단)
```
🐾 0 / 20  [████░░]
🌿 풀숲마을 🌹
```

변경 후
```
🐱 산책냥 ✏️
🐾 0 / 20  [████░░]
🌿 풀숲마을 🌹 1/3
```

- row0 (신규): 🐱 + nickname (기본 `"산책냥"`) + ✏️ 편집 아이콘 버튼
- row2: 특산품 이모지 옆에 `currentRegionSpecialtyCount/SPECIALTY_UNLOCK_THRESHOLD` 노출
- 모바일에서도 동일 표시. 편집 아이콘은 터치 가능.

## 데이터

### 새 데이터: nickname

`src/game/SaveSystem.ts`
- `SaveData`에 `nickname?: string` 추가 (선택 필드, 폴백 가능).
- 신규 상수 `DEFAULT_NICKNAME = '산책냥'`.
- 로드 시 `typeof saveData.nickname === 'string'`이면서 트림 후 비어있지 않으면 그 값 사용, 그렇지 않으면 `DEFAULT_NICKNAME`.
- 저장 시 `buildSaveData()`에 `nickname: currentNickname` 포함.

### 특산품 카운트

`src/game/ProgressSystem.ts`의 기존 `getSpecialtyCount(regionId)` 재사용 — 신규 API 불필요.
임계값은 기존 상수 `SPECIALTY_UNLOCK_THRESHOLD`(`ItemTypes.ts`) 그대로 사용.

## 코드 변경

### `src/ui/HUD.ts`
- `row0` 새로 추가 (nickname + ✏️ 버튼). 카드 자체는 `pointer-events: none`이므로 ✏️ 버튼만 `pointer-events: auto`.
- 멤버: `nicknameEl: HTMLSpanElement`, `editBtn: HTMLButtonElement`, `specialtyCountEl: HTMLSpanElement`.
- 생성자에 `onEditNickname?: () => void` 콜백 옵션 추가. ✏️ 클릭 시 호출.
- `update()` 시그니처 확장 (모두 추가 인자):
  - 기존: `(collected, threshold, regionName, regionEmoji?, specialtyEmoji?)`
  - 신규: `(collected, threshold, regionName, regionEmoji?, specialtyEmoji?, nickname, specialtyCount, specialtyThreshold)`
- `specialtyCount/specialtyThreshold`이 모두 유효(>0 threshold, 정수 카운트)할 때만 `n/T` 노출. 특산품이 없는 지역(예: 미정의)이면 빈 문자열로 폴백.
- 닉네임 빈 문자열일 때 `DEFAULT_NICKNAME`로 표시 (방어).

### `src/ui/CatNameModal.ts` (신규)
- 패턴: `CatColorModal.ts` 재사용 (오버레이, ESC/배경 클릭으로 닫기, 입력 차단 통합).
- 컨텐츠: 제목 "고양이 이름", `<input type="text">` (maxlength 12, placeholder=DEFAULT_NICKNAME), 저장/취소 버튼.
- 저장 검증: trim 후 길이 1~12. 그 외엔 저장 비활성 또는 placeholder 폴백 후 닫기.
- API: `open(currentName: string, onSave: (name: string) => void): void` / `close()` / `dispose()`.
- `pointer-events: auto`. 게임 입력 게이트는 `CatColorModal`의 동일 메커니즘으로.

### `src/main.ts`
- 로드 시 `currentNickname` 변수: `saveData?.nickname` 있으면 사용, 아니면 `DEFAULT_NICKNAME`.
- `new HUD({ onEditNickname: () => catNameModal.open(currentNickname, ...) })`.
- 모든 `hud.update(...)` 호출에 `currentNickname`, `progressSystem.getSpecialtyCount(currentRegion.id)`, `SPECIALTY_UNLOCK_THRESHOLD` 추가 (총 4~5곳).
- 닉네임 저장 콜백: `currentNickname = newName; hud.update(...); saveSystem.save(buildSaveData())`.
- `buildSaveData()`에 `nickname: currentNickname` 추가.

### `src/game/SaveSystem.ts`
- 위 데이터 변경 반영.
- `isValidSaveShape`는 nickname을 강제 검사하지 않음(선택 필드, 옛 세이브 호환).

## 테스트

### 신규
- `src/ui/HUD.test.ts` (jsdom):
  - `update()`에 nickname/specialtyCount/threshold를 전달하면 DOM에 정확히 표시되는지.
  - `specialtyCount`가 `undefined`이거나 threshold가 0이면 카운트 비표시.
  - ✏️ 클릭 시 `onEditNickname` 콜백 실행.
- `src/ui/CatNameModal.test.ts` (jsdom):
  - 열림/배경 클릭/ESC로 닫힘.
  - 입력값 trim 후 1~12자 → onSave 호출, 그 외엔 호출 안 함.
  - ✕/취소로 닫으면 onSave 미호출.
- `src/game/SaveSystem.test.ts` (기존):
  - nickname 라운드트립 (저장→로드).
  - nickname 누락 시 로드 정상.
  - 비정상 타입(숫자 등) 무시.

### 회귀
- 기존 131 테스트 통과 (HUD update 시그니처 확장은 추가 인자만이므로 호출자 모두 갱신).

## 위험 / Edge Case

- HUD가 모바일에서 가상조이스틱·액션버튼과 겹치지 않는지: 좌상단 위치는 그대로라 영향 없음.
- `pointer-events: none`인 부모 안의 `pointer-events: auto` 버튼 — 이미 `CatColorButton.ts`에서 검증된 패턴.
- 닉네임 입력 모달이 떠있는 동안 게임 키 입력 게이트: `CatColorModal`과 동일 메커니즘 재사용.
- 특산품이 없는 지역(드물지만 `getRegionInfo(id).specialty == null`)에서 카운트가 비어 보이는지 확인.
- SaveSystem 마이그레이션: nickname이 선택 필드라 마이너 버전업 불필요.

## DoD

- [ ] HUD 카드에 nickname + ✏️ + 특산품 `n/3` 표시.
- [ ] ✏️ 클릭 → 모달 → 저장 시 즉시 HUD 갱신 + 세이브 반영.
- [ ] 새로고침 후 닉네임/카운트 복원.
- [ ] 모바일에서 ✏️ 터치 가능. 게임 입력은 모달 동안 차단.
- [ ] 모든 단위 테스트 통과(131 + 신규).
- [ ] code-reviewer APPROVED (Level 2 1차).
