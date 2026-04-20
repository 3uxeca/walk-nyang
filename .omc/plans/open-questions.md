# Open Questions

## walk3d-village-game - 2026-04-17

- [ ] 캐릭터에 점프 기능을 추가할 것인가? — 스코프와 물리 엔진 필요성에 영향
- [ ] 마우스로 카메라 회전을 지원할 것인가? (마우스 드래그 vs 마우스 이동) — UX 방식 결정 필요
- [ ] 낮/밤 사이클을 포함할 것인가? — Phase 4 작업량과 비주얼 복잡도에 영향
- [ ] NPC(비플레이어 캐릭터)를 배치할 것인가? — 마을의 생동감 vs 구현 복잡도 트레이드오프
- [ ] 배포 대상 플랫폼은? (GitHub Pages, Vercel, Netlify 등) — 빌드 설정과 CI/CD 구성에 영향

## walk3d-village-game (Deep Interview 통합) - 2026-04-17

- [ ] Region 개수와 해제 임계치 구체값 (예: 3개 Region, 0/20/50 아이템) — Phase 3d 착수 시 확정
- [ ] 아이템 타입 구성 (별 1종 vs 별/코인/보석 3종) — 수집 UX와 HUD 표기 방식에 영향
- [ ] 잠긴 Region의 시각 표현 방식 (안개 장벽 / 지면 페이드 / 투명 벽) — Phase 3d/4 designer 협의 필요
- [ ] 자동 저장 주기 및 debounce 정책 (30초 interval + 수집/해제 이벤트 기반) — SaveSystem 구현 전 확정
- [ ] collectedItemIds 저장 방식 (id 리스트 vs Region별 비트셋) — localStorage quota 측정 후 결정
- [ ] 활성 청크 3x3 유지 vs 5x5 확장 — Phase 3c 성능 측정 결과에 따라 결정
- [ ] SaveData 스키마 버전 불일치 시 마이그레이션 vs reset 정책 — 스키마 변경 정책 사전 합의 필요
