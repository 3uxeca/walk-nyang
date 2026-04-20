# Walk3D - 귀여운 3D 마을 탐험 수집 게임

**작성일:** 2026-04-17
**최종 수정:** 2026-04-17 (Architect + Critic 피드백 반영 패치)
**모드:** RALPLAN-DR Consensus (SHORT) + Deep Interview Integration
**소스:**
- `/Users/dasha/Desktop/code/walk3d/.omc/specs/deep-interview-walk3d.md` (모호도 18% PASSED)
- 기존 `walk3d-village-game.md` ralplan 구조
- Architect + Critic 리뷰 피드백 (CRITICAL 5 + MAJOR 3)

---

## 0. 핵심 게임 루프 (Deep Interview에서 확정)

```
아이템 수집 -> 진행도 축적 -> 레벨업 -> 새 Region 해제 -> 새 지역 탐험 -> 아이템 수집 ...
```

- **V1 범위:** WASD 이동, 3인칭 카메라, 아이템 픽업, 수집 카운터 UI, Region 해제, localStorage 저장, 절차적 마을 생성
- **V2 이후:** 캐릭터 커스터마이징, 장소 도장깨기, 숨겨진 비밀
- **Out of Scope:** 멀티플레이, 모바일(v1), 서버 저장, 전투, NPC AI

---

## 1. RALPLAN-DR 요약

### Principles (핵심 원칙)

1. **브라우저 네이티브 우선** - 설치 없이 URL 접속만으로 플레이 가능해야 한다
2. **점진적 복잡도** - 최소 기능(걷기+마을)부터 동작시키고 아이템/Region 순으로 쌓아 올린다
3. **성능 예산 준수** - 데스크톱 Chrome에서 60fps (평균 55fps 이상) 유지
4. **귀여움 일관성** - low-poly chibi + MeshToonMaterial + 파스텔 팔레트 통일
5. **진행도 영속성** - 모든 진행(수집/Region 해제/위치)은 localStorage로 보존되어야 한다

### Decision Drivers (의사결정 동인) - Top 3

1. **개발 속도** - 단일 개발자/AI 에이전트가 빠르게 프로토타입할 수 있는가
2. **무한 월드 + 게임 진행 시스템의 공존** - 청크 기반 절차 생성과 Region/아이템 시스템이 충돌 없이 결합 가능한가
3. **저장/복원 신뢰성** - localStorage가 브라우저 재진입 시 일관된 상태를 복원할 수 있는가

### Viable Options

#### Option A: Three.js + Vite + 순수 아키텍처 (채택)

| 항목 | 내용 |
|------|------|
| 스택 | Three.js r170+ + Vite + TypeScript + Vitest + simplex-noise |
| 장점 | 게임 루프/청크 시스템 직접 제어, AI 에이전트 친화성, 번들 경량, 상태 관리 직접 제어로 SaveSystem 구현 단순 |
| 단점 | UI/상태 관리 직접 구현 |
| 적합도 | 높음 - 청크+Region+아이템 커스텀 로직에 최적 |

#### Option B: React Three Fiber (R3F) + Zustand

| 항목 | 내용 |
|------|------|
| 스택 | R3F + Drei + Zustand + Vite + TypeScript |
| 장점 | 선언적 씬, Zustand로 저장/불러오기 편의, UI(HUD) 구현 용이 |
| 단점 | 청크 스트리밍 시 React 리렌더 오버헤드, 무한 월드 성능 튜닝 난이도 상승, Worker 연계 복잡도 상승 |
| 적합도 | 중간 - UI 비중 큰 앱엔 좋으나 청크 스트리밍 게임엔 과도한 간접화 |

#### Option C: Babylon.js (기각)

- 번들 크기 >1MB, 학습 곡선 가파름, 이 규모에서 과도한 엔진

### ADR (Architecture Decision Record)

- **Decision:** Three.js + Vite + TypeScript + Vitest 순수 아키텍처 (Option A)
- **Drivers:** 개발 속도, 무한 월드 + 진행 시스템 결합, 저장 단순성
- **Alternatives considered:** R3F (React 오버헤드 및 Worker 연계 복잡), Babylon.js (과도한 규모)
- **Why chosen:** ChunkGenerator/ChunkMeshFactory/Worker 분리 구조가 Region/아이템/저장 시스템과 독립적으로 확장 가능. AI 에이전트가 가장 정확하게 코드 생성 가능.
- **Consequences:** UI(HUD, Region 해제 이펙트)와 상태 관리(SaveSystem, ProgressSystem)를 직접 구현해야 함
- **Follow-ups:** UI 복잡도가 커지면 Preact/lit 경량 프레임워크 도입 검토. 서버 저장이 필요해지면 SaveSystem 어댑터 교체 지점 명시

---

## 2. 아키텍처 개요

### 책임 경계 (SRP)

