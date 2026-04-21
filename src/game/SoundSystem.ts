let ctx: AudioContext | null = null
let meowBuffer: AudioBuffer | null = null
let meowLoadAttempted = false
let purringBuffer: AudioBuffer | null = null
let purringLoadAttempted = false
let footstepBuffer: AudioBuffer | null = null
let footstepLoadAttempted = false
let purringSource: AudioBufferSourceNode | null = null
let purringGain: GainNode | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

async function loadMeowBuffer(): Promise<void> {
  if (meowLoadAttempted) return
  meowLoadAttempted = true
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}sounds/meow.wav`)
    if (!res.ok) return
    const arrayBuffer = await res.arrayBuffer()
    meowBuffer = await getCtx().decodeAudioData(arrayBuffer)
  } catch {
    // fall back to synthesized meow
  }
}

// Kick off load immediately (non-blocking)
loadMeowBuffer()

async function loadPurringBuffer(): Promise<void> {
  if (purringLoadAttempted) return
  purringLoadAttempted = true
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}sounds/purring.ogg`)
    if (!res.ok) return
    const arrayBuffer = await res.arrayBuffer()
    purringBuffer = await getCtx().decodeAudioData(arrayBuffer)
  } catch { /* no purring file, skip */ }
}

loadPurringBuffer()

