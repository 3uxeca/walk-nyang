# Wave 1 · Hotfix — 미로딩 청크 진입 차단

**상태**: ✅ 완료
**날짜**: 2026-04-21
**유형**: Bug fix (Wave 1 후속)

---

## 보고된 증상

> 경계면을 넘어서 아직 로드되지 않은 구역에도 고양이가 걸어서 접근이 가능한 상태야

플레이어가 빠르게 이동(특히 대시) 시 worker의 청크 메시 빌드 응답을 앞지르면서, 메시가 없는 빈 공간 위로 걸어 들어가는 현상.

---

## 원인

| | 기존 동작 |
|---|---|
| `activeRadius` | 2 → 5×5 = 25 청크 = 약 160 유닛 반경만 사전 로드 |
| Worker 응답 | 비동기 — 요청 후 메시 빌드까지 1–2 프레임 지연 |
| 충돌 검사 | 건물·잠긴 지역만 막고, **메시 미빌드 청크는 통과 허용** |

대시 속도 18 유닛/초로 청크 경계(32 유닛)를 1.78초 만에 넘는데, 그 사이 worker가 응답 안 하면 빈 공간이 노출됨.

---

## 변경 사항

### `src/world/ChunkManager.ts`
1. `activeRadius` 2 → **3** (5×5 → 7×7 = 49 청크, 약 224 유닛 반경)
   - 사전 로딩 범위가 1.4배 → 일반 속도에서 미로딩 노출 거의 없음
2. `hasChunk(cx, cz): boolean` 메서드 추가 — 메시까지 빌드된 청크인지 확인 (펜딩 상태는 false)

### `src/main.ts`
- 매 프레임 이동 후, **청크가 바뀌었는데 새 청크가 메시까지 빌드되지 않았으면** 직전 위치로 되돌림
- "지역을 불러오는 중이에요 ⏳" 토스트 표시 (1.2s 쓰로틀)
- `chunkBlocked` 플래그로 후속 잠긴 지역 체크 우회 — 토스트 중복 방지

```ts
const targetCX = Math.floor(charPos.x / CHUNK_SIZE)
const targetCZ = Math.floor(charPos.z / CHUNK_SIZE)
const prevCX = Math.floor(prevX / CHUNK_SIZE)
const prevCZ = Math.floor(prevZ / CHUNK_SIZE)
let chunkBlocked = false
if ((prevCX !== targetCX || prevCZ !== targetCZ)
    && !chunkManager!.hasChunk(targetCX, targetCZ)) {
  charPos.x = prevX
  charPos.z = prevZ
  toast!.show('지역을 불러오는 중이에요', '⏳', 'unloaded-chunk', 1200)
  chunkBlocked = true
}

if (!chunkBlocked && regionManager.getChunkState(targetCX, targetCZ) === 'locked') {
  // 기존 잠긴 지역 차단 로직
}
```

---

## 메모리 영향

| | 청크 수 | 추정 메모리 |
|---|---|---|
| 이전 (radius 2) | 25 | × |
| 현재 (radius 3) | 49 | ≈ 1.96× |

각 청크가 모델 + 머티리얼 클론을 가지지만 GLTF 데이터는 AssetManager에서 공유되므로 실 증가는 메시/지오메트리 + 머티리얼 인스턴스만. 데스크탑/모바일 모두 무난.

---

## 검증

- ✅ `npm run build` — 앱 청크 58.13 KB (+0.25 KB)
- ✅ `npm test` — 65 passed
- ✅ 같은 청크 내 이동은 영향 없음 (`prevCX === targetCX && prevCZ === targetCZ` 조건)
- ✅ 토스트 쓰로틀로 스팸 방지
- ✅ 잠긴 지역 토스트와 미로딩 토스트 동시 표시 안 됨 (`chunkBlocked` 플래그)

---

## Acceptance Criteria

- [x] 빠른 이동(대시)에도 청크 메시가 없는 곳으로 진입 불가
- [x] 정상 속도에서는 차단이 거의 트리거되지 않음 (radius 확대로 사전 로드)
- [x] 차단 시 사용자가 이유를 알 수 있도록 토스트 표시
- [x] 같은 청크 내 이동에는 영향 없음
- [x] 기존 테스트 전부 통과

---

## 후속 고려사항

- `activeRadius=3`도 부족하면 더 키우거나, "표시 반경"과 "데이터 반경"을 분리 가능
- 모바일 빌드 추가 시 메모리 압박 모니터링 필요
- Wave 4의 "지역 5–8개 확장" 시 활성 반경 재평가 필요
