# 모바일 실기 테스트 체크리스트

> 자동 테스트로 잡기 어려운 모바일 인터랙션을 사람 눈/손으로 검증하기 위한 체크리스트.
> 새 모바일/UX 기능을 머지하기 전, 또는 GitHub Pages 배포 후 1회 확인.

## 검증 환경

| 카테고리 | 권장 |
|---------|------|
| iOS | Safari (실기 또는 Xcode 시뮬레이터) |
| Android | Chrome (실기 또는 Android Studio 에뮬레이터) |
| 데스크탑 | Chrome DevTools "Toggle device toolbar" → iPhone 12 Pro / Pixel 5 / iPad |
| URL | https://3uxeca.github.io/walk-nyang/ |

## 데스크탑 빠른 모바일 시뮬레이션

```
Chrome → F12 → Cmd+Shift+M → 디바이스 프리셋 선택
```

`Toggle device toolbar`에서 직접 디바이스를 선택하면 자동으로 `pointer: coarse` 매칭되어 모바일 UI 활성화. viewport도 모바일 폭이라 `isMobileEnvironment()` 두 조건 모두 true.

---

## 체크리스트

### 1. 랜딩 화면

- [ ] 로딩 스피너 사라진 후 풀스크린 랜딩 표시
- [ ] 로고 이미지 정상 로드 (로드 실패 시 🐈 이모지 폴백 확인)
- [ ] 타이틀 "산책냥"이 Jua 폰트로 표시 (네트워크 느릴 때 시스템 sans-serif 폴백 확인)
- [ ] 힌트 문구가 `🎧 소리를 켜고, 고양이에게 귀 기울여봐요`로 표시
- [ ] 버튼이 펄스 애니메이션
- [ ] 가로 모바일(landscape)에서 모든 요소가 화면 안에 들어옴 (overflow 시 스크롤 가능)
- [ ] START 탭 → 0.45s 페이드아웃 → 게임 시작
- [ ] START 더블 탭해도 게임이 한 번만 시작됨

### 1-b. 튜토리얼 안내 (신규)

- [ ] **첫 플레이**: START 이후 약 0.7초 뒤 상단 중앙 토스트 표시 — 모달과 **동일한 본문**:
  - `🐈` (상단 큰 이모지, block)
  - `산책냥과 함께 마을을 산책하면서 아이템을 모으고,`
  - `새로운 지역을 열어보세요✨`
  - (빈 줄)
  - `💡 DASH를 하면 달릴 수 있어요🐾`
- [ ] 토스트 wrap 모드 — 상하 여유 패딩(18px), 이모지 32px block, `\n` 실제 줄바꿈 (pre-line)
- [ ] `?` 모달 본문이 토스트와 글자·구조까지 완전 일치
- [ ] 토스트는 약 5.5초 후 자동 fade-out
- [ ] 좁은 뷰포트(320px)에서도 토스트 내용이 잘리지 않고 자동 줄바꿈됨
- [ ] 같은 브라우저에서 새로고침하면 토스트 다시 안 뜸 (`tutorialSeen` 세이브 플래그)
- [ ] `?` 버튼 위치 — 데스크탑: 좌하단 / 모바일: 우상단 (조이스틱과 겹치지 않음)
- [ ] `?` 탭 → 센터 모달 표시 (같은 안내 문구 + 🐈 이모지 + `알겠어요` 버튼)
- [ ] 모달 닫기 경로 3가지 모두 작동: 닫기 버튼 · backdrop 클릭 · ESC 키
- [ ] 모달 여러 번 열고 닫아도 스타일/리스너 누적 없음
- [ ] 세이브 파일이 없는 시크릿/새 브라우저에서 다시 토스트 노출되는지 확인

### 2. UI 자동 전환

- [ ] 모바일 환경에서: ControlsHUD(WASD 키가이드) **표시 안 됨**
- [ ] 모바일 환경에서: 좌하단 가상 조이스틱 + 우하단 JUMP/DASH 버튼 표시
- [ ] 데스크탑(`pointer: fine` + viewport ≥ 820px)에서: ControlsHUD 표시 + 조이스틱/버튼 **표시 안 됨**

### 3. 가상 조이스틱

- [ ] 베이스 위 어디든 터치 시작 → knob이 따라옴
- [ ] 베이스 밖으로 손가락 이동해도 knob 추적 유지 (pointerleave에 reset 안 됨)
- [ ] 손가락 떼면 knob 중앙 복귀, 캐릭터 정지
- [ ] 살짝 건드린 정도(threshold 0.3 미만)는 캐릭터 안 움직임
- [ ] 대각선 입력 시 두 축 모두 반응
- [ ] 조이스틱 드래그 중 다른 손가락으로 JUMP 탭해도 둘 다 작동 (멀티터치)

### 4. JUMP 버튼

- [ ] 한 번 탭하면 한 번 점프
- [ ] 누르고 있어도 점프는 한 번만 (홀드해도 반복 안 됨)
- [ ] 탭할 때 시각적 피드백 (active 색상)

### 5. DASH 버튼 (토글)

> Wave 1.5 Hotfix에서 holder→toggle로 변경. 모바일/데스크탑 공통.

