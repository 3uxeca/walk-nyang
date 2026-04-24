const MODAL_STYLE_ID = 'walk3d-modal-style'

function injectStyles() {
  if (document.getElementById(MODAL_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = MODAL_STYLE_ID
  s.textContent = `
    @keyframes w3d-modal-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes w3d-modal-card-in {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    .w3d-modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(48, 32, 24, 0.55);
      z-index: 9500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: w3d-modal-fade-in 0.2s ease both;
      font-family: 'Jua', 'Nunito', 'Apple SD Gothic Neo', sans-serif;
    }
    .w3d-modal-card {
      background: linear-gradient(180deg, #fff8ee 0%, #ffe6cf 100%);
      border-radius: 22px;
      padding: 32px 28px 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 18px 40px rgba(120,70,30,0.25);
      text-align: center;
      animation: w3d-modal-card-in 0.26s cubic-bezier(.34,1.56,.64,1) both;
    }
    .w3d-modal-emoji {
      display: block;
      font-size: 48px;
      line-height: 1;
      margin-bottom: 10px;
    }
    .w3d-modal-msg {
      color: #4a2c1a;
      font-size: 18px;
      line-height: 1.55;
      margin: 0 0 22px;
      white-space: pre-line;
    }
    .w3d-modal-close {
      padding: 12px 36px;
      border: none;
      border-radius: 999px;
      background: #FF8C42;
      color: #fff;
      font-size: 16px;
      font-weight: 800;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(255,140,66,0.3);
      transition: transform 0.08s ease;
      touch-action: manipulation;
    }
    .w3d-modal-close:active { transform: scale(0.95); }

    @media (max-width: 480px) {
      .w3d-modal-card { padding: 24px 20px 20px; }
      .w3d-modal-emoji { font-size: 40px; }
      .w3d-modal-msg { font-size: 16px; }
    }
  `
  document.head.appendChild(s)
}

/**
 * 튜토리얼 안내 모달. backdrop 클릭 / ESC / 닫기 버튼 중 어느 것으로도 닫힘.
 * 동일 인스턴스를 재-open 가능 (HelpButton에서 여러 번 눌림).
 */
export class TutorialModal {
  private el: HTMLDivElement | null = null
  private message: string
  private emoji: string
  private onKeyDown: (e: KeyboardEvent) => void

  constructor(message: string, emoji: string = '🐈') {
    injectStyles()
    this.message = message
    this.emoji = emoji
    this.onKeyDown = (e) => {
      if (e.key === 'Escape') this.close()
    }
  }

  open(): void {
    if (this.el) return

    const backdrop = document.createElement('div')
    backdrop.className = 'w3d-modal-backdrop'
    backdrop.setAttribute('role', 'dialog')
    backdrop.setAttribute('aria-modal', 'true')

    const card = document.createElement('div')
    card.className = 'w3d-modal-card'

    const emo = document.createElement('span')
    emo.className = 'w3d-modal-emoji'
    emo.textContent = this.emoji

    const msg = document.createElement('p')
    msg.className = 'w3d-modal-msg'
    msg.textContent = this.message

    const closeBtn = document.createElement('button')
    closeBtn.className = 'w3d-modal-close'
    closeBtn.type = 'button'
    closeBtn.textContent = '알겠어요'
    closeBtn.addEventListener('click', () => this.close())

    card.append(emo, msg, closeBtn)
    backdrop.appendChild(card)

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close()
    })

    document.body.appendChild(backdrop)
    this.el = backdrop
    window.addEventListener('keydown', this.onKeyDown)
  }

  close(): void {
    if (!this.el) return
    window.removeEventListener('keydown', this.onKeyDown)
    this.el.remove()
    this.el = null
  }

  /** 멱등. 열려있으면 닫고 리스너 해제. */
  dispose(): void {
    this.close()
  }
}
