const STYLE_ID = 'walk3d-landing-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    @keyframes w3d-landing-float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-12px) rotate(-2deg); }
    }
    @keyframes w3d-landing-fade-in {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes w3d-landing-pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 8px 22px rgba(255,140,66,0.35); }
      50%      { transform: scale(1.04); box-shadow: 0 12px 30px rgba(255,140,66,0.5); }
    }
    @keyframes w3d-landing-out {
      to { opacity: 0; transform: scale(1.02); }
    }
    .w3d-landing {
      position: fixed;
      inset: 0;
      background: linear-gradient(180deg, #ffe5d0 0%, #ffd4b8 60%, #ffc59a 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9000;
      font-family: 'Jua', 'Nunito', 'Apple SD Gothic Neo', sans-serif;
      gap: 22px;
      padding: 24px;
      overflow-y: auto;
    }
    .w3d-landing.w3d-landing-leaving {
      animation: w3d-landing-out 0.45s ease forwards;
      pointer-events: none;
    }
    .w3d-landing-logo {
      width: 240px;
      height: 240px;
      max-width: 56vw;
      max-height: 36vh;
      animation: w3d-landing-float 3.4s ease-in-out infinite, w3d-landing-fade-in 0.6s ease both;
      filter: drop-shadow(0 12px 18px rgba(120, 70, 30, 0.25));
      user-select: none;
      pointer-events: none;
    }
    .w3d-landing-title {
      font-size: 64px;
      color: #4a2c1a;
      letter-spacing: 1px;
      animation: w3d-landing-fade-in 0.6s 0.1s ease both;
      text-shadow: 0 3px 0 rgba(255,255,255,0.6);
    }
    .w3d-landing-sub {
      font-size: 20px;
      color: #7c4a28;
      animation: w3d-landing-fade-in 0.6s 0.25s ease both;
      text-align: center;
      max-width: 480px;
      line-height: 1.5;
    }
    .w3d-landing-start {
      margin-top: 18px;
      padding: 18px 56px;
      font-family: inherit;
      font-size: 28px;
      color: #fff;
      background: #FF8C42;
      border: 4px solid #fff;
      border-radius: 999px;
      cursor: pointer;
      animation: w3d-landing-pulse 1.6s ease-in-out infinite, w3d-landing-fade-in 0.6s 0.4s ease both;
      letter-spacing: 1.5px;
      box-shadow: 0 8px 22px rgba(255,140,66,0.35);
      transition: transform 0.1s ease;
      touch-action: manipulation;
    }
    .w3d-landing-start:active {
      transform: scale(0.96);
      animation-play-state: paused;
    }
    .w3d-landing-hint {
      font-size: 14px;
      color: #a47452;
      margin-top: 4px;
      animation: w3d-landing-fade-in 0.6s 0.55s ease both;
      text-align: center;
    }

    @media (max-width: 600px) {
      .w3d-landing { gap: 14px; }
      .w3d-landing-logo { width: 180px; height: 180px; }
      .w3d-landing-title { font-size: 44px; }
      .w3d-landing-sub { font-size: 16px; }
      .w3d-landing-start { font-size: 22px; padding: 14px 44px; }
    }

    /* 가로 모바일 / 짧은 viewport — 세로 overflow 방지 */
    @media (max-height: 480px) {
      .w3d-landing { gap: 8px; padding: 12px; }
      .w3d-landing-logo { width: 110px; height: 110px; max-height: 28vh; }
      .w3d-landing-title { font-size: 32px; }
      .w3d-landing-sub { font-size: 13px; }
      .w3d-landing-start { font-size: 18px; padding: 10px 32px; margin-top: 6px; }
      .w3d-landing-hint { font-size: 11px; }
    }
  `
  document.head.appendChild(s)
}

export interface LandingOptions {
  title?: string
  subtitle?: string
  hint?: string
  buttonLabel?: string
  /** 로고 이미지 URL — 비우면 이모지로 폴백 */
  logoUrl?: string
}

/**
 * 게임 시작 전 풀스크린 랜딩 오버레이.
 * 모바일/데스크탑 공통. START 클릭 시 onStart 콜백을 호출하고 0.45초 페이드아웃 후 자동 제거.
 */
export class LandingScreen {
  private el: HTMLDivElement
  private button: HTMLButtonElement
  private onStart: () => void
  private removed = false

  constructor(onStart: () => void, opts: LandingOptions = {}) {
    injectStyles()
    this.onStart = onStart

    this.el = document.createElement('div')
    this.el.className = 'w3d-landing'

    const makeEmojiFallback = (): HTMLDivElement => {
      const fallback = document.createElement('div')
      fallback.className = 'w3d-landing-logo'
      fallback.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:140px;'
      fallback.textContent = '🐈'
      return fallback
    }

    if (opts.logoUrl) {
      const img = document.createElement('img')
      img.className = 'w3d-landing-logo'
      img.src = opts.logoUrl
      img.alt = '산책냥 로고'
      img.draggable = false
      img.onerror = () => img.replaceWith(makeEmojiFallback())
      this.el.appendChild(img)
    } else {
      this.el.appendChild(makeEmojiFallback())
    }

    const title = document.createElement('div')
    title.className = 'w3d-landing-title'
    title.textContent = opts.title ?? '산책냥'
    this.el.appendChild(title)

    const sub = document.createElement('div')
    sub.className = 'w3d-landing-sub'
    sub.textContent = opts.subtitle ?? '귀여운 고양이가 되어 마을을 거닐어 보세요'
    this.el.appendChild(sub)

    this.button = document.createElement('button')
    this.button.className = 'w3d-landing-start'
    this.button.type = 'button'
    this.button.textContent = opts.buttonLabel ?? '시작하기'
    this.el.appendChild(this.button)

    const hint = document.createElement('div')
    hint.className = 'w3d-landing-hint'
    hint.textContent = opts.hint ?? '버튼을 누르면 게임이 시작돼요'
    this.el.appendChild(hint)

    this.button.addEventListener('click', this.handleStart)

    document.body.appendChild(this.el)
  }

  private handleStart = () => {
    if (this.removed) return
    this.button.removeEventListener('click', this.handleStart)
    this.el.classList.add('w3d-landing-leaving')
    this.onStart()
    setTimeout(() => this.dispose(), 480)
  }

  /** 외부에서 강제 제거 (HMR 등). 멱등. */
  dispose() {
    if (this.removed) return
    this.removed = true
    this.button.removeEventListener('click', this.handleStart)
    this.el.remove()
  }
}
