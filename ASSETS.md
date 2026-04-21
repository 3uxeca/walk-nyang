# walk3d v2 사용 에셋 정리

이 문서는 walk3d 버전 2에서 사용 중인 외부 리소스를 정리합니다.
모든 에셋의 라이선스 원문은 각 출처 페이지를 참조하세요.

---

## 1. 3D 모델 (`public/models/`)

`*.glb` 포맷의 Kenney / Quaternius 계열 저작권 무료 키트입니다.
디렉토리 구조와 colormap 텍스처 공유 패턴(`Textures/colormap.png`)이 Kenney City Kit 시리즈의 표준 형식과 일치합니다.

| 분류 | 파일 | 추정 출처 | 코드 키 (`AssetManager`) |
|------|------|----------|--------------------------|
| 캐릭터 | `cat/Cat.glb` | Quaternius RPG Animals 또는 유사 무료 캐릭터 팩 | `cat` |
| 건물 (주거) | `town/suburban/house.glb` | Kenney **City Kit (Suburban)** | `building_house` |
| 건물 (주거) | `town/suburban/apartment.glb` | Kenney **City Kit (Suburban)** | `building_apt` |
| 건물 (상업) | `town/commercial/shop.glb` | Kenney **City Kit (Commercial)** | `building_shop` |
| 건물 (상업) | `town/commercial/cafe.glb` | Kenney **City Kit (Commercial)** | `building_cafe` |
| 건물 (상업) | `town/commercial/tower.glb` | Kenney **City Kit (Commercial)** | `building_tower` |
| 소품 | `props/tree.glb` | Kenney **Nature Kit** | `prop_tree` |
| 소품 | `props/flower.glb` | Kenney **Nature Kit** | `prop_flower` |
| 소품 | `props/lamp.glb` | Kenney **City Kit** | `prop_lamp` |
| 소품 | `props/bench.glb` | Kenney **City Kit** | `prop_bench` |
| 소품 | `props/mailbox.glb` | Kenney **City Kit** | `prop_mailbox` |
| 도로 (미사용) | `roads/road_straight.glb`, `roads/road_bend.glb`, `roads/road_cross.glb` | Kenney **Racing Kit** 또는 City Kit | (사용 안 함, 코드는 `RoadGrid.ts`로 절차적 생성) |

### 텍스처
- `town/suburban/Textures/colormap.png`
- `town/commercial/Textures/colormap.png`

각 GLB가 동일 디렉토리의 `colormap.png`를 atlas로 참조합니다.

### 라이선스
- Kenney 에셋: 모두 **CC0 (Public Domain)** — https://kenney.nl/assets
- Quaternius 에셋(추정): **CC0** — https://quaternius.com

> ※ 위 출처는 디렉토리·파일 명명 패턴 기반 추정입니다. 정확한 팩 이름과 다운로드 링크는 커밋한 사람이 가장 잘 알며, 공개 배포 시 README에 정확한 팩명/URL을 명시하길 권장합니다.

### 폴백
모델 로드가 실패하거나 파일이 없으면(`item_star`, `item_coin`, `item_gem` 등) 코드의 절차적 메시 빌더(`Buildings.ts`, `Props.ts`, `ItemSystem.ts`)가 자동으로 동작합니다.

---

## 2. 사운드 (`public/sounds/`)

모두 **Freesound.org**의 **Creative Commons 0 (Public Domain)** 카테고리에서 가져온 파일입니다.

| 파일 | 용도 | 사용 위치 |
|------|------|-----------|
| `meow.wav` | 아이템 수집/상호작용 시 야옹 소리 | `playMeow()` (`SoundSystem.ts`) |
| `purring.ogg` | 5초 이상 가만히 있을 때 그르렁 (loop) | `startPurring()`/`stopPurring()` |
| `footstep.ogg` | 걷기/달리기 발걸음 (피치 랜덤화 + 하이패스) | `playFootstep()` |

### 합성 사운드 (파일 없음)
이 항목들은 Web Audio API로 실시간 합성됩니다.

| 함수 | 설명 |
|------|------|
| `playJump()` | 점프 시 "또잉" 소리 (디튠된 사인파 2개) |
| `playDashWhoosh()` | 대시 시작 시 고양이 흥분 트릴 (sawtooth + 비브라토 LFO + 포먼트 필터) |
| `playMeow()` 폴백 | `meow.wav` 로드 실패 시 sawtooth + 2단 포먼트로 합성된 야옹 |
| `playFootstep()` 폴백 | `footstep.ogg` 없을 때 짧은 사인 톤으로 대체 |

### 라이선스
모든 OGG/WAV 파일은 **CC0** — 출처 표기 의무 없음. 단 공개 배포 시 README에 Freesound 원본 URL 정도는 적어두면 좋습니다.

---

## 3. 라이브러리

| 패키지 | 용도 |
|--------|------|
| `three` | WebGL 렌더링, 씬/카메라/메시 |
| `three/examples/jsm/loaders/GLTFLoader` | GLB 로딩 |
| `three/examples/jsm/utils/SkeletonUtils` | 스킨드 메시(Cat) 클론 |

빌드/테스트:
- `vite` (dev/build)
- `vitest` (테스트)
- `typescript`

---

## 4. 권장 후속 작업

공개 배포 전에는 다음을 실측·기재하세요.

1. 각 `.glb` 파일이 실제로 어느 Kenney 팩(혹은 다른 출처)에서 왔는지 — 다운받은 출처 URL을 기록
2. 각 사운드 파일의 Freesound 원 게시물 ID/URL — CC0라도 출처 표기는 좋은 관습
3. 미사용 `roads/*.glb`는 사용하지 않으면 빌드 사이즈 절감을 위해 제거 검토