- **ChunkGenerator** = 순수 결정적 데이터 생성. 입력(청크 좌표 + worldSeed) -> 출력(지형/건물/소품/아이템 후보 데이터). 수집 상태를 알지 못함.
- **ItemSystem** = 메인스레드에서 ChunkGenerator 아이템 후보 데이터를 받아 `SaveSystem.collectedItemIds`로 필터링. 활성 아이템 결정 + Three.js 메시 생성 + 수집 감지.
- **ChunkMeshFactory** = Worker가 생성한 데이터(지형/건물/소품)를 Three.js 메시로 변환. Region 잠금 상태에 따라 프록시/풀 메시 결정.
- **RegionManager** = Region 정의/해제 상태 관리 + `proxyMesh`/`fullMesh` 상태 전환 관리.
- **ProgressSystem** = 수집 이벤트 -> 레벨/XP 계산 -> Region 해제 트리거.
- **SaveSystem** = localStorage 직렬화/역직렬화 + 스키마 버전 호환성.

### 잠긴 Region 렌더링 전략 (프록시 -> 풀 메시 교체)

- 잠긴 Region의 청크도 `ChunkGenerator` 데이터는 **항상 생성** (결정성 유지, 추후 해제 시 동일 데이터 재사용).
- `ChunkMeshFactory`는 잠긴 Region의 경우 **프록시 메시**(단순 박스 + 안개 오버레이)만 렌더링하여 저비용 시각화.
- Region 해제 시: `RegionManager`가 해당 Region의 청크들을 순회하며 **청크별 순차 교체**(프록시 메시 dispose -> 풀 메시 생성). 프레임 스파이크 방지를 위해 `requestIdleCallback` 또는 프레임당 1-2 청크 페이스.
- `RegionManager.ts`는 각 청크 단위 `{ proxyMesh?: Object3D, fullMesh?: Object3D, state: 'locked' | 'unlocking' | 'unlocked' }` 상태를 관리.

### 파일 구조 (기존 + 신규 통합)

```
walk3d/
  src/
    main.ts                       # 엔트리포인트, 게임 루프, HMR cleanup
    workers/
      chunkWorker.ts              # Web Worker: ChunkGenerator 로직 실행 (후보 데이터 반환)
    world/
      ChunkManager.ts             # 청크 로딩/언로딩, Region 필터링 반영
      ChunkGenerator.ts           # 순수 데이터 생성 (지형/건물/소품 + 아이템 후보)
      ChunkMeshFactory.ts         # Three.js 메시 생성 (프록시 vs 풀 분기)
      Terrain.ts                  # 지형 생성
      Buildings.ts                # 건물 (low-poly)
      Props.ts                    # 나무/벤치/꽃 등 소품
      RoadGrid.ts                 # 격자 도로 시스템
    character/
      Character.ts                # chibi 캐릭터 모델 + 절차적 애니메이션
      Controller.ts               # WASD 입력 + 속도/방향 계산 (순수 함수)
    camera/
      ThirdPersonCamera.ts        # 3인칭 추적 카메라
    game/                         # [신규] 게임 진행 시스템
      ItemSystem.ts               # 후보 필터링(collectedItemIds) + 메시 + 수집 감지
      ProgressSystem.ts           # 레벨/XP/Region 해제 진행도 계산
      RegionManager.ts            # Region 정의, 해제 상태, 프록시/풀 메시 전환
      SaveSystem.ts               # localStorage 직렬화/복원, 복합 키 스키마 버전
    ui/                           # [신규] HUD 및 이펙트
      HUD.ts                      # 수집 카운터 (N / M) DOM 오버레이
      RegionUnlockFX.ts           # Region 해제 시 Three.js/DOM 이펙트
    utils/
      noise.ts                    # Simplex noise 래퍼 (시드 기반)
      pool.ts                     # 오브젝트 풀링
      rng.ts                      # 결정적 난수 (아이템 배치 시드)
  public/
    index.html
  vitest.config.ts
  vite.config.ts
  tsconfig.json
  package.json
```

### 무한 월드 + Region 전략

- **Chunk:** 32x32 월드 유닛, 플레이어 주변 3x3 활성화 (Phase 3c 성능 측정 후 5x5 검토)
- **Region:** 여러 청크를 묶은 논리적 영역. 각 청크는 `regionId`를 가지며, Region이 잠겨있으면 ChunkMeshFactory는 프록시 메시(박스+안개)만 생성
- **Simplex Noise + RegionId 결정 규칙:** 청크 좌표 -> Region 매핑 함수는 순수/결정적 (`regionForChunk(cx, cz)`)
- **Items:** ChunkGenerator가 청크마다 결정적 시드로 아이템 **후보**(id, 위치, 타입) 데이터를 반환. ItemSystem이 메인스레드에서 `SaveSystem.collectedItemIds`를 조회하여 수집된 아이템을 제외하고 활성 메시로 등록.
- **Region 해제 조건:** `ProgressSystem`이 관리 (예: Region 0 기본 해제, Region 1 = 아이템 20개, Region 2 = 50개 등)

