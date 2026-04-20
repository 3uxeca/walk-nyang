const FX_STYLE_ID = 'walk3d-fx-style'

function injectStyles() {
  if (document.getElementById(FX_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = FX_STYLE_ID
  s.textContent = `
    @keyframes toast-in {
      0%   { opacity: 0; transform: translateX(-50%) translateY(-24px) scale(0.88); }
      60%  { transform: translateX(-50%) translateY(4px)  scale(1.03); }
      100% { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
    }
    @keyframes toast-out {
      to { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.92); }
    }
    .w3d-toast {
      position: fixed;
      top: 72px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,248,238,0.96);
      border: 2.5px solid #FF8C42;
      border-radius: 20px;
      padding: 12px 26px;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      font-size: 17px;
      font-weight: 800;
      color: #4a3728;
      pointer-events: none;
      box-shadow: 0 6px 24px rgba(255,140,66,0.25), 0 2px 8px rgba(0,0,0,0.1);
      z-index: 200;
      white-space: nowrap;
      animation: toast-in 0.45s cubic-bezier(.34,1.56,.64,1) both;
    }
    .w3d-toast .toast-sub {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #a07848;
      margin-top: 2px;
      text-align: center;
    }
  `
  document.head.appendChild(s)
}

const REGION_NAMES: Record<number, { name: string; emoji: string }> = {
  0: { name: '초원 마을',   emoji: '🌿' },
  1: { name: '항구 마을',   emoji: '⚓' },
  2: { name: '숲 마을',     emoji: '🌲' },
  3: { name: '황야 마을',   emoji: '✨' },
}

function getRegion(id: number) {
  return REGION_NAMES[id] ?? { name: '새 마을', emoji: '🗺️' }
}

export class RegionUnlockFX {
  constructor() {
    injectStyles()
  }

  showUnlock(regionId: number): void {
    const { name, emoji } = getRegion(regionId)

    const toast = document.createElement('div')
    toast.className = 'w3d-toast'
    toast.innerHTML = `🎉 새 지역 해제! <span class="toast-sub">${emoji} ${name}</span>`
    document.body.appendChild(toast)

    const DISPLAY_MS = 2800
    const FADE_MS    = 380

    setTimeout(() => {
      toast.style.animation = `toast-out ${FADE_MS}ms ease forwards`
      setTimeout(() => toast.remove(), FADE_MS)
    }, DISPLAY_MS - FADE_MS)
  }
}
