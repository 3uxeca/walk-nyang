const TOAST_STYLE_ID = 'walk3d-toast-style'

function injectStyles() {
  if (document.getElementById(TOAST_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = TOAST_STYLE_ID
  s.textContent = `
    @keyframes w3d-toast-in {
      0%   { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.9); }
      60%  { transform: translateX(-50%) translateY(2px) scale(1.04); }
      100% { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1); }
    }
    @keyframes w3d-toast-out {
      to { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.94); }
    }
    .w3d-toast-generic {
      position: fixed;
      top: 130px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(64, 48, 36, 0.86);
      border: 2px solid rgba(255, 200, 150, 0.55);
      border-radius: 18px;
      padding: 10px 20px;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #fff6e6;
      pointer-events: none;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      z-index: 180;
      white-space: nowrap;
      animation: w3d-toast-in 0.28s cubic-bezier(.34,1.56,.64,1) both;
    }
    /* 긴 메시지(튜토리얼 등) — 좁은 뷰포트 자동 줄바꿈 + 개행(\\n) 실제 줄바꿈 렌더 */
    .w3d-toast-generic.w3d-toast-wrap {
      white-space: pre-line;
      max-width: min(90vw, 420px);
      text-align: center;
      line-height: 1.45;
    }
    .w3d-toast-generic .w3d-toast-emoji {
      display: inline-block;
      margin-right: 6px;
      font-size: 15px;
    }
  `
  document.head.appendChild(s)
}

/**
 * 하단 중앙 안내 토스트. 동일 키로 쓰로틀되어 과도한 스폰을 방지한다.
 */
export class Toast {
  private activeEl: HTMLDivElement | null = null
  private lastShownAt = new Map<string, number>()

  constructor() {
    injectStyles()
  }

  /**
   * @param message 표시할 텍스트
   * @param emoji 앞에 붙을 이모지
   * @param key 쓰로틀 키 (동일 key는 throttleMs 동안 재표시 안 됨)
   * @param throttleMs 동일 키 재표시 최소 간격
   * @param displayMs 토스트가 화면에 남는 시간 (fade-out 전까지). 기본 1800ms.
   * @param opts.wrap true면 긴 메시지 자동 줄바꿈 (좁은 뷰포트에서 잘리지 않음)
   */
  show(
    message: string,
    emoji?: string,
    key: string = message,
    throttleMs: number = 1500,
    displayMs: number = 1800,
    opts: { wrap?: boolean } = {},
  ): void {
    const now = performance.now()
    const last = this.lastShownAt.get(key) ?? -Infinity
    if (now - last < throttleMs) return
    this.lastShownAt.set(key, now)

    // 이전 토스트 즉시 제거
    if (this.activeEl) {
      this.activeEl.remove()
      this.activeEl = null
    }

    const el = document.createElement('div')
    el.className = 'w3d-toast-generic' + (opts.wrap ? ' w3d-toast-wrap' : '')
    // textContent 기반 DOM 조립 — 메시지/이모지에 사용자 입력이 섞여도 XSS 차단
    if (emoji) {
      const emoSpan = document.createElement('span')
      emoSpan.className = 'w3d-toast-emoji'
      emoSpan.textContent = emoji
      el.appendChild(emoSpan)
    }
    el.appendChild(document.createTextNode(message))
    document.body.appendChild(el)
    this.activeEl = el

    const FADE_MS = 280

    setTimeout(() => {
      el.style.animation = `w3d-toast-out ${FADE_MS}ms ease forwards`
      setTimeout(() => {
        el.remove()
        if (this.activeEl === el) this.activeEl = null
      }, FADE_MS)
    }, displayMs)
  }

  dispose(): void {
    this.activeEl?.remove()
    this.activeEl = null
    this.lastShownAt.clear()
  }
}
