/**
 * Generative music + tiny SFX, all Web Audio (no <audio> elements, so nothing
 * shows up on lockscreens / media controls). Turning both music and SFX off
 * closes the AudioContext entirely. The audio session is set to "ambient" where
 * supported so we mix with other apps instead of interrupting them.
 *
 * Randomness comes from a seeded generator, never Math.random.
 */
import { hashSeed, makeRng, type Rng } from '../engine/rng'

export type Scene = 'menu' | 'round' | 'shop'
export type Intensity = 0 | 1 | 2 // 0 calm … 2 = last heart

let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicBus: GainNode | null = null
let sfxBus: GainNode | null = null
let wantMusic = false
let wantSfx = false
let scene: Scene = 'menu'
let intensity: Intensity = 0
let timer: number | null = null
let rng: Rng = makeRng(hashSeed('music'))

// A minor, i – VI – III – VII
const ROOTS = [57, 53, 60, 55] // MIDI A3 F3 C4 G3
const MINOR = [0, 3, 7, 10]
const MAJOR = [0, 4, 7, 11]
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

let step = 0
let nextTime = 0

export function setMusicSeed(seed: string) {
  rng = makeRng(hashSeed('music:' + seed))
}

function ensureContext() {
  if (ctx) return ctx
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = 'ambient'
  } catch {
    /* unsupported */
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)
  musicBus = ctx.createGain()
  musicBus.gain.value = 0.16
  musicBus.connect(master)
  sfxBus = ctx.createGain()
  sfxBus.gain.value = 0.3
  sfxBus.connect(master)
  return ctx
}

function osc(type: OscillatorType, freq: number, t: number, dur: number, gain: number, bus: GainNode, detune = 0) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  o.detune.value = detune
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(bus)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function noise(t: number, dur: number, gain: number, bus: GainNode, hp = 4000) {
  const c = ctx!
  const len = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = rng.next() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = hp
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(bus)
  src.start(t)
}

const bpm = () => (scene === 'shop' ? 72 : scene === 'menu' ? 78 : [88, 108, 136][intensity])

function scheduleStep(t: number, s: number) {
  const bus = musicBus!
  const bar = Math.floor(s / 16) % 4
  const pos = s % 16
  const tense = scene === 'round' && intensity === 2
  const chord = (scene === 'shop' ? MAJOR : MINOR).map((n) => ROOTS[bar] + n)
  const sd = 60 / bpm() / 4

  if (pos === 0) {
    // pad
    chord.slice(0, 3).forEach((n, k) => osc('sine', mtof(n - 12), t, sd * 15, 0.5 - k * 0.1, bus, k * 4))
    if (tense) osc('sawtooth', mtof(ROOTS[bar] - 24 + 1), t, sd * 14, 0.12, bus) // grinding minor second
  }
  if (pos % 8 === 0) osc('triangle', mtof(ROOTS[bar] - 24), t, sd * 7, 0.9, bus)
  if (scene !== 'menu' && pos % 2 === 0 && (scene === 'shop' ? rng.chance(0.55) : rng.chance(0.8))) {
    const n = chord[rng.int(chord.length)] + 12 + (rng.chance(0.25) ? 12 : 0)
    osc(scene === 'shop' ? 'sine' : 'square', mtof(n), t, sd * 1.8, scene === 'shop' ? 0.35 : 0.14, bus)
  }
  if (scene === 'round' && intensity >= 1) {
    if (pos % 8 === 0 || (intensity === 2 && pos % 4 === 0)) osc('sine', 60, t, 0.14, 1, bus, -600)
    if (pos % 4 === 2) noise(t, 0.05, 0.25, bus)
    if (intensity === 2 && pos % 2 === 1) noise(t, 0.03, 0.15, bus, 7000)
  }
}

function tick() {
  if (!ctx || !wantMusic) return
  const sd = 60 / bpm() / 4
  while (nextTime < ctx.currentTime + 0.25) {
    scheduleStep(nextTime, step)
    nextTime += sd
    step++
  }
}

function startMusic() {
  const c = ensureContext()
  void c.resume()
  if (timer !== null) return
  step = 0
  nextTime = c.currentTime + 0.1
  timer = window.setInterval(tick, 50)
}

function stopMusic() {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

function maybeClose() {
  if (wantMusic || wantSfx || !ctx) return
  const c = ctx
  ctx = master = musicBus = sfxBus = null
  void c.close()
}

export function setMusic(on: boolean) {
  wantMusic = on
  if (on) startMusic()
  else {
    stopMusic()
    maybeClose()
  }
}

export function setSfx(on: boolean) {
  wantSfx = on
  if (on) void ensureContext().resume()
  else maybeClose()
}

export function setScene(s: Scene) {
  scene = s
}
export function setIntensity(i: Intensity) {
  intensity = i
}

export type Sfx = 'reveal' | 'flag' | 'boom' | 'coin' | 'bonus' | 'win' | 'lose' | 'buy' | 'error'

export function sfx(kind: Sfx) {
  if (!wantSfx || !ctx || !sfxBus) return
  const t = ctx.currentTime + 0.01
  const b = sfxBus
  switch (kind) {
    case 'reveal':
      osc('triangle', 520 + rng.int(60), t, 0.07, 0.5, b)
      break
    case 'flag':
      osc('square', 300, t, 0.05, 0.25, b)
      break
    case 'boom':
      noise(t, 0.5, 1, b, 200)
      osc('sine', 90, t, 0.5, 1, b, -400)
      break
    case 'coin':
      osc('square', 988, t, 0.08, 0.3, b)
      osc('square', 1319, t + 0.07, 0.15, 0.3, b)
      break
    case 'bonus':
      ;[659, 784, 988].forEach((f, k) => osc('triangle', f, t + k * 0.06, 0.18, 0.5, b))
      break
    case 'buy':
      osc('triangle', 440, t, 0.08, 0.5, b)
      osc('triangle', 660, t + 0.07, 0.14, 0.5, b)
      break
    case 'error':
      osc('sawtooth', 140, t, 0.15, 0.4, b)
      break
    case 'win':
      ;[523, 659, 784, 1047].forEach((f, k) => osc('triangle', f, t + k * 0.09, 0.3, 0.6, b))
      break
    case 'lose':
      ;[392, 330, 262, 196].forEach((f, k) => osc('sawtooth', f, t + k * 0.18, 0.4, 0.4, b))
      break
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) void ctx.suspend()
    else if (wantMusic || wantSfx) void ctx.resume()
  })
}
