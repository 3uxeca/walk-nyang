// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CatNameModal } from './CatNameModal'
import { DEFAULT_NICKNAME } from '../game/SaveSystem'

describe('CatNameModal', () => {
  let modal: CatNameModal

  beforeEach(() => {
    modal = new CatNameModal()
  })

  afterEach(() => {
    modal.dispose()
    document.getElementById('walk3d-cat-name-modal-style')?.remove()
  })

  describe('열림/닫힘', () => {
    it('open() 호출 시 backdrop이 DOM에 추가되고 isOpen() true', () => {
      modal.open('산책냥', vi.fn())
      expect(document.body.querySelector('.w3d-cnm-backdrop')).not.toBeNull()
      expect(modal.isOpen()).toBe(true)
    })

    it('close() 호출 시 backdrop이 DOM에서 제거되고 isOpen() false', () => {
      modal.open('산책냥', vi.fn())
      modal.close()
      expect(document.body.querySelector('.w3d-cnm-backdrop')).toBeNull()
      expect(modal.isOpen()).toBe(false)
    })

    it('ESC 키 누르면 모달 닫힘', () => {
      modal.open('산책냥', vi.fn())
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(modal.isOpen()).toBe(false)
    })

    it('backdrop 직접 클릭 시 닫힘', () => {
      modal.open('산책냥', vi.fn())
      const backdrop = document.body.querySelector('.w3d-cnm-backdrop') as HTMLElement
      backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(modal.isOpen()).toBe(false)
    })

    it('취소 버튼 클릭 시 닫힘', () => {
      modal.open('산책냥', vi.fn())
      const cancelBtn = document.body.querySelector('.w3d-cnm-btn--cancel') as HTMLButtonElement
      cancelBtn.click()
      expect(modal.isOpen()).toBe(false)
    })

    it('✕ 버튼 클릭 시 닫힘', () => {
      modal.open('산책냥', vi.fn())
      const closeBtn = document.body.querySelector('.w3d-cnm-close-btn') as HTMLButtonElement
      closeBtn.click()
      expect(modal.isOpen()).toBe(false)
    })

    it('이미 열려있으면 중복 open() 무시', () => {
      modal.open('산책냥', vi.fn())
      modal.open('다른이름', vi.fn())
      const backdrops = document.body.querySelectorAll('.w3d-cnm-backdrop')
      expect(backdrops.length).toBe(1)
    })

    it('dispose() 호출 시 닫힘', () => {
      modal.open('산책냥', vi.fn())
      modal.dispose()
      expect(modal.isOpen()).toBe(false)
    })
  })

  describe('저장 검증', () => {
    it('1~12자 trim 후 → onSave 호출', () => {
      const onSave = vi.fn()
      modal.open('산책냥', onSave)
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      input.value = '냥이'
      const saveBtn = document.body.querySelector('.w3d-cnm-btn--save') as HTMLButtonElement
      saveBtn.click()
      expect(onSave).toHaveBeenCalledWith('냥이')
      expect(onSave).toHaveBeenCalledOnce()
    })

    it('저장 후 모달 닫힘', () => {
      const onSave = vi.fn()
      modal.open('산책냥', onSave)
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      input.value = '냥이'
      const saveBtn = document.body.querySelector('.w3d-cnm-btn--save') as HTMLButtonElement
      saveBtn.click()
      expect(modal.isOpen()).toBe(false)
    })

    it('빈 문자열 → onSave 미호출', () => {
      const onSave = vi.fn()
      modal.open('산책냥', onSave)
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      input.value = ''
      const saveBtn = document.body.querySelector('.w3d-cnm-btn--save') as HTMLButtonElement
      saveBtn.click()
      expect(onSave).not.toHaveBeenCalled()
    })

    it('공백만 입력 → trim 후 빈 문자열이므로 onSave 미호출', () => {
      const onSave = vi.fn()
      modal.open('산책냥', onSave)
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      input.value = '   '
      const saveBtn = document.body.querySelector('.w3d-cnm-btn--save') as HTMLButtonElement
      saveBtn.click()
      expect(onSave).not.toHaveBeenCalled()
    })

    it('12자 정확히 → onSave 호출', () => {
      const onSave = vi.fn()
      modal.open('산책냥', onSave)
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      input.value = '가나다라마바사아자차카타'  // 12자
      const saveBtn = document.body.querySelector('.w3d-cnm-btn--save') as HTMLButtonElement
      saveBtn.click()
      expect(onSave).toHaveBeenCalledOnce()
    })

    it('앞뒤 공백 trim 후 저장', () => {
      const onSave = vi.fn()
      modal.open('산책냥', onSave)
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      input.value = '  냥이  '
      const saveBtn = document.body.querySelector('.w3d-cnm-btn--save') as HTMLButtonElement
      saveBtn.click()
      expect(onSave).toHaveBeenCalledWith('냥이')
    })

    it('취소 클릭 시 onSave 미호출', () => {
      const onSave = vi.fn()
      modal.open('산책냥', onSave)
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      input.value = '냥이'
      const cancelBtn = document.body.querySelector('.w3d-cnm-btn--cancel') as HTMLButtonElement
      cancelBtn.click()
      expect(onSave).not.toHaveBeenCalled()
    })

    it('ESC로 닫으면 onSave 미호출', () => {
      const onSave = vi.fn()
      modal.open('산책냥', onSave)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(onSave).not.toHaveBeenCalled()
    })

    it('input placeholder가 DEFAULT_NICKNAME', () => {
      modal.open('산책냥', vi.fn())
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      expect(input.placeholder).toBe(DEFAULT_NICKNAME)
    })

    it('open 시 currentName이 input value에 반영', () => {
      modal.open('나의냥이', vi.fn())
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      expect(input.value).toBe('나의냥이')
    })

    it('13자 이상 → onSave 미호출', () => {
      const onSave = vi.fn()
      modal.open('산책냥', onSave)
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      input.value = '가나다라마바사아자차카타하'  // 13자
      const saveBtn = document.body.querySelector('.w3d-cnm-btn--save') as HTMLButtonElement
      saveBtn.click()
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  describe('onClose 콜백', () => {
    it('ESC로 닫으면 onClose 호출됨', () => {
      const onClose = vi.fn()
      modal.open('산책냥', vi.fn(), onClose)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('배경 클릭으로 닫으면 onClose 호출됨', () => {
      const onClose = vi.fn()
      modal.open('산책냥', vi.fn(), onClose)
      const backdrop = document.body.querySelector('.w3d-cnm-backdrop') as HTMLElement
      backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('취소 버튼으로 닫으면 onClose 호출됨', () => {
      const onClose = vi.fn()
      modal.open('산책냥', vi.fn(), onClose)
      const cancelBtn = document.body.querySelector('.w3d-cnm-btn--cancel') as HTMLButtonElement
      cancelBtn.click()
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('✕ 버튼으로 닫으면 onClose 호출됨', () => {
      const onClose = vi.fn()
      modal.open('산책냥', vi.fn(), onClose)
      const closeBtn = document.body.querySelector('.w3d-cnm-close-btn') as HTMLButtonElement
      closeBtn.click()
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('저장 시에도 onClose 호출됨', () => {
      const onClose = vi.fn()
      modal.open('산책냥', vi.fn(), onClose)
      const input = document.body.querySelector('.w3d-cnm-input') as HTMLInputElement
      input.value = '냥이'
      const saveBtn = document.body.querySelector('.w3d-cnm-btn--save') as HTMLButtonElement
      saveBtn.click()
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('onClose 없이 open해도 close() 에러 없음', () => {
      modal.open('산책냥', vi.fn())
      expect(() => modal.close()).not.toThrow()
    })
  })
})
