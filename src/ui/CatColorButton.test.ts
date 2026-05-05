// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'

// Mock isMobileEnvironment before importing CatColorButton
vi.mock('../character/TouchInputSource', () => ({
  isMobileEnvironment: vi.fn(() => false),
}))

import { isMobileEnvironment } from '../character/TouchInputSource'
import { CatColorButton } from './CatColorButton'

describe('CatColorButton — 위치 자동 분기 (HIGH-1 가드)', () => {
  let btn: CatColorButton

  afterEach(() => {
    btn.dispose()
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('데스크탑 환경에서 bottom-left 클래스가 적용됨', () => {
    vi.mocked(isMobileEnvironment).mockReturnValue(false)
    btn = new CatColorButton({ onClick: vi.fn() })
    const el = document.querySelector('.w3d-cat-color-btn')
    expect(el?.classList.contains('w3d-cat-color-btn--bottom-left')).toBe(true)
    expect(el?.classList.contains('w3d-cat-color-btn--top-right')).toBe(false)
  })

  it('모바일 환경에서 top-right 클래스가 적용됨', () => {
    vi.mocked(isMobileEnvironment).mockReturnValue(true)
    btn = new CatColorButton({ onClick: vi.fn() })
    const el = document.querySelector('.w3d-cat-color-btn')
    expect(el?.classList.contains('w3d-cat-color-btn--top-right')).toBe(true)
    expect(el?.classList.contains('w3d-cat-color-btn--bottom-left')).toBe(false)
  })

  it('aria-haspopup="dialog" 속성이 설정됨 (MEDIUM-7)', () => {
    vi.mocked(isMobileEnvironment).mockReturnValue(false)
    btn = new CatColorButton({ onClick: vi.fn() })
    const el = document.querySelector('.w3d-cat-color-btn')
    expect(el?.getAttribute('aria-haspopup')).toBe('dialog')
  })
})
