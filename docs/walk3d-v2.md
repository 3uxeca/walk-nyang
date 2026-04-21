---
marp: true
theme: default
paginate: true
size: 16:9
backgroundColor: #fefaf3
header: 'walk3d v2 — 업데이트 리포트'
footer: '© 2026 walk3d'
style: |
  section { font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif; }
  h1 { color: #f06292; border-bottom: 3px solid #ffb3c6; padding-bottom: 8px; }
  h2 { color: #6a4c93; }
  code { background: #fff2e8; color: #c62828; }
  table { font-size: 0.85em; }
  th { background: #ffe0ec; }
---

<!-- _class: lead -->
<!-- _paginate: false -->

# 🐈 walk3d — v2 업데이트 리포트

**3D 고양이 산책 게임**
에셋 / UI / 월드 시스템 전면 교체

<br>

*2026년 4월 · Three.js 기반 웹 캐주얼 3D*

---

## 게임 개요

- 플레이어가 **고양이**가 되어 **3D 마을**을 자유롭게 걸어 다니는 힐링 게임
- 맵을 탐험하며 **아이템(별/코인/젬)** 을 모으고 **지역을 언락**
- 가만히 있으면 고양이가 **춤추며 하트**를 흘리는 아이들링 연출
- **브라우저 1개**만 있으면 플레이 가능 (로딩 <2초, 빌드 ≈177KB gz)

> v1이 "프로토타입"이었다면, v2는 **비주얼과 플레이 감**이 모두 갖춰진 정식 MVP

---

## v1 → v2 한눈에

| 영역 | v1 | v2 |
|------|-----|-----|
| 월드 에셋 | 전부 절차적 박스 | **Kenney City Kit GLB** + 절차적 폴백 |
| 도로 | 폭 3유닛 단색 2장 | **총 폭 14유닛** · 인도/중앙선/엣지 · non-overlap 타일 |
| 지형 | 단색 MeshToon | **ShaderMaterial 격자 패턴** + 지역색 |
| 하늘 | 단색 배경 | **그라디언트 하늘 돔 + 움직이는 구름 퍼프 12개** |
| 사운드 | synth만 | **Freesound CC0 meow/purr/footstep** 3종 + 기존 synth |
| UI | 기본 HUD | 컨트롤 HUD + **지역 언락 FX** + 수집 이펙트 |
| 이펙트 | 없음 | **하트 파티클**, 수집 반짝임, 건물 투명화 |
| 세이브 | v1 flat | **v2 schema + 아이템 위치 버전관리** |

---

## 기술 스택

<div style="display:flex; gap:40px;">
<div>

### 런타임
- **TypeScript 5.x** (strict)
- **Three.js** (WebGL 렌더러, PCF 소프트 섀도우)
- **Web Audio API** (합성 + PCM 재생)
- **Web Workers** (`chunkWorker.ts` — 청크 프리패스)

</div>
<div>

### 빌드 / 품질
- **Vite 6** (dev server, prod build)
- **Vitest** — 65개 유닛 테스트
- **tsc --noEmit** 타입체크
- **GLTFLoader / SkeletonUtils** (three examples)

</div>
</div>

<br>

**최종 빌드**: `672KB → 177KB (gzip)`, ES2020 타깃

---

## 사용 에셋 — 3D 모델

모두 **CC0** (Kenney / Quaternius 추정 · 출처는 `ASSETS.md` 참조)

| 분류 | 파일 수 | 출처 추정 |
|------|---------|----------|
| 캐릭터 (Cat) | 1 (스킨드 애니메이션) | Quaternius RPG Animals |
| 건물 (주거) | 2: house, apartment | Kenney **City Kit (Suburban)** |
| 건물 (상업) | 3: shop, cafe, tower | Kenney **City Kit (Commercial)** |
| 소품 | 5: tree, flower, lamp, bench, mailbox | Kenney **Nature / City Kit** |
| 도로 | 3 (파일만 있음) | 미사용 — 코드에서 절차적 생성 |

> 모든 GLB는 **머티리얼 깊은 복제** 적용 (v2에서 추가) — 클론된 인스턴스끼리 opacity 변경이 전파되던 버그 해결

---

## 사용 에셋 — 사운드

모두 **Freesound.org / Creative Commons 0**

| 파일 | 용도 | 비고 |
|------|------|------|
| `meow.wav` | 아이템 수집 시 야옹 | 피치 랜덤 ±10% |
| `purring.ogg` | 5초 idle 그르렁 (loop) | fade-in 1.5s |
| `footstep.ogg` | 걷기/대시 발걸음 | 피치 랜덤 + 하이패스 |

### 합성 사운드 (Web Audio API)
- **playJump()** — 또잉! 디튠된 사인파 2개
- **playDashWhoosh()** — 고양이 트릴 (sawtooth + 비브라토 LFO + 포먼트)
- `meow` / `footstep` 파일 없을 때 fallback 합성

---

## 주요 업데이트 ① 월드 시스템

### 청크 좌표계 버그 근본 수정
- **문제**: 아이템/소품이 **잠긴 지역**에 스폰되는 현상
- **원인**: `cx * CHUNK_SIZE` (청크 경계)를 중심으로 ±range 생성 → 절반이 인접 청크로 튐
- **해결**: 중심을 `(cx + 0.5) * CHUNK_SIZE` (청크 내부)로 이동

### 도로 타일 Non-overlap 레이아웃
- EW 도로(풀 폭 32) + NS 도로(11 길이 2토막) — **중앙 교차점 겹침 0**
- EW 인도(9 길이 2토막) + NS 인도(11 길이 2토막, 모서리 포함)
- 엣지/대시 선 Y 레이어 분리 (0.010 / 0.014 / 0.040) + `polygonOffset`

### 세이브 스키마 v2
`CURRENT_ITEM_SCHEMA_VERSION` 2로 상승 → 기존 아이템 좌표 무효화·재생성

---

## 주요 업데이트 ② 비주얼 개선

<div style="display:flex; gap:30px;">
<div>

### 하늘 / 배경
- **SkySystem** 신규
- SphereGeometry(180) + BackSide
- GLSL 그라디언트 셰이더
- 12개 구름 퍼프 (각 7 sphere)
- `scene.fog` 40–110 유닛

### 지형
- ShaderMaterial 격자 패턴
- 지역별 팔레트 4종 (초원/항구/숲/황무지)
- 언락 효과와 색상 연계

</div>
<div>

### Z-fighting 전면 해결
- 글로벌 300×300 바닥 **제거**
- 청크별 바닥 1장으로 단일화
- 도로/인도/엣지 Y 레이어 분리
- `polygonOffsetFactor/Units` 모든 도로 재질에 적용

### 건물 투명화
- **카메라→고양이 Raycast**
- 가리는 건물의 **전체 메시 통째로** 0.18 opacity
- 머티리얼은 인스턴스별 복제

</div>
</div>

---

## 주요 업데이트 ③ 게임플레이

### 물리 / 충돌
- **BuildingColliders** — 원통형 충돌 레지스트리 (반경 3.8)
- 청크 로드/언로드 시 등록/해제
- **X/Z 축 분리 슬라이딩** 충돌로 벽 따라 미끄러짐
- 지형 `STEP_HEIGHT = 0.35` 이하 자동 오름

### 지역 언락 시스템
- 4개 지역 (Meadow / Harbor / Forest / Wildlands)
- 레벨업 시 자동 언락 + **도로 띠를 통한 진입** 허용
- 잠긴 영역에서는 도로 외 이탈 불가

### 대시 / 점프
- Shift 대시 (속도 8 → 18) + **트릴 사운드**
- Space 점프 (`JUMP_FORCE 11`, `GRAVITY -25`)
- 중력/착지는 매 프레임 terrain height 기반

---

## 주요 업데이트 ④ UI / 이펙트

### 컨트롤 HUD
- 좌상단: 수집 진행도 + 현재 지역
- 하단 중앙: WASD / DASH / JUMP 키가이드
- 키 입력 시 **키 하이라이트** 애니메이션

### FX 시스템
- **HeartFX** — idle 5초 후 하트 파티클이 위로 천천히 떠오름
  - 4색 랜덤, bezier heart shape, billboard lookAt
  - fade in 0–20% · hold · fade out 60–100%
- **CollectFX** — 아이템 수집 시 색깔 반짝임
- **RegionUnlockFX** — 새 지역 언락 시 오버레이

### 사운드 트리거
- 이동: `playFootstep` (속도별 간격 0.18s / 0.38s)
- 대시 시작: `playDashWhoosh`
- 점프: `playJump`
- idle 5초: `startPurring` loop

---

## 해결된 버그 — 3회차 12건

| # | 영역 | 이슈 | 핵심 해결 |
|---|------|------|----------|
| 1 | 월드 | 도로에 건물이 막힘 | 도로 셀 스킵 `&&` → `||` |
| 2 | 에셋 | 벤치 너무 작음 | GLTF 스케일 0.9 → 2.2 |
| 3 | 물리 | 고양이가 건물 관통 | 충돌 레지스트리 + 슬라이딩 |
| 4 | 월드 | 경계 근처 아이템 접근 불가 (1차) | 스폰 반경 0.8 → 0.55 |
| 5 | 에셋 | 가로등 작고 비대칭 | 스케일 1.8 → 5.0, 대칭형 폴백 |
| 6 | 에셋 | 코인이 눕혀서 회전 | `rotation.x = π/2` + 토러스 제거 |
| 7 | 에셋 | 나무 너무 작음 | 스케일 2.5 → 4.0 |
| 8 | 렌더 | 고양이 시야 방해 | 카메라→고양이 레이캐스트 투명화 |
| 9 | 월드 | 가로등이 도로에 스폰 | 도로 밴드 ±7 유닛 스킵 |
| 10 | 월드 | 잠긴 지역 아이템 스폰 (근본) | 중심 `(cx+0.5)*CHUNK_SIZE` |
| 11 | 비주얼 | 도로/지형 단순 | RoadGrid 재작성 + 지형 셰이더 |
| 12 | 렌더 | Z-fighting | Y 레이어 분리 + polygonOffset |

---

## 추가 개선 (v2 후반)

- **바닥 깜빡임** — `main.ts`의 중복 300×300 글로벌 바닥 제거로 전 영역 Z-fighting 해소
- **빌딩 머티리얼 공유 버그** — `AssetManager.clone()`에서 머티리얼 깊은 복제 → 멀리 있는 같은 타입 빌딩이 함께 투명해지던 현상 해결
- **도로 overlap 제거** — NS 도로를 EW 도로와 겹치지 않게 두 토막으로 분할, 인도도 모서리 포함 2×2 토막 재배치

---

## 아키텍처 요약

```
main.ts  (게임 루프)
 ├─ Character / Controller / ThirdPersonCamera
 ├─ ChunkManager ─ ChunkGenerator ─ ChunkMeshFactory
 │                                 ├─ RoadGrid
 │                                 ├─ Buildings  ┐
 │                                 ├─ Props      ┼ AssetManager (GLB + 폴백)
 │                                 └─ Items      ┘
 ├─ Terrain / BuildingColliders
 ├─ ItemSystem / ProgressSystem / RegionManager
 ├─ SaveSystem (localStorage + schema v2)
 ├─ SoundSystem (Web Audio)
 ├─ HUD / ControlsHUD / RegionUnlockFX
 ├─ CollectFX / HeartFX / SkySystem
 └─ WORLD_SEED (결정적 월드)
```

**결정적 생성** — 같은 seed는 항상 같은 월드 (플레이어 간 공유 가능성 확보)

---

## 테스트 / 검증

**65개 유닛 테스트 전부 통과**

- `SaveSystem.test.ts` (7) — 세이브 로드/버전 마이그레이션
- `RegionManager.test.ts` (15) — 지역 언락 조건
- `ProgressSystem.test.ts` (12) — 레벨/임계값
- `ItemSystem.test.ts` (9) — 아이템 수집 판정
- `ChunkGenerator.test.ts` (4) — 결정적 생성
- `noise.test.ts` (6) — 시드 노이즈 안정성
- `pool.test.ts` (5) — 오브젝트 풀링
- `chunkWorker.test.ts` (2) — 워커 메시지
- `Controller.test.ts` (5) — 입력 매핑

---

## 다음 단계 (로드맵)

### 플레이 경험
- 일기/퀘스트 시스템 (마을 NPC 고양이와 대화)
- 날씨·시간 (밤/낮 셰이더 · 비/눈 파티클)
- 의상/액세서리 커스터마이즈 (세이브 연계)

### 기술
- **빌드 코드스플리팅** — 현재 672KB 단일 번들 → dynamic import로 청크화
- **압축된 텍스처** (KTX2/Basis) — colormap.png 용량 감소
- **모바일 터치 컨트롤** — 가상 조이스틱

### 콘텐츠
- 지역 5~8개로 확장 + 랜드마크
- 스테이지별 고유 건물 타입 팔레트
- 계절감 BGM (지역별 오프셋)

---

<!-- _class: lead -->
<!-- _paginate: false -->

# 감사합니다 🐾

**GitHub**: github.com/3uxeca/walk-nyang
**Tech**: TypeScript · Three.js · Vite · Web Audio
**Assets**: Kenney (CC0) · Freesound (CC0) · Quaternius (CC0)

<br>

*"가만히 멈춰서 고양이를 지켜보기만 해도 행복해요"*