### SaveSystem 스키마 (복합 키 포함)

```typescript
interface SaveData {
  version: number             // 스키마 버전 (마이그레이션 포인트)
  worldSeed: number           // 신규: 월드 생성 시드 - 변경 시 save 리셋
  itemSchemaVersion: number   // 신규: 아이템 종류/ID 규약 변경 감지
  collectedItemIds: string[]  // 형식: "{chunkX},{chunkZ},{localIdx}"
  unlockedRegions: string[]
  playerPosition: { x: number; z: number }
  // 내부 필드: totalCollected, currentLevel은 collectedItemIds.length 및 ProgressSystem 재계산으로 파생
}
```

- **복합 키 규칙:** `collectedItemIds` 항목은 `"chunkX,chunkZ,localIdx"` 문자열. 예: `"3,-2,5"` = 청크(3,-2) 내 5번째 후보 아이템.
- **불일치 검증 (load 시):**
  - `worldSeed` 불일치 -> 맵 결정성이 다름 -> save 전체 리셋 + 사용자 알림 토스트.
  - `itemSchemaVersion` 불일치 -> 아이템 ID 규약 변경 -> save 전체 리셋 + 사용자 알림 토스트.
  - `version` 불일치 -> 마이그레이션 시도 -> 실패 시 graceful reset.

### 캐릭터/카메라

- Low-poly chibi (머리:몸 = 1:1), Box/Sphere/Cylinder 조합
- 걷기/대기 절차적 애니메이션
- 3인칭 추적 카메라 (lerp 기반 부드러운 추적)

---

## 3. Phase별 실행 계획

### Phase 1: 프로젝트 초기화 + 테스트 인프라

**OMC Agent:** `executor` (sonnet)

**작업 내용:**
- Vite + TypeScript + Three.js 스캐폴딩
- 기본 씬(조명/바닥/안개) 구성
- Vitest 설정 + 샘플 테스트 1개
- `main.ts`에 HMR cleanup 코드 (`import.meta.hot`)

**수용 기준:**
- [ ] `npm run dev`로 Three.js 씬 렌더링 확인
- [ ] 바닥/조명/안개 렌더링
- [ ] TypeScript 컴파일 에러 0
- [ ] `npx vitest run` 샘플 테스트 1개 통과
- [ ] HMR 시 WebGL context 경고 없음

---

### Phase 2: 캐릭터 + WASD 이동 + designer 비주얼 게이트

**OMC Agent:** `executor` (opus) + `designer` (비주얼 리뷰)

**작업 내용:**
- Low-poly chibi 캐릭터 코드 생성
- WASD 입력, 3인칭 카메라 추적
- 절차적 걷기/대기 애니메이션
- 기본 충돌 감지 뼈대
- `Controller.ts` 순수 함수 단위 테스트

**수용 기준:**
- [ ] chibi 비율/파스텔 색상 캐릭터 화면 중앙 렌더링
- [ ] WASD 전후좌우 이동 + 이동 방향 회전
- [ ] 3인칭 카메라 부드럽게 추적
- [ ] 걷기 시 팔다리 스윙 재생
- [ ] `Controller.ts` 테스트 통과
- [ ] **designer 비주얼 게이트 통과** ("귀엽다" 기준 충족)

---

### Phase 3a: 청크 시스템 기초

**OMC Agent:** `executor` (opus)

**작업 내용:**
- `ChunkGenerator`: Simplex noise 기반 건물 배치 데이터 생성 (순수 함수)
- `ChunkManager`: 3x3 청크 로드/언로드
- 기본 건물 2종 (집/상점)
- Vitest: ChunkGenerator 결정성 테스트 (동일 시드 -> 동일 결과)

**수용 기준:**
- [ ] 플레이어 이동 시 청크 자동 생성/해제
- [ ] 뒤로 돌아가면 동일 배치 재현 (결정성)
- [ ] 건물 2종 청크 내 배치
- [ ] 결정성 테스트 통과

---

### Phase 3b: 콘텐츠 다양화 + 격자 도로

**OMC Agent:** `executor` (opus)

**작업 내용:**
- 건물 5-6종 (집/상점/카페/교회/학교/탑)
- 소품 5종 (나무/꽃/가로등/벤치/우체통)
- `RoadGrid.ts` 격자 도로 (청크당 십자형, 경계 자동 연결)
- 도로 외 영역에만 건물/소품 배치

**수용 기준:**
- [ ] 건물 5종 이상 시각적 구분
- [ ] 소품 5종 이상
- [ ] 청크 내 격자 도로 + 인접 청크 연결
- [ ] 도로-건물 겹침 없음

---

### Phase 3c: 성능 최적화 + Web Worker

**OMC Agent:** `executor` (opus)

