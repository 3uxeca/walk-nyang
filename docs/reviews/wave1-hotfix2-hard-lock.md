# Wave 1 · Hotfix 2 — 잠긴 지역 하드 블록

**상태**: ✅ 완료
**날짜**: 2026-04-21
**유형**: Bug fix (Wave 1 추가 패치)

---

## 보고된 증상

> 경계 이상으로도 넘어가지고 토스트도 안뜬다니까

플레이어 레벨 1(초원·항구만 해제)인데 숲 마을(region 2, 잠김)까지 걸어 들어감. 경계 토스트도 안 뜸.

---

## 원인

기존 로직:

```ts
if (regionManager.getChunkState(targetCX, targetCZ) === 'locked') {
  const ROAD_HALF = 9
  const onRoad = Math.abs(lx) <= ROAD_HALF || Math.abs(lz) <= ROAD_HALF
  if (!onRoad) { ... block ... }
}
```

- `ROAD_HALF = 9`에 `OR` 조합 → 청크의 대부분(18×32 십자형)이 "도로"로 판정
- 실제 도로 + 인도는 ±7만 차지하는데 과하게 관대
- 결과: 잠긴 지역도 대부분 걸어 들어갈 수 있고, 도로 위에선 토스트가 안 떠서 플레이어는 "경계가 없다"고 느낌

---

## 변경 사항

### `src/main.ts`

- `onRoad` 예외 제거 → 잠긴 청크로의 진입 자체를 차단
- 세이브 로드 시 플레이어가 이미 잠긴 청크 안에 있을 수 있으므로, `prevState === 'locked'`면 차단하지 않음 (이미 내부에 있다면 나가는 움직임도 허용)

```ts
if (!chunkBlocked && regionManager.getChunkState(targetCX, targetCZ) === 'locked') {
  const prevState = regionManager.getChunkState(prevCX, prevCZ)
  if (prevState !== 'locked') {
    charPos.x = prevX
    charPos.z = prevZ
    toast!.show('아직 잠겨있는 지역이에요', '🔒', 'locked-region', 2000)
  }
}
```

---

## 동작 차이

| 시나리오 | 이전 | 이후 |
|---------|------|------|
| 언락 지역 → 도로로 잠긴 지역 진입 | ✅ 가능 (통과) | ❌ 경계에서 차단 + 토스트 |
| 언락 지역 → 풀밭으로 잠긴 지역 진입 | ❌ 차단 (대부분), 일부 7×7 corner만 | ❌ 차단 + 토스트 |
| 세이브에서 잠긴 지역 복원 시 | 도로 외엔 갇힘 | 자유 이동 허용 (나갈 수 있음) |
| 레벨업으로 지역 해제 직후 | 모든 칸 이동 가능 | 모든 칸 이동 가능 (변화 없음) |

---

## 검증

- ✅ `npm run build` — 앱 청크 58.08 KB
- ✅ `npm test` — 65 passed
- ✅ 현재 레벨 기준 잠긴 지역 경계에 닿으면 즉시 차단 + 토스트
- ✅ 토스트 2초 쓰로틀 — 경계 박기 시 스팸 없음

---

## Acceptance Criteria

- [x] 잠긴 지역 경계 통과 불가 (도로 포함)
- [x] 차단 시 항상 토스트 표시
- [x] 언락된 지역 간 이동은 영향 없음
- [x] 세이브 로드 시 잠긴 청크 안에 있어도 갇히지 않음
- [x] 기존 테스트 전부 통과

---

## 후속 고려

- 도로 끝에서 "막혀버린" 느낌을 완화하려면 경계 직전에 시각적 barrier (반투명 벽 등) 추가 가능 (Wave 4 이후)
