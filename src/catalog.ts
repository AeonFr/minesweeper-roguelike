import { useSyncExternalStore } from 'react'
import type { BonusKind, GameState } from './engine'

/** What the player has met so far, across runs. Kept apart from the run save so a new run doesn't forget it. */
const KEY = 'mine-rogue.catalog.v1'
const UNLOCK_KEY = 'mine-rogue.catalog.unlock'

export interface Discovered {
  cards: string[]
  items: string[]
  bonus: string[]
}

export interface CatalogView extends Discovered {
  /** developer switch: show every entry as discovered */
  all: boolean
}

function load(): Discovered {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { cards: raw.cards ?? [], items: raw.items ?? [], bonus: raw.bonus ?? [] }
  } catch {
    return { cards: [], items: [], bonus: [] }
  }
}

let found = load()
let all = false
try {
  all = localStorage.getItem(UNLOCK_KEY) === '1'
} catch {
  /* storage unavailable */
}
let view: CatalogView = { ...found, all }
const listeners = new Set<() => void>()

function commit() {
  view = { ...found, all }
  listeners.forEach((l) => l())
}

export const useCatalog = () =>
  useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => view,
  )

/** Records everything visible in the game state: shop offers, owned cards and items, uncovered bonus tiles. */
export function discoverFrom(s: GameState) {
  // runs set up with the debug command (URL scenes, debug panel) hand out things the player hasn't earned
  if (s.history.some((c) => c.type === 'debug')) return
  const next: Discovered = { cards: [...found.cards], items: [...found.items], bonus: [...found.bonus] }
  let changed = false
  const add = (list: string[], id: string | undefined | null) => {
    if (id && !list.includes(id)) {
      list.push(id)
      changed = true
    }
  }
  s.cards.forEach((c) => add(next.cards, c.id))
  s.shop?.cards.forEach((o) => add(next.cards, o?.id))
  s.consumables.forEach((id) => add(next.items, id))
  s.shop?.cons.forEach((o) => add(next.items, o?.id))
  for (const t of s.round?.board.tiles ?? []) if (t.revealed && t.bonus) add(next.bonus, t.bonus as BonusKind)
  if (!changed) return
  found = next
  try {
    localStorage.setItem(KEY, JSON.stringify(found))
  } catch {
    /* ignore */
  }
  commit()
}

/** Secret developer switch: toggles "everything discovered" without touching what was really found. */
export function setCatalogUnlocked(on: boolean) {
  all = on
  try {
    localStorage.setItem(UNLOCK_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
  commit()
}
export const toggleCatalogUnlocked = () => setCatalogUnlocked(!all)