**작업 내용:**
- `pool.ts` 오브젝트 풀링
- `src/workers/chunkWorker.ts` 생성: ChunkGenerator를 Worker로 이동
- `ChunkMeshFactory.ts`: Worker 데이터 -> Three.js 메시
- **Worker 폴백 경로:** Worker 생성 실패/비가용 환경 (예: 오래된 브라우저) 감지 시 메인스레드에서 동기 ChunkGenerator 호출로 폴백. 성능 저하는 허용, 가용성 우선.
- dispose/메모리 누수 점검
- 5x5 확장 성능 측정 -> 채택 여부 결정
- Vitest: 풀링 테스트, Worker 메시지 직렬화 테스트, 폴백 경로 테스트

**수용 기준:**
- [ ] 5분 연속 플레이 시 메모리 증가 < 10MB
- [ ] Worker 스레드 활성 (DevTools 확인)
- [ ] 청크 생성이 메인 스레드 미블로킹
- [ ] 60fps 유지 (평균 55fps 이상)
- [ ] Worker 비가용 시 동기 폴백으로 게임 실행 가능 (수동 검증)
- [ ] 풀링/Worker/폴백 테스트 통과

---

### Phase 3d-1: ChunkGenerator 후보 확장 + ItemSystem

**OMC Agent:** `executor` (opus)

**작업 내용:**
- `ChunkGenerator` 확장:
  - 아이템 **후보 데이터**(id: `"{chunkX},{chunkZ},{localIdx}"`, position, type) 결정적 생성.
  - 순수/결정적 유지 - 수집 상태를 알지 못함.
- `game/ItemSystem.ts` (메인스레드):
  - ChunkGenerator 후보 데이터를 받아 `SaveSystem.collectedItemIds` Set으로 필터링 -> 활성 아이템 결정.
  - 활성 아이템 Three.js 메시 생성 (회전/상하 부유 애니메이션, 파스텔 별/코인/보석).
  - 수집 판정 (플레이어-아이템 거리 < 1.5 월드 유닛 시 자동 수집) -> 이벤트 발생 + 메시 제거 + `collectedItemIds`에 id 추가.
- **책임 경계:** `ChunkGenerator` = 순수 결정적 데이터, `ItemSystem` = 수집 상태 적용 + Three.js 메시.
- Vitest:
  - **결정성:** 동일 `worldSeed` + 동일 청크 좌표 -> 동일 후보 데이터 (속성 테스트).
  - **교차 결정성 불변식:** 동일 `worldSeed` + 동일 `collectedItemIds` -> ChunkGenerator 후보 + ItemSystem 필터 후 항상 동일한 활성 아이템 집합 (속성 테스트, 무작위 시드/수집 상태 생성).
  - 수집 경계값 테스트 (거리 1.49 수집, 1.51 미수집).

**수용 기준:**
- [ ] 청크에 아이템 후보가 결정적으로 배치됨 (ChunkGenerator)
- [ ] ItemSystem이 `collectedItemIds`로 필터링하여 활성 아이템만 렌더링
- [ ] 플레이어가 아이템에 근접하면 자동 수집되고 아이템 메시 제거
- [ ] 수집 이벤트에 복합 키 id가 포함됨
- [ ] 결정성 + 교차 결정성 불변식 테스트 통과

---

### Phase 3d-2: ProgressSystem + RegionManager

**OMC Agent:** `executor` (opus)

**작업 내용:**
- `game/ProgressSystem.ts`:
  - `totalCollected`, `currentLevel`, `nextLevelThreshold` 관리.
  - 수집 이벤트 수신 -> 레벨업 판정 -> Region 해제 트리거.
- `game/RegionManager.ts`:
  - Region 정의 (id, theme, 해제 조건 아이템 수, 중심 좌표).
  - `regionForChunk(cx, cz)` 결정적 매핑.
  - 해제 상태 관리 + **청크별 `{ proxyMesh?, fullMesh?, state: 'locked' | 'unlocking' | 'unlocked' }` 상태**.
  - Region 해제 시 해당 Region의 청크들을 순회하며 프록시 메시 dispose -> 풀 메시 생성 (프레임당 1-2 청크 페이스).
- Vitest:
  - ProgressSystem 레벨업 경계값 테스트 (19개 -> 미해제, 20개 -> 해제).
  - RegionManager Region 매핑 결정성 테스트.
  - 프록시 -> 풀 메시 교체 상태 전이 테스트.

**수용 기준:**
- [ ] `ProgressSystem`이 수집 이벤트를 받아 레벨/진행도를 갱신
- [ ] Region 해제 조건 충족 시 `RegionManager` 상태 변경 이벤트 발생
- [ ] RegionManager가 청크별 proxy/full 메시 상태를 올바르게 추적
- [ ] 레벨업 경계값 + 매핑 결정성 + 상태 전이 테스트 통과

---

### Phase 3d-3: ChunkManager 연계 + RegionUnlockFX 훅 + 세션 루프 게이트

**OMC Agent:** `executor` (opus)

