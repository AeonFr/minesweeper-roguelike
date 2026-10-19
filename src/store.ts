import { useSyncExternalStore } from 'react'
import * as engine from './engine'
import { apply, newState, replay, type Command, type GameState } from './engine'

const SAVE_KEY = 'mine-rogue.save.v1'

let state: GameState | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const getState = () => state
export const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
export const useGame = () => useSyncExternalStore(subscribe, getState)

function persist() {
  try {
    if (!state || state.phase === 'lost' || state.phase === 'won') localStorage.removeItem(SAVE_KEY)
    else localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable: the game still works, it just can't resume */
  }
}

export function readSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as GameState
    return s.v === 1 ? s : null
  } catch {
    return null
  }
}

/** The only place real randomness enters: choosing the seed string of a new run. */
export const randomSeed = () => Math.random().toString(36).slice(2, 8)

export function dispatch(cmd: Command) {
  if (!state) return
  state = apply(state, cmd)
  persist()
  emit()
}

export function dispatchAll(cmds: Command[]) {
  if (!state) return
  for (const c of cmds) state = apply(state, c)
  persist()
  emit()
}

export function newRun(seed: string = randomSeed()) {
  state = newState(seed)
  persist()
  emit()
}

export function continueRun(): boolean {
  const s = readSave()
  if (!s) return false
  state = s
  emit()
  return true
}

export function quitToMenu() {
  state = null
  emit()
}

/** Rebuilds the current run from its seed and command history (determinism check / time travel). */
export function rewindTo(count: number) {
  if (!state) return
  state = replay(state.seed, state.history.slice(0, count))
  persist()
  emit()
}

// ───────── layers: hide parts of the screen for focused screenshots ─────────

export const LAYERS = ['ui', 'board', 'fx', 'bg', 'bonus'] as const
export type Layer = (typeof LAYERS)[number]
const hidden = new Set<Layer>()
const layerListeners = new Set<() => void>()
let layerSnapshot = ''

export function setLayers(list: Layer[]) {
  hidden.clear()
  list.forEach((l) => hidden.add(l))
  layerSnapshot = [...hidden].sort().join(' ')
  document.documentElement.dataset.hide = layerSnapshot
  layerListeners.forEach((l) => l())
}
export const toggleLayer = (l: Layer) => setLayers(hidden.has(l) ? [...hidden].filter((x) => x !== l) : [...hidden, l])
export const useHiddenLayers = () =>
  useSyncExternalStore(
    (cb) => (layerListeners.add(cb), () => layerListeners.delete(cb)),
    () => layerSnapshot,
  )

// ───────── debug / automation handle ─────────

declare global {
  interface Window {
    __game: unknown
  }
}

export function installDebugApi() {
  window.__game = {
    engine,
    getState,
    dispatch,
    dispatchAll,
    newRun,
    rewindTo,
    setLayers,
    /** Board as text, for quick inspection in tests and screenshots */
    dump: () => {
      const b = state?.round?.board
      if (!b) return ''
      const rows: string[] = []
      for (let y = 0; y < b.rows; y++) {
        let row = ''
        for (let x = 0; x < b.cols; x++) {
          const t = b.tiles[y * b.cols + x]
          row += t.mine ? '*' : t.n || '.'
        }
        rows.push(row)
      }
      return rows.join('\n')
    },
  }
}
