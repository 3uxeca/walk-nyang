// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CatColorModal, CAT_COLOR_PRESETS } from './CatColorModal'

function getBackdrop(): HTMLElement | null {
  return document.querySelector('.w3d-ccm-backdrop')
}

describe('CatColorModal', () => {
  let modal: CatColorModal

  beforeEach(() => {
    modal = new CatColorModal()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    modal.close()
    document.body.innerHTML = ''
  })

  // ── open / close DOM ──────────────────────────────────────────────────────

  it('open() — backdrop가 DOM에 추가됨', () => {
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    expect(getBackdrop()).not.toBeNull()
  })

  it('close() — backdrop가 DOM에서 제거됨', () => {
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    modal.close()
    expect(getBackdrop()).toBeNull()
  })

  it('isOpen() — open 전 false, open 후 true, close 후 false', () => {
    expect(modal.isOpen()).toBe(false)
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    expect(modal.isOpen()).toBe(true)
    modal.close()
    expect(modal.isOpen()).toBe(false)
  })

  it('이미 열린 상태에서 open() 재호출 시 backdrop 중복 생성 안 됨', () => {
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    expect(document.querySelectorAll('.w3d-ccm-backdrop').length).toBe(1)
  })

  // ── 프리셋 그리드 ─────────────────────────────────────────────────────────

  it('프리셋 8개 swatch가 그리드에 렌더됨', () => {
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    const swatches = document.querySelectorAll('.w3d-ccm-swatch')
    expect(swatches.length).toBe(CAT_COLOR_PRESETS.length)
  })

  it('initialHex에 해당하는 swatch가 selected 클래스를 가짐', () => {
    modal.open({ initialHex: '#7a4a2a', onSelect: vi.fn() })
    const selected = document.querySelectorAll('.w3d-ccm-swatch--selected')
    expect(selected.length).toBe(1)
    expect((selected[0] as HTMLElement).getAttribute('aria-label')).toBe('코코아')
  })

  it('선택된 swatch에 체크 마크(✓)가 표시됨', () => {
    modal.open({ initialHex: '#7a4a2a', onSelect: vi.fn() })
    const check = document.querySelector('.w3d-ccm-check')
    expect(check?.textContent).toBe('✓')
  })

  // ── onSelect 콜백 ─────────────────────────────────────────────────────────

  it('swatch 클릭 시 onSelect가 hex + name 인자로 호출됨', () => {
    const onSelect = vi.fn()
    modal.open({ initialHex: '#ff8c32', onSelect })

    const swatches = document.querySelectorAll<HTMLElement>('.w3d-ccm-swatch')
    // 코코아 = index 2
    swatches[2].click()

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('#7a4a2a', '코코아')
  })

  it('swatch 클릭 후 모달이 자동으로 닫힘', () => {
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    const swatches = document.querySelectorAll<HTMLElement>('.w3d-ccm-swatch')
    swatches[0].click()
    expect(modal.isOpen()).toBe(false)
  })

  // ── 닫기 트리거 3종 ───────────────────────────────────────────────────────

  it('ESC 키로 close 트리거됨', () => {
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(modal.isOpen()).toBe(false)
    expect(getBackdrop()).toBeNull()
  })

  it('backdrop(외부) 클릭으로 close 트리거됨', () => {
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    const backdrop = getBackdrop()!
    // target === backdrop 조건을 만족시키기 위해 backdrop 자신에서 이벤트 디스패치
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(modal.isOpen()).toBe(false)
  })

  it('닫기 버튼(✕) 클릭으로 close 트리거됨', () => {
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    const closeBtn = document.querySelector<HTMLElement>('.w3d-ccm-close-btn')!
    closeBtn.click()
    expect(modal.isOpen()).toBe(false)
    expect(getBackdrop()).toBeNull()
  })

  // ── onClose 콜백 ──────────────────────────────────────────────────────────

  it('닫기 버튼 클릭 시 onClose 콜백 호출됨', () => {
    const onClose = vi.fn()
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn(), onClose })
    const closeBtn = document.querySelector<HTMLElement>('.w3d-ccm-close-btn')!
    closeBtn.click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ESC 키 닫기 시 onClose 콜백 호출됨', () => {
    const onClose = vi.fn()
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn(), onClose })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ── 리스너 해제 회귀 가드 ─────────────────────────────────────────────────

  it('close 후 추가 ESC 입력이 onClose를 두 번 호출하지 않음', () => {
    const onClose = vi.fn()
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn(), onClose })
    // 첫 번째 ESC — 닫힘
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    // 두 번째 ESC — 리스너가 해제되어 있으므로 onClose 추가 호출 없음
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // ── 키보드 활성화 (MEDIUM-1) ──────────────────────────────────────────────

  it('swatch에서 Enter 키 → onSelect 호출됨', () => {
    const onSelect = vi.fn()
    modal.open({ initialHex: '#ff8c32', onSelect })

    const swatches = document.querySelectorAll<HTMLElement>('.w3d-ccm-swatch')
    // 코코아 = index 2
    swatches[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('#7a4a2a', '코코아')
  })

  it('swatch에서 Space 키 → onSelect 호출됨', () => {
    const onSelect = vi.fn()
    modal.open({ initialHex: '#ff8c32', onSelect })

    const swatches = document.querySelectorAll<HTMLElement>('.w3d-ccm-swatch')
    swatches[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('#ff8c32', '오렌지')
  })

  // ── z-index / 구조 ────────────────────────────────────────────────────────

  it('backdrop에 z-index 9600 스타일이 주입됨', () => {
    modal.open({ initialHex: '#ff8c32', onSelect: vi.fn() })
    const styleEl = document.getElementById('walk3d-cat-color-modal-style')
    expect(styleEl?.textContent).toContain('z-index: 9600')
  })
})