**작업 내용:**
- `ChunkManager` 연계:
  - 청크 로드 시 RegionManager에 `proxyMesh`/`fullMesh` 어느 쪽을 렌더링할지 질의.
  - 잠긴 Region의 청크는 ChunkMeshFactory를 통해 프록시 메시(단순 박스 + 안개 오버레이)만 생성.
  - ItemSystem에 청크별 아이템 후보 전달 -> 활성 아이템 등록.
- `ui/RegionUnlockFX.ts` 훅 (FX 본구현은 Phase 3e에서 비주얼 폴리싱):
  - Region 해제 이벤트 -> 스텁 이펙트 트리거 (console.log 또는 간단한 토스트).
- **세션 내 루프 완주 수용 기준 게이트** (수동 플레이 검증):
  - 저장 없이 세션 내에서 "아이템 수집 -> 레벨업 -> 새 Region 메시 교체"까지 동작함을 수동 플레이로 확인.
  - 이 게이트를 통과해야 Phase 3e 착수.

**수용 기준 (게이트):**
- [ ] 잠긴 Region 청크는 프록시 메시로, 해제된 Region 청크는 풀 메시로 렌더링됨
- [ ] 이미 수집된 아이템은 재렌더링 시 스폰되지 않음 (`collectedItemIds` 참조)
- [ ] **게이트:** 저장 없이 아이템 수집 -> 레벨업 -> 새 Region 메시 교체까지 수동 플레이 통과
- [ ] 프록시 -> 풀 메시 교체 시 프레임 스파이크 < 16ms (60fps 유지)

---

### Phase 3e (신규): SaveSystem + UI(HUD) + Region 해제 이펙트

**OMC Agent:** `executor` (opus) + `designer` (이펙트 비주얼 게이트)

**작업 내용:**
- `game/SaveSystem.ts`:
  - 스키마:
    ```typescript
    interface SaveData {
      version: number
      worldSeed: number
      itemSchemaVersion: number
      collectedItemIds: string[]  // "chunkX,chunkZ,localIdx"
      unlockedRegions: string[]
      playerPosition: { x: number; z: number }
    }
    ```
  - `save()` / `load()` / `reset()` API, localStorage 키 `walk3d.save.v1`.
  - 자동 저장: 아이템 수집/Region 해제/30초 간격 debounced save.
  - **복합 키 검증:**
    - `worldSeed` 불일치 -> save 리셋 + 사용자 알림 토스트 ("월드 시드 변경으로 저장 초기화").
    - `itemSchemaVersion` 불일치 -> save 리셋 + 사용자 알림 토스트 ("아이템 체계 변경으로 저장 초기화").
    - `version` 불일치 -> 마이그레이션 시도 -> 실패 시 graceful reset.
- 초기 로드 시 SaveSystem -> ProgressSystem/RegionManager/플레이어 위치 복원.
- **playerPosition 지면 스냅:**
  - 복원 시 저장된 `{x, z}`에서 raycast(위 -> 아래)로 지면 높이 `y`를 계산하여 스냅.
  - raycast 실패(청크 미로드 등) 시 해당 Region 중심 좌표로 폴백.
  - 복원 직후 캐릭터가 지형 위에 올바르게 위치함을 수동 검증.
- `ui/HUD.ts`:
  - DOM 오버레이 (absolute 위치, Three.js canvas 위).
  - 형태: "★ 7 / 20 · Region: Meadow".
  - 수집 이벤트 구독 -> 실시간 갱신.
- `ui/RegionUnlockFX.ts` 본구현:
  - Region 해제 시 Three.js 파티클/DOM 토스트 이펙트.
  - designer 비주얼 게이트 통과 필요.
- Vitest:
  - SaveSystem 라운드트립 테스트 (직렬화 -> 역직렬화 동등성).
  - 스키마 버전 불일치 처리 테스트 (`version` / `worldSeed` / `itemSchemaVersion` 각각).
  - playerPosition 지면 스냅 경로 테스트 (raycast 성공/실패 폴백).

**수용 기준:**
- [ ] 브라우저를 닫고 다시 열면 수집 아이템 수/해제 Region/플레이어 위치가 복원됨
- [ ] 이미 수집한 아이템은 재진입 시 다시 스폰되지 않음
- [ ] **worldSeed 또는 itemSchemaVersion 불일치 시 save 리셋 + 사용자 알림 토스트 표시**
- [ ] **복원 직후 raycast로 지면 스냅되어 캐릭터가 지형 위에 올바르게 위치함**
- [ ] **raycast 실패 시 Region 중심 좌표로 폴백**
- [ ] HUD에 "현재 N / 다음 레벨 M" 카운터가 실시간 표시됨
- [ ] Region 해제 시 시각적 피드백(이펙트 + 토스트)이 나타남
- [ ] SaveSystem 라운드트립 + 스키마 불일치 + 지면 스냅 테스트 통과
- [ ] **designer 비주얼 게이트 통과** (해제 이펙트)

---

### Phase 4: 비주얼 폴리싱

