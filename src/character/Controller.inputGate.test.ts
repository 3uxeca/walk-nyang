// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { Controller } from './Controller'

describe('Controller.setInputEnabled', () => {
  it('기본값 true', () => {
    const ctrl = new Controller()
    expect(ctrl.inputEnabled).toBe(true)
    ctrl.dispose()
  })

  it('setInputEnabled(false) 즉시 input 초기화', () => {
    const ctrl = new Controller()
    ctrl.input.forward = true
    ctrl.input.dash = true
    ctrl.setInputEnabled(false)
    expect(ctrl.input.forward).toBe(false)
    expect(ctrl.input.dash).toBe(false)
    expect(ctrl.inputEnabled).toBe(false)
    ctrl.dispose()
  })

  it('setInputEnabled(false) → update → 모든 입력 false', () => {
    const ctrl = new Controller()
    ctrl.setInputEnabled(false)
    ctrl.update(0.016)
    expect(ctrl.input.forward).toBe(false)
    expect(ctrl.input.backward).toBe(false)
    expect(ctrl.input.left).toBe(false)
    expect(ctrl.input.right).toBe(false)
    expect(ctrl.input.jump).toBe(false)
    expect(ctrl.input.dash).toBe(false)
    ctrl.dispose()
  })

  it('setInputEnabled(false) → setInputEnabled(true) → 게이트 복구', () => {
    const ctrl = new Controller()
    ctrl.setInputEnabled(false)
    expect(ctrl.inputEnabled).toBe(false)
    ctrl.setInputEnabled(true)
    expect(ctrl.inputEnabled).toBe(true)
    ctrl.dispose()
  })
})
