import { DEFAULT_NICKNAME } from '../game/SaveSystem'

const NAME_MODAL_STYLE_ID = 'walk3d-cat-name-modal-style'

function injectStyles() {
  if (document.getElementById(NAME_MODAL_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = NAME_MODAL_STYLE_ID
  s.textContent = `
    @keyframes w3d-cnm-card-up {
      from { opacity: 0; transform: translateY(100%); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .w3d-cnm-backdrop {
      position: fixed; inset: 0;
      background: transparent;
      z-index: 9600;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 0;
      font-family: 'Jua', 'Nunito', 'Apple SD Gothic Neo', sans-serif;
      pointer-events: auto;
    }
    .w3d-cnm-card {
      background: linear-gradient(180deg, #fff8ee 0%, #ffe6cf 100%);
      border-radius: 22px 22px 0 0;
      padding: 22px 20px 24px;
      padding-bottom: max(24px, env(safe-area-inset-bottom));
      max-width: 480px;
      width: 100%;
      box-shadow: 0 -8px 28px rgba(120,70,30,0.28);
      text-align: center;
      animation: w3d-cnm-card-up 0.28s cubic-bezier(.34,1.56,.64,1) both;
    }
    .w3d-cnm-card-wrap {
      position: relative;
      width: 100%;
      max-width: 480px;
    }
    .w3d-cnm-title {
      color: #4a2c1a;
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 16px;
    }
    .w3d-cnm-close-btn {
      position: absolute;
      top: 12px;
      right: 14px;
      background: none;
      border: none;
      font-size: 20px;
      color: #7c5c3a;
      cursor: pointer;
      padding: 4px 8px;
      touch-action: manipulation;
      line-height: 1;
    }
    .w3d-cnm-input {
      width: 100%;
      box-sizing: border-box;
      font-size: 18px;
      font-family: inherit;
      font-weight: 700;
      color: #4a2c1a;
      background: rgba(255,255,255,0.7);
      border: 2px solid #FF8C42;
      border-radius: 12px;
      padding: 10px 14px;
      text-align: center;
      outline: none;
      margin-bottom: 16px;
    }
    .w3d-cnm-input:focus {
      border-color: #e07030;
      background: rgba(255,255,255,0.95);
    }
    .w3d-cnm-btn-row {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    .w3d-cnm-btn {
      flex: 1;
      max-width: 160px;
      padding: 10px 0;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 800;
      font-family: inherit;
      cursor: pointer;
      touch-action: manipulation;
      transition: background 0.08s ease, transform 0.08s ease;
    }
    .w3d-cnm-btn:active {
      transform: scale(0.95);
    }
    .w3d-cnm-btn--save {
      background: #FF8C42;
      color: #fff;
    }
    .w3d-cnm-btn--save:hover {
      background: #e07030;
    }
    .w3d-cnm-btn--cancel {
      background: rgba(122,74,42,0.12);
      color: #7c5c3a;
    }
    .w3d-cnm-btn--cancel:hover {
      background: rgba(122,74,42,0.2);
    }
  `
  document.head.appendChild(s)
}

/**
 * 고양이 닉네임 편집 모달.
 * backdrop 클릭 / ESC / ✕ / 취소 버튼으로 닫힘. 저장은 trim 1~12자만 허용.
 * CatColorModal과 동일한 오버레이·입력 게이트 패턴.
 */
export class CatNameModal {
  private el: HTMLDivElement | null = null
  private onKeyDown: (e: KeyboardEvent) => void = () => {}
  private _onClose: (() => void) | undefined = undefined

  open(currentName: string, onSave: (name: string) => void, onClose?: () => void): void {
    if (this.el) return
    this._onClose = onClose

    injectStyles()

    const backdrop = document.createElement('div')
    backdrop.className = 'w3d-cnm-backdrop'
    backdrop.setAttribute('role', 'dialog')
    backdrop.setAttribute('aria-modal', 'true')
    backdrop.setAttribute('aria-label', '고양이 이름 편집')

    const cardWrap = document.createElement('div')
    cardWrap.className = 'w3d-cnm-card-wrap'

    const card = document.createElement('div')
    card.className = 'w3d-cnm-card'

    const title = document.createElement('p')
    title.className = 'w3d-cnm-title'
    title.textContent = '🐱 고양이 이름'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'w3d-cnm-close-btn'
    closeBtn.type = 'button'
    closeBtn.textContent = '✕'
    closeBtn.setAttribute('aria-label', '닫기')
    closeBtn.addEventListener('click', () => this.close())

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'w3d-cnm-input'
    input.maxLength = 12
    input.placeholder = DEFAULT_NICKNAME
    input.value = currentName
    // 모달 안 input 클릭이 backdrop으로 버블링되지 않게
    input.addEventListener('click', (e) => e.stopPropagation())

    const btnRow = document.createElement('div')
    btnRow.className = 'w3d-cnm-btn-row'

    const saveBtn = document.createElement('button')
    saveBtn.type = 'button'
    saveBtn.className = 'w3d-cnm-btn w3d-cnm-btn--save'
    saveBtn.textContent = '저장'
    saveBtn.addEventListener('click', () => {
      const trimmed = input.value.trim()
      if (trimmed.length >= 1 && trimmed.length <= 12) {
        onSave(trimmed)
        this.close()
      }
    })

    const cancelBtn = document.createElement('button')
    cancelBtn.type = 'button'
    cancelBtn.className = 'w3d-cnm-btn w3d-cnm-btn--cancel'
    cancelBtn.textContent = '취소'
    cancelBtn.addEventListener('click', () => this.close())

    btnRow.append(saveBtn, cancelBtn)
    card.append(title, input, btnRow)
    cardWrap.append(card, closeBtn)
    backdrop.appendChild(cardWrap)

    // backdrop 클릭 (카드 바깥) → 닫기
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close()
    })

    // Enter 키로 저장 편의 제공
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn.click()
    })

    document.body.appendChild(backdrop)
    this.el = backdrop

    this.onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.close()
    }
    window.addEventListener('keydown', this.onKeyDown)

    // 열리자마자 input에 포커스
    requestAnimationFrame(() => input.focus())
  }

  close(): void {
    if (!this.el) return
    window.removeEventListener('keydown', this.onKeyDown)
    this.el.remove()
    this.el = null
    const cb = this._onClose
    this._onClose = undefined
    cb?.()
  }

  isOpen(): boolean {
    return this.el !== null
  }

  dispose(): void {
    this.close()
  }
}
