// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { HUD } from './HUD'
import { DEFAULT_NICKNAME } from '../game/SaveSystem'

describe('HUD', () => {
  let hud: HUD

  afterEach(() => {
    hud?.dispose()
    // clean up injected style
    document.getElementById('walk3d-hud-style')?.remove()
  })

  describe('닉네임 표시', () => {
    it('update()에 nickname 전달 시 DOM에 표시됨', () => {
      hud = new HUD()
      hud.update(5, 20, '풀숲마을', '🌿', '🌹', '산책냥이')
      const el = document.body.querySelector('.w3d-hud-nickname') as HTMLSpanElement
      expect(el.textContent).toBe('산책냥이')
    })

    it('nickname이 빈 문자열이면 DEFAULT_NICKNAME으로 폴백', () => {
      hud = new HUD()
      hud.update(0, 20, '풀숲마을', undefined, undefined, '')
      const el = document.body.querySelector('.w3d-hud-nickname') as HTMLSpanElement
      expect(el.textContent).toBe(DEFAULT_NICKNAME)
    })

    it('nickname 미전달 시 DEFAULT_NICKNAME으로 폴백', () => {
      hud = new HUD()
      hud.update(0, 20, '풀숲마을')
      const el = document.body.querySelector('.w3d-hud-nickname') as HTMLSpanElement
      expect(el.textContent).toBe(DEFAULT_NICKNAME)
    })

    it('초기 생성 시 닉네임 DEFAULT_NICKNAME으로 초기화', () => {
      hud = new HUD()
      const el = document.body.querySelector('.w3d-hud-nickname') as HTMLSpanElement
      expect(el.textContent).toBe(DEFAULT_NICKNAME)
    })
  })

  describe('특산품 카운트 표시', () => {
    it('specialtyCount와 specialtyThreshold 둘 다 유효하면 n/T 표시', () => {
      hud = new HUD()
      hud.update(5, 20, '풀숲마을', '🌿', '🌹', '냥냥이', 2, 3)
      const el = document.body.querySelector('.w3d-hud-specialty-count') as HTMLSpanElement
      expect(el.textContent).toBe('2/3')
    })

    it('specialtyCount가 undefined이면 카운트 미표시', () => {
      hud = new HUD()
      hud.update(5, 20, '풀숲마을', '🌿', '🌹', '냥냥이', undefined, 3)
      const el = document.body.querySelector('.w3d-hud-specialty-count') as HTMLSpanElement
      expect(el.textContent).toBe('')
    })

    it('specialtyThreshold가 0이면 카운트 미표시', () => {
      hud = new HUD()
      hud.update(5, 20, '풀숲마을', '🌿', '🌹', '냥냥이', 1, 0)
      const el = document.body.querySelector('.w3d-hud-specialty-count') as HTMLSpanElement
      expect(el.textContent).toBe('')
    })

    it('specialtyThreshold가 undefined이면 카운트 미표시', () => {
      hud = new HUD()
      hud.update(5, 20, '풀숲마을', '🌿', '🌹', '냥냥이', 2, undefined)
      const el = document.body.querySelector('.w3d-hud-specialty-count') as HTMLSpanElement
      expect(el.textContent).toBe('')
    })

    it('specialtyCount 0/3은 정상 표시', () => {
      hud = new HUD()
      hud.update(0, 20, '풀숲마을', '🌿', '🌹', '냥냥이', 0, 3)
      const el = document.body.querySelector('.w3d-hud-specialty-count') as HTMLSpanElement
      expect(el.textContent).toBe('0/3')
    })
  })

  describe('편집 버튼 콜백', () => {
    it('✏️ 클릭 시 onEditNickname 콜백 호출', () => {
      const onEditNickname = vi.fn()
      hud = new HUD({ onEditNickname })
      const btn = document.body.querySelector('.w3d-hud-edit-btn') as HTMLButtonElement
      btn.click()
      expect(onEditNickname).toHaveBeenCalledOnce()
    })

    it('onEditNickname 없으면 클릭해도 오류 없음', () => {
      hud = new HUD()
      const btn = document.body.querySelector('.w3d-hud-edit-btn') as HTMLButtonElement
      expect(() => btn.click()).not.toThrow()
    })
  })
})
