import type { ConsumableDef } from './types'

const defs: ConsumableDef[] = [
  { id: 'sprout', name: 'Plug & Play', emoji: '🌿', price: 3, desc: 'Uncover an empty tile next to an already uncovered empty tile.' },
  { id: 'scope', name: 'Find Next', emoji: '🎯', price: 4, desc: 'Uncover the hidden safe tile with the highest number.' },
  { id: 'sniffer', name: 'Quick Search', emoji: '🐽', price: 3, desc: 'Flag a random hidden mine next to an uncovered numbered tile.' },
  { id: 'bandage', name: 'Sick Day', emoji: '🩹', price: 5, desc: 'Restore 1 life.' },
  { id: 'surge', name: 'Power Strip', emoji: '⚡', price: 4, desc: 'Adds x0.25 to your base multiplier for this round.' },
  { id: 'flashlight', name: 'Tip of the Day', emoji: '🔦', price: 3, desc: 'Uncover a random hidden safe tile.' },
  { id: 'ward', name: 'Surge Protector', emoji: '🛡️', price: 4, desc: 'The next mine you hit this round is harmless.' },
  { id: 'dowse', name: 'Sticky Notes', emoji: '🔱', price: 4, desc: 'Flag 3 random hidden mines.' },
  { id: 'shovel', name: 'Eraser', emoji: '🪏', price: 5, desc: 'Uncover 3 random hidden safe tiles.' },
  { id: 'kindle', name: 'Turbo Button', emoji: '🕯️', price: 5, desc: 'Adds 10 to your streak.' },
]

export const CONSUMABLES: Record<string, ConsumableDef> = Object.fromEntries(defs.map((d) => [d.id, d]))
export const CONSUMABLE_LIST = defs