async function loadFootstepBuffer(): Promise<void> {
  if (footstepLoadAttempted) return
  footstepLoadAttempted = true
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}sounds/footstep.ogg`)
    if (!res.ok) return
    const arrayBuffer = await res.arrayBuffer()
    footstepBuffer = await getCtx().decodeAudioData(arrayBuffer)
  } catch { /* fallback to synthesized */ }
}

loadFootstepBuffer()

export function startPurring() {
  if (!purringBuffer || purringSource) return
  const ac = getCtx()
  purringGain = ac.createGain()
  purringGain.gain.setValueAtTime(0, ac.currentTime)
  purringGain.gain.linearRampToValueAtTime(0.35, ac.currentTime + 1.5)
  purringGain.connect(ac.destination)
  purringSource = ac.createBufferSource()
  purringSource.buffer = purringBuffer
  purringSource.loop = true
  purringSource.connect(purringGain)
  purringSource.start()
}

export function stopPurring() {
  if (!purringSource || !purringGain) return
  const ac = getCtx()
  purringGain.gain.setValueAtTime(purringGain.gain.value, ac.currentTime)
  purringGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.6)
  const src = purringSource
  purringSource = null
  purringGain = null
  setTimeout(() => { try { src.stop() } catch { /* already stopped */ } }, 700)
}

/** Cat trill/mrrr — the excited sound a cat makes when it starts running */
export function playDashWhoosh() {
  const ac = getCtx()
  const now = ac.currentTime
  const dur = 0.28
  const f0 = 320 + Math.random() * 220

  // Fast vibrato LFO for trill effect
  const lfo = ac.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 22
  const lfoGain = ac.createGain()
  lfoGain.gain.value = 55
  lfo.connect(lfoGain)

  // Sawtooth for voiced cat sound
  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(f0 * 0.85, now)
  osc.frequency.linearRampToValueAtTime(f0 * 1.3, now + dur * 0.5)
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.95, now + dur)
  lfoGain.connect(osc.frequency)

  // Formant filter — cat throat resonance
  const formant = ac.createBiquadFilter()
  formant.type = 'bandpass'
  formant.frequency.setValueAtTime(900, now)
  formant.frequency.linearRampToValueAtTime(1400, now + dur * 0.4)
  formant.frequency.exponentialRampToValueAtTime(800, now + dur)
  formant.Q.value = 5

  const master = ac.createGain()
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(0.16, now + 0.03)
  master.gain.setValueAtTime(0.14, now + dur * 0.6)
  master.gain.exponentialRampToValueAtTime(0.001, now + dur)

  osc.connect(formant)
  formant.connect(master)
  master.connect(ac.destination)

  lfo.start(now); lfo.stop(now + dur + 0.05)
  osc.start(now); osc.stop(now + dur + 0.05)
}

/** Footstep — uses real audio if loaded, else synthesized fallback */
export function playFootstep() {
  const ac = getCtx()
  const now = ac.currentTime

  if (footstepBuffer) {
    const src = ac.createBufferSource()
    src.buffer = footstepBuffer
    const maxOffset = Math.max(0, footstepBuffer.duration - 0.4)
    src.playbackRate.value = 0.85 + Math.random() * 0.3

    // High-pass to cut low rumble noise
    const hp = ac.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 200

    // Fade in/out envelope to avoid clicks
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.018, now + 0.02)
    gain.gain.setValueAtTime(0.018, now + 0.28)
    gain.gain.linearRampToValueAtTime(0, now + 0.35)

    src.connect(hp); hp.connect(gain); gain.connect(ac.destination)
    src.start(0, Math.random() * maxOffset, 0.35)
    return
  }

  const noise = ac.createOscillator()
  noise.type = 'sine'
  noise.frequency.setValueAtTime(320 + Math.random() * 60, now)
  noise.frequency.exponentialRampToValueAtTime(140, now + 0.08)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.025, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  noise.connect(gain)
  gain.connect(ac.destination)
  noise.start(now)
  noise.stop(now + 0.12)
}

/** Kitten meow — plays real audio if /sounds/meow.ogg exists, else synthesized */
export function playMeow() {
  const ac = getCtx()

  // Use real audio if loaded
  if (meowBuffer) {
    const src = ac.createBufferSource()
    src.buffer = meowBuffer
    src.playbackRate.value = 0.9 + Math.random() * 0.2
    const gain = ac.createGain()
    gain.gain.value = 0.6
    src.connect(gain)
    gain.connect(ac.destination)
    src.start()
    return
  }

  const now = ac.currentTime
  const dur  = 0.32 + Math.random() * 0.18
  // Cats meow at 500-900 Hz fundamental (much higher than human speech)
  const f0   = 520 + Math.random() * 140

  // Vibrato LFO
  const lfo = ac.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 7 + Math.random() * 2
  const lfoD = ac.createGain()
  lfoD.gain.value = 18
  lfo.connect(lfoD)

  // Sawtooth = voiced harmonics
  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(f0 * 0.72, now)
  osc.frequency.linearRampToValueAtTime(f0 * 1.75, now + dur * 0.18)
  osc.frequency.exponentialRampToValueAtTime(f0 * 1.05, now + dur * 0.62)
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.78, now + dur)
  lfoD.connect(osc.frequency)

  const preLP = ac.createBiquadFilter()
  preLP.type = 'lowpass'
  preLP.frequency.value = 5500

  // Formant 1 — higher register for kitten voice
  const f1 = ac.createBiquadFilter()
  f1.type = 'bandpass'
  f1.frequency.setValueAtTime(950,  now)
  f1.frequency.linearRampToValueAtTime(1250, now + dur * 0.2)
  f1.frequency.exponentialRampToValueAtTime(900,  now + dur)
  f1.Q.value = 6

  // Formant 2 — bright overtone
  const f2 = ac.createBiquadFilter()
  f2.type = 'bandpass'
  f2.frequency.setValueAtTime(3200, now)
  f2.frequency.exponentialRampToValueAtTime(2000, now + dur)
  f2.Q.value = 4

  const g1 = ac.createGain(); g1.gain.value = 0.62
  const g2 = ac.createGain(); g2.gain.value = 0.38

  const master = ac.createGain()
  master.gain.setValueAtTime(0,    now)
  master.gain.linearRampToValueAtTime(0.18, now + 0.03)
  master.gain.setValueAtTime(0.15, now + dur * 0.5)
  master.gain.exponentialRampToValueAtTime(0.001, now + dur)

  osc.connect(preLP)
  preLP.connect(f1); f1.connect(g1); g1.connect(master)
  preLP.connect(f2); f2.connect(g2); g2.connect(master)
  master.connect(ac.destination)

  lfo.start(now);  lfo.stop(now + dur + 0.05)
  osc.start(now);  osc.stop(now + dur + 0.05)
}

/** Bouncy jump sound — 또잉! quick rising pitch */
export function playJump() {
  const ac = getCtx()
  const now = ac.currentTime

  // Two slightly detuned sines for "springy" quality
  for (const detune of [0, 7]) {
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.exponentialRampToValueAtTime(820 + detune, now + 0.09)
    osc.frequency.exponentialRampToValueAtTime(560 + detune, now + 0.20)

    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.20, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

    osc.connect(gain)
    gain.connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.24)
  }
}
