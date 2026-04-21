# Wave 1 · Task 2 — 코드 스플리팅

**상태**: ✅ 완료
**날짜**: 2026-04-21
**추정 → 실제**: 0.5일 → 약 10분

---

## 목표

- 빌드 시 "chunk > 500KB" 경고 제거
- three.js 라이브러리를 게임 코드와 분리하여 **반복 방문 캐시 효율** 향상
- 게임 코드만 수정할 때 사용자가 619KB three를 재다운로드하지 않도록

---

## 변경 사항

### `vite.config.ts`
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        three: ['three', 'three/examples/jsm/loaders/GLTFLoader.js',
                'three/examples/jsm/utils/SkeletonUtils.js'],
      },
    },
  },
  chunkSizeWarningLimit: 700,
}
```

- three + GLTFLoader + SkeletonUtils → 하나의 `three-*.js` 청크로 격리
- 경고 임계값을 600 → 700으로 올려 three 청크(619KB) 단독 알림 차단 (게임 코드 청크는 54KB로 임계 훨씬 미만)

---

## 빌드 결과 비교

| | Before | After |
|---|---|---|
| 청크 개수 | 1 (app+vendor 통합) | 3 (app · three · worker) |
| 메인 청크 | 672 KB (gzip 177 KB) | **app 54 KB** (gzip 17.5 KB) |
| Vendor 청크 | 없음 | **three 619 KB** (gzip 160 KB) |
| 경고 | ⚠️ `> 500 KB` | 없음 |

---

## 반복 방문 캐싱 이점

**게임 코드만 변경 시** (일반 개발 사이클):
- 이전: 672KB 청크 전체 재다운로드
- 현재: 54KB app 청크만 재다운로드 (three 619KB는 `Cache-Control` 히트)

**초기 방문 총합**은 동일하지만 **재방문 시 다운로드 양이 92% 감소**.

GitHub Pages는 정적 파일을 CDN 캐시하므로 hash 붙은 파일명(`three-D2bjtP39.js`)이 바뀌지 않는 한 즉시 캐시됩니다.

---

## 검증

- ✅ `npm run build` — 경고 없이 3개 청크 생성
- ✅ `npm test` — 65 tests, 9 files, all pass
- ✅ 각 청크 gzip 크기: app 17.5KB · three 160KB · worker 1KB

---

## Acceptance Criteria

- [x] 빌드 경고 제거
- [x] three.js가 별도 청크로 분리됨 (파일명에 `three-` prefix 확인 가능)
- [x] 게임 코드 청크 < 100KB (gzip 17.5KB 달성)
- [x] 기존 테스트 전부 통과
- [x] `dist/index.html`의 script 태그가 두 청크 모두 정상 참조

---

## 다음 작업

Wave 1 Task 3 — **Idle zoom 카메라** (`ThirdPersonCamera.ts` lerp 상태 머신 추가).
