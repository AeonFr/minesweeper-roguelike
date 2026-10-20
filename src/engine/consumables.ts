import type { ConsumableDef } from './types'

const defs: ConsumableDef[] = [
  { id: 'sprout', name: 'Sprout', emoji: '🌿', price: 3, desc: 'Uncover an empty tile next to an already uncovered empty tile.' },
  { id: 'scope', name: 'Scope', emoji: '🎯', price: 4, desc: 'Uncover the hidden safe tile with the highest number.' },
  { id: 'sniffer', name: 'Mine Sniffer', emoji: '🐽', price: 3, desc: 'Flag a random hidden mine next to an uncovered numbered tile.' },
  { id: 'bandage', name: 'Bandage', emoji: '🩹', price: 5, desc: 'Restore 1 heart.' },
  { id: 'surge', name: 'Surge', emoji: '⚡', price: 4, desc: 'Adds x0.25 to your base multiplier for this round.' },
  { id: 'flashlight', name: 'Flashlight', emoji: '🔦', price: 3, desc: 'Uncover a random hidden safe tile.' },
  { id: 'ward', name: 'Ward', emoji: '🛡️', price: 4, desc: 'The next mine you hit this round is harmless.' },
  { id: 'dowse', name: 'Divining Rod', emoji: '🔱', price: 4, desc: 'Flag 3 random hidden mines.' },
  { id: 'shovel', name: 'Shovel', emoji: '🪏', price: 5, desc: 'Uncover 3 random hidden safe tiles.' },
  { id: 'kindle', name: 'Kindle', emoji: '🕯️', price: 5, desc: 'Adds 10 to your streak.' },
]

export const CONSUMABLES: Record<string, ConsumableDef> = Object.fromEntries(defs.map((d) => [d.id, d]))
export const CONSUMABLE_LIST = defs