- [ ] 한 번 탭 → DASH ON (버튼 오렌지색 유지). 다시 탭 → OFF (원래 색 복귀)
- [ ] DASH ON 상태에서 조이스틱만 조작해도 계속 빠르게 이동 (조이스틱+DASH 동시 유지 불필요)
- [ ] DASH ON 상태에서 JUMP 탭 → 일반 점프보다 더 높이 (Wave 1 #5)
- [ ] DASH ON 중 카메라 FOV 확장 + 먼지 트레일 발생 (Wave 1 #4)
- [ ] DASH ON 상태에서 멈춰 있으면 트레일/FOV 효과 없음 (이동 시에만 dash 적용 — 의도된 동작)
- [ ] 데스크탑: Shift 한 번 누르면 ON, 다시 누르면 OFF. OS 키리피트(길게 누름) 중에는 추가 토글 없음
- [ ] 데스크탑: DASH ON 상태에서 alt-tab 후 돌아오면 dash가 OFF로 자동 초기화 (blur 시 안전 해제)
- [ ] ControlsHUD의 Shift 키 하이라이트가 DASH ON 상태 동안 유지

### 6. 카메라

- [ ] 평소 카메라 시점이 약간 멀리/위에서 내려다보기
- [ ] 5초 가만히 있으면 카메라가 서서히 가까이 줌인 (Wave 1 #3)
- [ ] 다시 움직이면 멀리 줌아웃

### 7. 토스트

- [ ] 잠긴 지역 경계 닿으면 상단 중앙 "🔒 아직 잠겨있는 지역이에요" 토스트
- [ ] 빠르게 이동(대시 + 조이스틱) 시 미로딩 청크에 진입하면 "⏳ 지역을 불러오는 중이에요" 토스트
- [ ] 토스트가 같은 위치에서 연속으로 스팸되지 않음 (쓰로틀)

### 8. 사운드

- [ ] START 클릭 후 첫 발걸음에서 발걸음 소리 (iOS Safari 자동재생 정책 통과 확인)
- [ ] 5초 idle 시 그르렁 소리 + 하트 파티클
- [ ] 아이템 수집 시 야옹

### 9. 성능

- [ ] 60fps 유지 (모바일 Safari/Chrome devtools Performance 탭)
- [ ] 청크 로드 시 짧은 끊김 허용 (이상적으론 worker로 안 끊겨야 함)
- [ ] 멀리 이동했다 돌아왔을 때 메모리 누수 없음 (DevTools Memory 스냅샷)

### 10. 회전 / 리사이즈

- [ ] 세로 ↔ 가로 회전 시 캔버스 비율 정상 (resize 핸들러)
- [ ] 회전해도 좌하단 조이스틱 / 우하단 버튼 위치 유지
- [ ] 단, mobile UI 모드는 init 시점 결정 (one-shot) — 폭이 820px 넘는 가로로 회전해도 데스크탑 UI로 바뀌지 않음 (알려진 한계)

---

## 알려진 한계

- `isMobileEnvironment()`는 init 시점에 한 번만 평가 — 런타임 리사이즈 무시
- 로고 이미지 1회만 시도 — 네트워크 일시 단절 후 재시도 없음 (`onerror`로 이모지 폴백만)
- DASH 토글 상태는 모바일에서 페이지 재진입(스크린락 해제 등) 후에도 유지됨. 시각 피드백(버튼 오렌지)으로는 상태 확인 가능 — 원치 않으면 한 번 더 탭해 OFF. (데스크탑은 blur 시 자동 OFF)

---

## 회귀 검증

이 체크리스트는 다음 변경이 있을 때마다 재실행:
- `src/character/Controller.ts`, `src/character/TouchInputSource.ts`
- `src/ui/VirtualJoystick.ts`, `src/ui/MobileActionButtons.ts`, `src/ui/LandingScreen.ts`
- `src/ui/Toast.ts`, `src/ui/HelpButton.ts`, `src/ui/TutorialModal.ts`
- `src/main.ts`의 init 또는 animate 루프
- `src/game/SaveSystem.ts` (특히 `tutorialSeen`/`totalCollected` 플래그)
- `src/game/ItemTypes.ts`, `src/game/RegionManager.ts`, `src/world/ChunkGenerator.ts`, `src/game/ItemSystem.ts` (특산품 경로)
- `src/ui/HUD.ts`, `src/ui/RegionUnlockFX.ts`
- 새로운 입력 디바이스 추가 (게임패드 등)

---

## 지역별 소품 팔레트 (Wave 2 #2)

- [ ] 초원 마을: 꽃(flower)이 tree/lamp/bench보다 눈에 띄게 많이 보임
- [ ] 항구 마을: 벤치(bench)가 가장 많음
- [ ] 숲 마을: 나무(tree)가 가장 많음
- [ ] 황야 마을: 가로등(lamp)이 가장 많음
- [ ] 모든 집(house) 앞에 우편함(mailbox)이 1개씩 붙어 있고 집 쪽을 바라봄
- [ ] 우편함이 건물 안에 파묻히지 않고 외곽(인도/도로변)에 보임
- [ ] 집이 없는 청크에는 우편함도 없음

## 지역 특산품 체크 (Wave 2 #1)

- [ ] HUD 지역명 옆에 특산품 이모지가 표시됨 (초원 🌸 / 항구 🐟 / 숲 🍀 / 황야 💧)
- [ ] 지역 이동 시 HUD 이모지가 해당 지역 특산품으로 교체됨
- [ ] 각 지역을 10분 이상 돌아다녔을 때 특산품이 최소 1개는 목격됨 (15% 확률 × 여러 청크)
- [ ] 특산품 수집 시 한 번에 `totalCollected`가 3 증가 (HUD 카운트 숫자로 확인)
- [ ] 수집 FX 색이 특산품별로 다름 (꽃=분홍, 물고기=시안, 클로버=초록, 물방울=파랑)
- [ ] 지역 잠금 해제 토스트 하단에 `— 🍀 네잎클로버가 자라요` 같은 안내가 포함됨
- [ ] 예전 세이브 이어서 시작해도 `totalCollected`가 `collectedItemIds.length`로 폴백돼 이상한 값 아님
- [ ] 특산품 수집 후 새로고침 → 카운트/레벨이 정확히 복원됨 (weight=3 유지)
