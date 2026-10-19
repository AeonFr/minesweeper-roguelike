/**
 * The single source of randomness for a run. State is one uint32, stored in
 * GameState.rng, so any state can be rebuilt from (seed, command history).
 * Nothing in src/engine may call Math.random.
 */
export interface Rng {
  next(): number
  int(n: number): number
  chance(p: number): boolean
  pick<T>(items: readonly T[]): T
  shuffle<T>(items: readonly T[]): T[]
  weighted<T>(items: readonly T[], weight: (t: T) => number): T
  state(): number
}

export function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function makeRng(initial: number): Rng {
  let a = initial >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const rng: Rng = {
    next,
    int: (n) => Math.floor(next() * n),
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)],
    shuffle: (items) => {
      const out = items.slice()
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
    weighted: (items, weight) => {
      let total = 0
      for (const it of items) total += weight(it)
      let roll = next() * total
      for (const it of items) {
        roll -= weight(it)
        if (roll < 0) return it
      }
      return items[items.length - 1]
    },
    state: () => a,
  }
  return rng
}
