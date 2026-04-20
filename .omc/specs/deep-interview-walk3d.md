# Deep Interview Spec: Walk3D - 귀여운 3D 마을 탐험 게임

## Metadata
- Interview ID: walk3d-001
- Rounds: 6
- Final Ambiguity Score: 18%
- Type: greenfield
- Generated: 2026-04-17
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| 차원 | 점수 | 가중치 | 가중값 |
|------|------|--------|--------|
| Goal Clarity | 0.85 | 40% | 0.34 |
| Constraint Clarity | 0.80 | 30% | 0.24 |
| Success Criteria | 0.80 | 30% | 0.24 |
| **총 명확도** | | | **0.82** |
| **모호도** | | | **18%** |

## Goal
플레이어는 귀여운 low-poly chibi 3D 캐릭터를 WASD로 조작하여 절차적으로 생성된 3D 마을을 탐험하고, 마을 곳곳에 흩어진 **아이템을 수집**하여 **새로운 마을 지역(Region)을 해제**하는 게임이다. 저장 시스템(localStorage)으로 진행도가 유지되며, 귀여운 비주얼(MeshToonMaterial + 파스텔 팔레트)이 핵심 심미적 가치다.

## 핵심 게임 루프
```
아이템 수집 → 레벨/진행도 축적 → 새 마을 지역(Region) 해제 → 새 지역 탐험 → 아이템 수집 ...
```

## 기능 범위

### V1 (필수 - 이것 없으면 미완성)
- WASD 이동 + 3인칭 카메라
- Low-poly chibi 캐릭터 (코드 생성)
- 마을 곳곳에 흩어진 아이템 픽업 (가까이 가면 자동 수집)
- 수집 카운터 UI (현재 N개 / 다음 레벨까지 M개)
- 레벨 업 시 새로운 마을 지역(Region) 해제
- localStorage 저장/불러오기 (수집 아이템 수, 해제된 지역)
- 절차적 마을 생성 (청크 시스템 + Simplex noise)

### V2 (보너스 - 이후 추가)
- 캐릭터 커스터마이징 (아이템 수집으로 의상/색상 변경)
- 장소 도장깨기 (특별 건물 방문 기록)
- 숨겨진 비밀 발견 (이스터에그, 비밀 통로)

### Out of Scope (명시적 제외)
- 멀티플레이어/소셜 기능
- 모바일 지원 (v1)
- 백엔드/서버 저장 (localStorage면 충분)
- 적/전투 시스템
- NPC AI

## Constraints
- 브라우저에서 URL만으로 접속 (설치 없음)
- 저장: localStorage (서버 불필요)
- 60fps 목표 (데스크톱 Chrome)
- 외부 3D 에셋 없음 (코드로 생성)
- 단일 플레이어

## Acceptance Criteria
- [ ] WASD로 캐릭터를 자유롭게 이동할 수 있다
- [ ] 마을 곳곳에 아이템이 배치되어 있고, 캐릭터가 가까이 가면 수집된다
- [ ] 수집한 아이템 개수가 화면에 표시된다 (예: "별 ★ 7 / 20")
- [ ] 목표 개수 달성 시 새로운 마을 지역이 해제되며 시각적 피드백이 나타난다
- [ ] 브라우저를 닫았다가 다시 열면 이전 진행도가 복원된다
- [ ] 캐릭터가 귀엽다 (designer 에이전트 비주얼 게이트 통과)
- [ ] 마을이 절차적으로 생성되어 걷다 보면 새로운 건물/풍경이 계속 나온다
- [ ] 60fps 유지 (Chrome DevTools 기준 평균 55fps 이상)

## Assumptions Exposed & Resolved
| 가정 | 질문 | 결정 |
|------|------|------|
| 걷기 자체가 목적 | "무엇을 '하는' 건가요?" | 수집/탐험 요소 포함으로 결정 |
| 모든 수집 요소가 동등함 | "무엇이 핵심인가요?" | 아이템 픽업이 핵심, 나머지는 보너스 |
| 레벨업 = 숫자만 증가 | "레벨업 시 무슨 일이?" | 새 마을 지역 해제로 결정 |
| 세션 간 저장 불필요 | "저장이 필요한가요?" | 필수 (localStorage) |
| 무한 월드 = 단순 탐험 | "어디서 성취감을 느끼나요?" | 지역 해제 진행도가 성취감 |

