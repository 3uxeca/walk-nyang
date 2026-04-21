# Wave 1.5 · Phase 3 — 랜딩(시작) 화면

**상태**: ✅ 완료 (Level 2 — code-reviewer 1회 + 피드백 반영)
**날짜**: 2026-04-22
**목적**: 게임 즉시 진입을 막고, 사용자 클릭으로 게임 시작 + 자연스러운 Web Audio unlock

---

## 변경 사항

### 신규 파일
- `src/ui/LandingScreen.ts` — 풀스크린 오버레이
  - 로고 + 타이틀 (Jua 한글 폰트) + 서브타이틀 + 펄스 애니메이션 START 버튼 + 힌트
  - float / fade-in 스태거 / pulse 애니메이션
  - 600px width / 480px height 미디어쿼리 (모바일 세로/가로)
  - 로고 `<img>` 로드 실패 시 이모지 자동 폴백
- `public/walk-nyang-logo.png` — 사용자 제공 로고 (585KB, 추후 압축 후속 작업)

### 수정 파일
- `index.html` — Google Fonts 링크에 `&family=Jua` 추가 (몽글몽글한 한글 글꼴)
- `src/main.ts` — `assets.preload()` 직후 `await new Promise(...)`로 LandingScreen 게이트, START 클릭 시 게임 init 진행

---

## Level 2 리뷰 결과

### code-reviewer 1차
| 등급 | 이슈 | 조치 |
|------|------|------|
| 🔴 HIGH | 로고 이미지 onerror 폴백 없음 | ✅ `img.onerror`로 이모지 div 교체 |
| 🟡 MED | HMR 시 init Promise 영원 펜딩 | 패스 (Vite GC가 처리) |
| 🟡 MED | 가로 모바일 세로 overflow 가능성 | ✅ `max-height: 480px` 미디어쿼리 + `overflow-y: auto` |
| 🟡 MED | 585KB 로고 미최적화 | 별도 후속 작업 (Wave 5 polishing) |
| 🟢 LOW | `:active` scale이 pulse 애니메이션과 충돌 | ✅ `animation-play-state: paused` 추가 |
| 🟢 LOW | hint 텍스트 redundant | 패스 (사용자 의도 메시지) |

---

## 핵심 설계

### Web Audio unlock
랜딩 START 버튼 클릭이 첫 사용자 인터랙션 → AudioContext가 그 시점에 unlock됨.
이후 footstep/meow/purring/jump 등 모든 사운드가 자동 재생 가능.

### init() 게이트 패턴
```ts
await new Promise<void>(resolve => {
  landingScreen = new LandingScreen(() => {
    landingScreen = null
    resolve()
  }, { logoUrl, title, ... })
})
```
- 콜백/상태머신 없이 `await`로 자연스럽게 보류
- HMR 발생 시 dispose만 호출되고 init은 새 모듈에서 다시 시작 (정상)

### 모바일 폰트 fallback chain
`'Jua', 'Nunito', 'Apple SD Gothic Neo', sans-serif`
- Jua 로드 실패 → Nunito는 한글 미지원 → Apple SD Gothic Neo (macOS/iOS) 또는 시스템 sans-serif (Android = Noto Sans CJK)

---

## 반응형 동작

| 환경 | 로고 | 타이틀 | 버튼 | 비고 |
|------|------|-------|------|------|
| 데스크탑 (>600w, >480h) | 240px | 64px | 28px | 기본 |
| 세로 모바일 (≤600w) | 180px | 44px | 22px | 폭 조절 |
| 가로 모바일 (≤480h) | 110px | 32px | 18px | 세로 overflow 방지 |

---

## Acceptance Criteria

- [x] 게임 진입 전 풀스크린 랜딩 표시
- [x] 모바일·데스크탑 모두에서 적절한 크기/여백
- [x] START 클릭 → 0.45s 페이드아웃 후 게임 자동 시작
- [x] 로고 이미지 로드 실패 시 이모지 폴백
- [x] 더블 클릭 안전 (`removed` guard)
- [x] HMR 시 dispose 정상
- [x] Jua 폰트 로드 (한글 둥근 글꼴)
- [x] AudioContext 자연 unlock
- [x] `npm test` 65 pass · `npm run build` 성공

---

## 다음 작업

- Wave 1.5 Phase 4 — 실기 테스트 + Vitest pointer event 스텁
- (별도 후속) 로고 PNG 압축: `pngquant --quality=65-80` 또는 WebP 변환 — 585KB → ~50KB 목표
