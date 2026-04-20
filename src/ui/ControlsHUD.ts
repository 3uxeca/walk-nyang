const CTRL_STYLE_ID = 'walk3d-ctrl-style'

function injectStyles() {
  if (document.getElementById(CTRL_STYLE_ID)) return
  const s = document.createElement('style')
  s.id = CTRL_STYLE_ID
  s.textContent = `
    @keyframes key-press {
      0%   { transform: scale(1)    translateY(0); }
      40%  { transform: scale(0.90) translateY(2px); }
      100% { transform: scale(1)    translateY(0); }
    }
    .w3d-ctrl {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      z-index: 100;
      user-select: none;
      pointer-events: none;
    }
    .w3d-ctrl-row {
      display: flex;
      gap: 5px;
    }
    .w3d-key {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255,248,238,0.82);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: 2px solid rgba(255,200,140,0.7);
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      color: #7c5c3a;
      box-shadow: 0 3px 8px rgba(255,140,66,0.15), 0 1px 2px rgba(0,0,0,0.08);
      transition: background 0.07s ease, border-color 0.07s ease, box-shadow 0.07s ease;
    }
    .w3d-key-wide {
      width: 110px;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    .w3d-key-active {
      background: rgba(255,140,66,0.88) !important;
      border-color: #FF8C42 !important;
      color: #fff !important;
      box-shadow: 0 3px 12px rgba(255,140,66,0.4) !important;
      animation: key-press 0.12s ease;
    }
  `
  document.head.appendChild(s)
}

export class ControlsHUD {
  private el: HTMLDivElement
  private keys: Record<string, HTMLDivElement> = {}
  private prevState = { forward: false, backward: false, left: false, right: false, jump: false, dash: false }

  constructor() {
    injectStyles()

    this.el = document.createElement('div')
    this.el.className = 'w3d-ctrl'

    const makeKey = (label: string, wide = false): HTMLDivElement => {
      const k = document.createElement('div')
      k.className = 'w3d-key' + (wide ? ' w3d-key-wide' : '')
      k.textContent = label
      return k
    }

    const row1 = document.createElement('div')
    row1.className = 'w3d-ctrl-row'
    const wKey = makeKey('W')
    row1.appendChild(wKey)

    const row2 = document.createElement('div')
    row2.className = 'w3d-ctrl-row'
    const aKey = makeKey('A')
    const sKey = makeKey('S')
    const dKey = makeKey('D')
    row2.append(aKey, sKey, dKey)

    const row3 = document.createElement('div')
    row3.className = 'w3d-ctrl-row'
    const shiftKey = makeKey('⬆  DASH', true)
    const spaceKey = makeKey('⎵ JUMP', true)
    row3.append(shiftKey, spaceKey)

    const tip = document.createElement('div')
    tip.style.cssText = `
      margin-top: 6px;
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: rgba(124,92,58,0.7);
      letter-spacing: 0.2px;
      text-align: center;
    `
    tip.textContent = '💡 가만히 멈춰서 고양이를 지켜보기만 해도 행복해요.'

    this.el.append(row1, row2, row3, tip)
    document.body.appendChild(this.el)

    this.keys = { w: wKey, a: aKey, s: sKey, d: dKey, space: spaceKey, shift: shiftKey }
  }

  update(input: { forward: boolean; backward: boolean; left: boolean; right: boolean; jump: boolean; dash: boolean }) {
    this.setActive(this.keys.w,     input.forward,   this.prevState.forward)
    this.setActive(this.keys.s,     input.backward,  this.prevState.backward)
    this.setActive(this.keys.a,     input.left,      this.prevState.left)
    this.setActive(this.keys.d,     input.right,     this.prevState.right)
    this.setActive(this.keys.space, input.jump,      this.prevState.jump)
    this.setActive(this.keys.shift, input.dash,      this.prevState.dash)
    this.prevState = { ...input }
  }

  private setActive(el: HTMLDivElement, isActive: boolean, wasActive: boolean) {
    if (isActive && !wasActive) {
      // Re-trigger animation on new press
      el.classList.remove('w3d-key-active')
      void el.offsetWidth
      el.classList.add('w3d-key-active')
    } else if (!isActive) {
      el.classList.remove('w3d-key-active')
    }
  }

  dispose() {
    this.el.remove()
  }
}