**OMC Agent:** `executor` (sonnet) + `designer`

**작업 내용:**
- 전체 오브젝트 `MeshToonMaterial` 적용
- 하늘 그라데이션, 안개 near/far 튜닝
- 파스텔 6색 이내 팔레트 통일
- 소프트 섀도우
- Region별 테마 컬러 구분 (예: Meadow=연초록, Harbor=하늘색, Forest=숲녹색)
- HUD 스타일 폴리싱

**수용 기준:**
- [ ] 파스텔 6색 팔레트 적용
- [ ] MeshToonMaterial 모든 오브젝트에 적용
- [ ] 안개로 청크 경계 자연 페이드
- [ ] 그림자 표시 + 60fps 유지
- [ ] Region별 테마 색상이 시각적으로 구분됨
- [ ] HUD 시각적 품질 designer 승인

---

### Phase 5: 코드 리뷰 + QA

**OMC Agent:** `code-reviewer` + `qa-tester`

**작업 내용:**
- 코드 리뷰: 메모리 누수, SaveSystem 동시성, Region 매핑 결정성, 타입 안전성
- 기능 QA:
  - WASD 이동, 청크 로드, 카메라 추적
  - 아이템 수집 자동화 동작
  - Region 해제 시나리오 (경계값 테스트)
  - 저장/불러오기 (브라우저 재시작, 시크릿 모드)
- 성능: 장시간 플레이 메모리/FPS
- 브라우저: Chrome/Firefox/Safari
- 엣지 케이스: 빠른 이동, 경계 이동, localStorage quota 초과, 손상된 SaveData, worldSeed/itemSchemaVersion 불일치, Worker 비가용

**수용 기준:**
- [ ] 코드 리뷰 critical 0건
- [ ] 5분 연속 플레이 메모리 증가 < 10MB
- [ ] Chrome/Firefox 정상 동작
- [ ] 수집 -> 레벨업 -> Region 해제 시나리오 E2E 통과
- [ ] 브라우저 재시작 후 진행도 100% 복원
- [ ] 손상된 SaveData / 시드 불일치 시 앱이 크래시하지 않음 (graceful reset + 토스트)
- [ ] Worker 비가용 폴백 경로 실증

---

### Phase 6: 평가 + 최종 검증

**OMC Agent:** `scientist` + `verifier`

**작업 내용:**
- FPS/메모리/로드 시간 정량 측정
- 번들 크기 분석
- Lighthouse 점수
- Vitest 전체 스위트 통과 확인
- 최종 빌드 검증

**수용 기준:**
- [ ] 평균 FPS >= 55 (데스크톱 Chrome)
- [ ] 초기 로드 < 3초
- [ ] 번들 < 500KB gzipped
- [ ] `npm run build` 성공
- [ ] `npx vitest run` 전체 통과
- [ ] **Deep Interview 전 수용 기준 체크**:
  - WASD 이동 O
  - 아이템 배치 + 자동 수집 O
  - 수집 카운터 화면 표시 O
  - Region 해제 + 시각적 피드백 O
  - 브라우저 재진입 시 진행도 복원 O
  - 캐릭터 귀여움 (designer 게이트) O
  - 절차적 생성 O
  - 60fps (55fps 평균) O

---

## 4. OMC 에이전트 파이프라인 요약

```
Phase 1     (초기화+테스트)              -> executor (sonnet)
Phase 2     (캐릭터)                     -> executor (opus) + designer (비주얼 게이트)
Phase 3a    (청크 기초)                  -> executor (opus)
Phase 3b    (콘텐츠+도로)                -> executor (opus)
Phase 3c    (최적화+Worker+폴백)         -> executor (opus)
Phase 3d-1  (ChunkGenerator 후보+Item)   -> executor (opus)
Phase 3d-2  (Progress+RegionManager)     -> executor (opus)
Phase 3d-3  (ChunkManager 연계+세션 게이트)-> executor (opus)
Phase 3e    (Save+HUD+해제 FX+지면 스냅) -> executor (opus) + designer (FX 게이트)
Phase 4     (폴리싱)                     -> executor (sonnet) + designer
Phase 5     (리뷰/QA)                    -> code-reviewer + qa-tester
Phase 6     (평가)                       -> scientist + verifier
```

**테스트 내장 타임라인:**
```
Phase 1     -> Vitest 설치 + 샘플 테스트
Phase 2     -> Controller.ts 순수 함수 테스트
Phase 3a    -> ChunkGenerator 결정성 테스트
Phase 3c    -> 풀링/Worker 메시지 직렬화/폴백 테스트
Phase 3d-1  -> 결정성 + 교차 결정성 불변식 + 수집 경계값 테스트
Phase 3d-2  -> 레벨업 경계값 + Region 매핑 + 메시 상태 전이 테스트
Phase 3d-3  -> 세션 루프 수동 플레이 게이트
Phase 3e    -> SaveSystem 라운드트립 + 스키마 불일치 + 지면 스냅 테스트
Phase 6     -> 전체 스위트 통과
```

