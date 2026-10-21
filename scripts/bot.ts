/** A decent-but-not-perfect minesweeper bot, used by scripts/sim.ts for balancing. */
import {
  applyInPlace,
  CARDS,
  CONSUMABLES,
  CARD_SLOTS,
  CONSUMABLE_SLOTS,
  maxHearts,
  neighbors,
  newState,
  makeRng,
  type Command,
  type GameState,
} from '../src/engine'

export const skill = { level: (process.env.SKILL ?? 'casual') as 'casual' | 'expert' }
const botRng = makeRng(12345)

interface Constraint {
  cells: number[]
  rem: number
}

function analyse(s: GameState) {
  const b = s.round!.board
  const mines = new Set<number>()
  const safe = new Set<number>()
  b.tiles.forEach((t, i) => (t.flagged || t.exploded) && mines.add(i))
  let changed = true
  while (changed) {
    changed = false
    const cons: Constraint[] = []
    for (let i = 0; i < b.tiles.length; i++) {
      const t = b.tiles[i]
      if (!t.revealed || t.mine || t.n === 0) continue
      const ns = neighbors(b.cols, b.rows, i)
      const hidden = ns.filter((j) => !b.tiles[j].revealed && !mines.has(j) && !safe.has(j))
      const rem = t.n - ns.filter((j) => mines.has(j)).length
      if (!hidden.length) continue
      cons.push({ cells: hidden, rem })
      if (rem === 0) hidden.forEach((j) => !safe.has(j) && (safe.add(j), (changed = true)))
      else if (rem === hidden.length) hidden.forEach((j) => !mines.has(j) && (mines.add(j), (changed = true)))
    }
    if (changed) continue
    if (skill.level === 'casual') break
    // subset rule
    for (const a of cons) {
      for (const c of cons) {
        if (a === c || a.cells.length >= c.cells.length) continue
        if (!a.cells.every((x) => c.cells.includes(x))) continue
        const diff = c.cells.filter((x) => !a.cells.includes(x))
        const dr = c.rem - a.rem
        if (dr === 0) diff.forEach((j) => !safe.has(j) && (safe.add(j), (changed = true)))
        else if (dr === diff.length) diff.forEach((j) => !mines.has(j) && (mines.add(j), (changed = true)))
      }
    }
  }
  return { mines, safe }
}

function guess(s: GameState, mines: Set<number>, safe: Set<number>): number {
  const b = s.round!.board
  const unknown = b.tiles.map((_, i) => i).filter((i) => !b.tiles[i].revealed && !mines.has(i) && !safe.has(i))
  const remMines = b.mines - mines.size
  const global = Math.max(0.01, remMines / Math.max(1, unknown.length))
  let best = unknown[0]
  let bestP = 2
  // casual players sometimes just click somewhere
  if (skill.level === 'casual' && botRng.chance(0.3)) return botRng.pick(unknown)
  for (const i of unknown) {
    let p = global
    let frontier = false
    for (const j of neighbors(b.cols, b.rows, i)) {
      const t = b.tiles[j]
      if (!t.revealed || t.n === 0) continue
      const ns = neighbors(b.cols, b.rows, j)
      const hidden = ns.filter((k) => !b.tiles[k].revealed && !mines.has(k)).length
      const rem = t.n - ns.filter((k) => mines.has(k)).length
      const q = rem / Math.max(1, hidden)
      p = frontier ? Math.max(p, q) : q
      frontier = true
    }
    // prefer tiles likely to be zeros (low global density corner/edge isn't modelled; keep it simple)
    if (p < bestP) {
      bestP = p
      best = i
    }
  }
  return best
}

export interface BotStats {
  guesses: number
}