## Technical Context (Greenfield)
- **3D 엔진:** Three.js r170+ + Vite + TypeScript
- **테스트:** Vitest
- **저장:** localStorage (JSON 직렬화)
- **절차적 생성:** simplex-noise 패키지
- **캐릭터 스타일:** Low-poly chibi (Box/Sphere/Cylinder 조합, MeshToonMaterial)
- **성능:** Web Worker로 청크 생성 (메인 스레드 블로킹 방지)

## Ontology (Key Entities)
| 엔티티 | 타입 | 주요 속성 | 관계 |
|--------|------|----------|------|
| Player | core domain | position, direction, level, inventory | Player collects Items, Player unlocks Regions |
| Item | core domain | type, position, chunkId, isCollected | Items belong to Chunks |
| Region | core domain | id, theme, unlockRequirement, isUnlocked | Region contains Chunks |
| Chunk | core domain | cx, cz, regionId, buildings, items | Chunks belong to Regions |
| SaveData | technical | items_collected, unlocked_regions, player_position | SaveData persists Player progress |
| Building | supporting | type, position, size | Buildings are placed in Chunks |
| Character | supporting | mesh, animState | Character represents Player visually |
| CharacterCosmetic | supporting (v2) | hat, color, outfit | CharacterCosmetic is unlocked by collecting Items |

## Ontology Convergence
| 라운드 | 엔티티 수 | 신규 | 변경 | 안정 | 안정도 |
|--------|-----------|------|------|------|--------|
| 1 | 3 | 3 | - | - | N/A |
| 2 | 5 | 2 | 1 | 2 | 60% |
| 3 | 5 | 0 | 0 | 5 | 100% |
| 4 | 7 | 2 | 0 | 5 | 71% |
| 5 | 8 | 1 | 0 | 7 | 88% |
| 6 | 9 | 1 | 0 | 8 | 89% |

## Interview Transcript
<details>
<summary>전체 Q&A (6라운드)</summary>

### Round 1
**Q:** 플레이어는 이 게임에서 무엇을 '하는' 건가요?
**A:** 수집/탐험 요소 포함
**모호도:** 78% (Goal: 0.40, Constraints: 0.10, Criteria: 0.10)

### Round 2
**Q:** 마을을 탐험하면서 '무언가를 발견하거나 수집'한다고 하셨는데, 그 '무언가'는 어떤 형태인가요?
**A:** 1, 2, 3 다 있으면 좋겠어 (아이템 픽업 + 장소 도장깨기 + 숨겨진 비밀)
**모호도:** 70% (Goal: 0.60, Constraints: 0.10, Criteria: 0.10)

### Round 3
**Q:** 3가지 중 어느 것이 반드시 있어야 '이 게임이다'라고 할 수 있나요?
**A:** 아이템 픽업
**모호도:** 56% (Goal: 0.70, Constraints: 0.40, Criteria: 0.15)

### Round 4 [Contrarian]
**Q:** 만약 수집해야 할 아이템이 없다면, 순수한 개수 누적만으로 충분한가요?
**A:** 레벨/단계 시스템 먼저, 그 다음 캐릭터 커스터마이징
**모호도:** 37% (Goal: 0.75, Constraints: 0.55, Criteria: 0.55)

### Round 5
**Q:** '레벨 업'할 때 구체적으로 어떤 일이 일어나나요?
**A:** 새 마을 지역 해제
**모호도:** 26% (Goal: 0.85, Constraints: 0.70, Criteria: 0.65)

### Round 6 [Simplifier]
**Q:** 브라우저를 닫고 다시 열면 진행도가 유지되어야 하나요?
**A:** 필수: 저장 있어야 함 (localStorage 또는 백엔드)
**모호도:** 18% (Goal: 0.85, Constraints: 0.80, Criteria: 0.80)

</details>