**순차 의존성:**
- 3a -> 3b -> 3c (청크 기반 완성)
- 3c -> 3d-1 (ChunkGenerator 확정 후 아이템 후보 확장)
- 3d-1 -> 3d-2 -> 3d-3 (Item -> Progress/Region -> ChunkManager 연계 + 세션 게이트)
- 3d-3 -> 3e (세션 루프 게이트 통과 후 SaveSystem 도입)

---

## 5. 기술 스택 최종 정리

| 영역 | 선택 | 사유 |
|------|------|------|
| 3D 엔진 | Three.js r170+ | 가장 성숙한 WebGL 라이브러리 |
| 빌드 | Vite 6.x | 빠른 HMR |
| 언어 | TypeScript 5.x | 타입 안전성 |
| 테스트 | Vitest | Vite 네이티브 |
| Noise | simplex-noise | 결정적 절차 생성 |
| 캐릭터 | Low-poly chibi (코드) | 외부 에셋 없음 |
| 셰이딩 | MeshToonMaterial | 셀 셰이딩 |
| 카메라 | 3인칭 커스텀 | 게임 전용 |
| 저장 | localStorage + JSON 복합 키 스키마(worldSeed/itemSchemaVersion) | 서버 불필요, 스키마 마이그레이션 + 불일치 감지 |
| UI | DOM 오버레이 | 경량, Three.js 캔버스 위 absolute |
| 상태 관리 | 순수 TS 모듈 + 이벤트 버스 | 프레임워크 미도입, 단순성 |

---

## 6. 위험 요소 및 완화

### 6.1 Pre-mortem (3가지 실패 시나리오)

| 시나리오 | 원인 | 영향 | 완화 |
|---|---|---|---|
| **1. 배포 후 시드 알고리즘 변경** | `worldSeed` 정수 변경 또는 noise 구현 교체로 기존 청크의 결정적 출력이 달라짐. 기존 `collectedItemIds` 복합 키(`"3,-2,5"`)가 새 맵에서는 다른 아이템을 가리키거나 존재하지 않음. | 높음 - 플레이어 진행도 무효화 | SaveData에 `worldSeed` 저장 -> load 시 불일치 감지 -> graceful reset + 사용자 알림 토스트. 시드 변경은 의도적 배포 결정으로 간주. |
| **2. localStorage quota 초과 중 save** | `collectedItemIds` 수천 개 축적 + 다른 사이트의 localStorage 사용으로 quota 초과 시 `setItem` throw. 부분 쓰기 후 JSON 손상으로 load 실패. | 중간 - 저장 실패 후 다음 세션 진입 불가 | (a) `try/catch`로 save 실패 감지 + 사용자 알림. (b) 손상된 JSON은 load 시 파싱 실패 -> graceful reset. (c) long-term: `collectedItemIds` Region별 비트셋 압축(Phase 5 검토). |
| **3. Web Worker 크래시 (브라우저 메모리 부족)** | 장시간 플레이 중 Worker가 OOM 또는 브라우저가 Worker 종료. 청크 요청이 응답 없이 대기 -> 무한 로딩 행 상태. | 높음 - 게임 정지 | (a) Worker 메시지에 타임아웃(예: 3초) + 재시도 1회 + 실패 시 메인스레드 동기 폴백. (b) `onerror`/`onmessageerror` 훅으로 Worker 재생성. (c) Phase 3c 폴백 경로 실증. |

### 6.2 기타 위험 테이블

| 위험 | 영향 | 완화 방안 |
|------|------|-----------|
| 청크 생성 프레임 드랍 | 높음 | Phase 3c Worker 이동, ChunkGenerator 순수 함수화 |
| 청크 해제 메모리 누수 | 높음 | dispose 철저, 3c 풀링, 5분 메모리 < 10MB 검증 |
| 아이템 스폰 결정성 붕괴 | 높음 | ChunkGenerator 순수 함수 고정, Phase 3d-1 결정성 + 교차 결정성 불변식 테스트 |
| 수집 이중 카운팅 | 높음 | `collectedItemIds` Set으로 중복 방지, SaveSystem 라운드트립 테스트 |
| localStorage quota 초과 | 중간 | Pre-mortem #2 참조. graceful reset + 비트셋 압축 옵션 (Phase 5 검토) |
| SaveData 스키마 변경 | 중간 | `version` + `worldSeed` + `itemSchemaVersion` 3중 키. 마이그레이션 실패 시 안전 reset + 사용자 알림 |
| 시드 알고리즘 변경 | 높음 | Pre-mortem #1 참조. `worldSeed` 비교로 graceful reset |
| Worker 비가용/크래시 | 높음 | Pre-mortem #3 참조. 동기 폴백 경로 (Phase 3c), 타임아웃 + 재시도 |
| Region 매핑 재계산 비용 | 중간 | `regionForChunk` 결정적 함수 + 캐시 |
| 프록시 -> 풀 메시 교체 프레임 스파이크 | 중간 | 청크별 순차 교체 (프레임당 1-2 청크), `requestIdleCallback` 활용 |
| 잠긴 Region 시각 표현 | 중간 | 프록시 메시(박스 + 안개 오버레이), Phase 4 designer 게이트 |
| 캐릭터 귀여움 주관 평가 | 중간 | Phase 2 designer 비주얼 게이트, 불통과 시 반복 |
| HUD-게임 루프 오염 | 낮음 | HUD는 DOM 오버레이, 이벤트 버스로만 통신 |
| playerPosition 복원 지형 어긋남 | 중간 | raycast 지면 스냅 + Region 중심 좌표 폴백 (Phase 3e) |
| 모바일 성능 | 중간 | v1 out of scope, 추후 청크 수/폴리곤 조정 |