/** Returns the next command during a round, or null if nothing to do. */
export function roundCommand(s: GameState, stats: BotStats): Command {
  const r = s.round!
  const b = r.board
  if (!b.generated) return { type: 'reveal', index: Math.floor(b.rows / 2) * b.cols + Math.floor(b.cols / 2) }
  // free-standing consumables
  for (let slot = 0; slot < s.consumables.length; slot++) {
    const id = s.consumables[slot]
    if ((id === 'surge' || id === 'ward' || id === 'kindle') && r.moves >= 3) return { type: 'useConsumable', slot }
    if (id === 'bandage' && s.hearts < maxHearts(s)) return { type: 'useConsumable', slot }
  }
  const { mines, safe } = analyse(s)
  if (safe.size) return { type: 'reveal', index: safe.values().next().value as number }
  for (let slot = 0; slot < s.consumables.length; slot++) {
    const id = s.consumables[slot]
    if (id === 'sprout' || id === 'scope' || id === 'flashlight' || id === 'shovel' || id === 'dowse') {
      const probe = JSON.parse(JSON.stringify({ ...s, history: [] })) as GameState
      if (applyInPlace(probe, { type: 'useConsumable', slot }, false)) return { type: 'useConsumable', slot }
    }
  }
  stats.guesses++
  return { type: 'reveal', index: guess(s, mines, safe) }
}

export function shopCommands(s: GameState): Command[] {
  const out: Command[] = []
  let money = s.money
  let cards = s.cards.length
  let cons = s.consumables.length
  const offers = (s.shop?.cards ?? []).map((o, i) => ({ o, i })).filter((x) => x.o)
  offers.sort((a, b) => b.o!.price - a.o!.price)
  for (const { o, i } of offers) {
    if (cards < CARD_SLOTS && money >= o!.price) {
      out.push({ type: 'buyCard', offer: i })
      money -= o!.price
      cards++
    }
  }
  ;(s.shop?.cons ?? []).forEach((o, i) => {
    if (o && cons < CONSUMABLE_SLOTS && money >= o.price) {
      out.push({ type: 'buyConsumable', offer: i })
      money -= o.price
      cons++
    }
  })
  return out
}

export interface RoundResult {
  round: number
  won: boolean
  completion: number
  moves: number
  mistakes: number
  guesses: number
  payout: number
  scoreRatio: number
  /** money when the shop opens / after buying, and cards owned after buying (run mode) */
  shopMoney?: number
  moneyLeft?: number
  cardsOwned?: number
}

export function playRound(s: GameState): RoundResult {
  const stats: BotStats = { guesses: 0 }
  const round = s.roundNo
  const moneyBefore = s.money
  let guard = 0
  while (s.phase === 'round' && guard++ < 5000) {
    const cmd = roundCommand(s, stats)
    if (!applyInPlace(s, cmd, false)) throw new Error(`bot made an invalid command ${JSON.stringify(cmd)}: ${s.msg?.text}`)
  }
  const b = s.round!.board
  const safeTotal = b.cols * b.rows - b.mines
  return {
    round,
    won: s.phase !== 'lost',
    completion: (safeTotal - b.safeLeft) / safeTotal,
    moves: s.round!.moves,
    mistakes: s.round!.mistakes,
    guesses: stats.guesses,
    payout: s.money - moneyBefore,
    scoreRatio: s.round!.score / Math.max(1, s.round!.target),
  }
}

export function playRun(seed: string): { reached: number; won: boolean; rounds: RoundResult[]; state: GameState } {
  const s = newState(seed)
  const rounds: RoundResult[] = []
  while (true) {
    const res = playRound(s)
    rounds.push(res)
    if (!res.won) return { reached: res.round, won: false, rounds, state: s }
    if (s.phase === 'won') return { reached: 12, won: true, rounds, state: s }
    res.shopMoney = s.money
    for (const c of shopCommands(s)) applyInPlace(s, c, false)
    res.moneyLeft = s.money
    res.cardsOwned = s.cards.length
    applyInPlace(s, { type: 'nextRound' }, false)
  }
}

/** One isolated round with a fixed loadout (for per-card analysis). */
export function isolatedRound(seed: string, round: number, cards: string[], consumables: string[] = [], money = 0): RoundResult {
  const s = newState(seed)
  applyInPlace(s, { type: 'debug', round, cards, consumables, money }, false)
  return playRound(s)
}

export const _unused = { CARDS, CONSUMABLES, makeRng }