---

## 7. 검증 방법

1. **단위 테스트:** Phase별 Vitest 누적 (결정성, 교차 결정성 불변식, 컨트롤러, 풀링, Worker, 폴백, Item, Progress, Region, 메시 상태 전이, Save, 지면 스냅)
2. **시각적 검증:** 각 Phase 스크린샷/녹화, designer 에이전트 검수 (Phase 2, 3e, 4)
3. **성능 검증:** Chrome DevTools Performance (FPS/메모리), 프록시->풀 교체 스파이크 측정
4. **기능 검증:** WASD, 청크 로딩, 카메라, 아이템 수집, 저장/복원 수동 E2E, Phase 3d-3 세션 루프 게이트
5. **코드 검증:** code-reviewer (메모리/타입/구조/SRP 경계)
6. **정량 검증:** Lighthouse + 커스텀 메트릭
7. **Deep Interview 수용 기준 체크리스트:** Phase 6에서 8개 기준 전수 확인

---

## 8. Open Questions

실행 중 결정이 필요한 항목 (변경 시 `.omc/plans/open-questions.md`에도 반영):

- [ ] Region 개수/해제 임계치 구체값 (예: 3개 Region, 0/20/50 아이템) - Phase 3d-2 착수 시 확정
- [ ] 아이템 타입 종류 (별 하나만 vs 별/코인/보석 3종) - Phase 3d-1 착수 시 확정 -> `itemSchemaVersion` 고정
- [ ] 프록시 메시 시각 표현 (박스 + 안개 vs 지면 페이드 vs 투명 벽) - Phase 3d-3/4 designer 협의
- [ ] 자동 저장 주기 (30초 interval + 이벤트 기반 debounce) - Phase 3e
- [ ] `collectedItemIds` 저장 방식 (id 리스트 vs Region별 비트셋) - quota 측정 후 결정 (Pre-mortem #2)
- [ ] 활성 청크 3x3 vs 5x5 - Phase 3c 성능 측정
- [ ] 프록시 -> 풀 메시 교체 페이스 (프레임당 N 청크) - Phase 3d-2 성능 측정
- [ ] Worker 타임아웃 값 (3초 기본) - Phase 3c 실측
- [ ] 마우스 카메라 회전 지원 여부 - V1 외
- [ ] 점프 기능 - V1 외
- [ ] 낮/밤 사이클 - Phase 4 이후 검토
- [ ] 배포 플랫폼 (GitHub Pages/Vercel/Netlify) - Phase 6 착수 전

---

## 9. V1 완성 정의 (Deep Interview 수용 기준 매핑)

| Deep Interview 수용 기준 | 구현 Phase | 검증 방법 |
|---|---|---|
| WASD 자유 이동 | Phase 2 | 수동 + Controller 테스트 |
| 아이템 배치 + 근접 자동 수집 | Phase 3d-1 | ItemSystem 테스트 + 수동 |
| 수집 카운터 화면 표시 | Phase 3e | HUD 구현 + 수동 |
| Region 해제 + 시각 피드백 | Phase 3d-2 + 3d-3 + 3e | RegionManager 상태 전이 + RegionUnlockFX + designer 게이트 |
| 브라우저 재진입 진행도 복원 | Phase 3e | SaveSystem 라운드트립 + 지면 스냅 + 수동 |
| 캐릭터 귀엽다 | Phase 2 | designer 비주얼 게이트 |
| 절차적 마을 생성 | Phase 3a/3b | 청크 결정성 테스트 + 수동 |
| 60fps (평균 55+) | Phase 3c/6 | Chrome DevTools + scientist 측정 |

---

## 10. 핸드오프

계획 승인 시 다음 명령으로 실행 시작:

```
/oh-my-claudecode:start-work walk3d-village-game
```

Phase 1부터 순차 진행하며, 각 Phase 완료 시 수용 기준 체크 후 다음 Phase 진입. 특히 Phase 3d-3의 **세션 루프 수동 플레이 게이트**를 통과해야 Phase 3e 진입 허용.
