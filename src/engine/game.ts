import { flood, generate, emptyBoard, neighbors } from './board'
import { CARDS, CARD_LIST, cardBaseMult } from './cards'
import { CONSUMABLES, CONSUMABLE_LIST } from './consumables'
import {
  BASE_LIVES,
  BASE_STREAK_STEP,
  CARD_SLOTS,
  CONSUMABLE_SLOTS,
  MAX_ROUND,
  mineCount,
  rarityWeights,
  rerollCost,
  roundReward,
  roundSpec,
  sellPrice,
} from './difficulty'
import { hashSeed, makeRng, type Rng } from './rng'
import type {
  BonusKind,
  CardInst,
  Command,
  GameEvent,
  GameState,
  HookCtx,
  MoveInfo,
  Offer,
  PayoutLine,
  Rarity,
  Shop,
} from './types'

const r2 = (n: number) => Math.round(n * 100) / 100

// ───────────────────────── derived values ─────────────────────────

export function maxLives(s: GameState): number {
  let h = BASE_LIVES
  for (const c of s.cards) h += CARDS[c.id].maxLives ?? 0
  return h
}

export interface MultBreakdown {
  /** 1 */
  start: number
  /** additive contribution from cards */
  cards: number
  /** multiplicative contribution from cards (e.g. 1.25) */
  cardMul: number
  /** bonus tiles + consumables this round */
  bonus: number
  /** per-streak step */
  step: number
  streak: number
  streakPart: number
  base: number
  total: number
}

export function multBreakdown(s: GameState): MultBreakdown {
  const r = s.round
  let cards = 0
  let cardMul = 1
  let step = BASE_STREAK_STEP
  for (const c of s.cards) {
    const d = CARDS[c.id]
    cards += cardBaseMult(c, s)
    if (d.baseMul) cardMul *= d.baseMul
    step += d.streakStep?.(c, s) ?? 0
  }
  const bonus = r?.bonusMult ?? 0
  const streak = r?.streak ?? 0
  const base = r2((1 + cards) * cardMul + bonus)
  const streakPart = r2(streak * step)
  return { start: 1, cards: r2(cards), cardMul, bonus: r2(bonus), step: r2(step), streak, streakPart, base, total: r2(base + streakPart) }
}

// ───────────────────────── creation ─────────────────────────

function newCard(s: GameState, id: string): CardInst {
  return { uid: s.nextUid++, id, counter: 0, mult: 0, money: 0, score: 0, flash: [], flashInfo: [], log: '' }
}

export function newState(seed: string): GameState {
  const s: GameState = {
    v: 1,
    seed,
    rng: hashSeed(seed),
    phase: 'round',
    roundNo: 1,
    money: 2,
    lives: BASE_LIVES,
    cards: [],
    consumables: [],
    round: null,
    shop: null,
    payout: [],
    nextUid: 1,
    stats: { moves: 0, mistakes: 0, bestStreak: 0, totalScore: 0 },
    msg: null,
    history: [],
  }
  const rng = makeRng(s.rng)
  startRound(s, rng)
  s.rng = rng.state()
  return s
}

function startRound(s: GameState, rng: Rng) {
  const spec = roundSpec(s.roundNo)
  s.round = {
    board: emptyBoard(spec.cols, spec.rows, mineCount(spec)),
    score: 0,
    target: 0,
    streak: 0,
    bestStreak: 0,
    bonusMult: 0,
    shield: 0,
    moves: 0,
    mistakes: 0,
    lostLife: false,
    streakSafe: false,
    last: null,
  }
  s.lives = maxLives(s)
  s.phase = 'round'
  s.shop = null
  s.payout = []
  for (const c of s.cards) {
    c.counter = 0
    c.mult = 0
    c.money = 0
    c.score = 0
    c.flash = []
    c.flashInfo = []
    c.log = ''
  }
  for (const c of s.cards) CARDS[c.id].onRoundStart?.(ctx(s, rng, c, null, false, []))
}

// ───────────────────────── hook context ─────────────────────────

/** Records what a card just did: a short chip label plus the full sentence for its tooltip. */
function note(card: CardInst, short: string, info: string) {
  card.flash.push(short)
  card.flashInfo.push(info)
}

function ctx(s: GameState, rng: Rng, card: CardInst, move: MoveInfo | null, collect: boolean, events: GameEvent[]): HookCtx {
  const def = CARDS[card.id]
  const label = `${def.emoji} ${def.name}`
  return {
    s,
    card,
    rng,
    move,
    addMoney(n) {
      s.money += n
      card.money += n
      note(card, `+$${n}`, `Earned $${n}.`)
      if (collect) s.payout.push({ label, amount: n })
    },
    addMult(n) {
      card.mult = r2(card.mult + n)
      note(card, `+${n}x`, `Added +${n} to your base multiplier for the rest of this round.`)
    },
    addScore(n) {
      s.round!.score = r2(s.round!.score + n)
      card.score += n
      note(card, `+${n} pts`, `Added ${n} point${n === 1 ? '' : 's'} straight to your score (not multiplied).`)
    },
    revealSafe(n) {
      const got = revealRandomSafe(s, rng, n, events)
      if (got) note(card, `${got} tile${got > 1 ? 's' : ''}`, `Uncovered ${got} random hidden safe tile${got > 1 ? 's' : ''}.`)
      return got
    },
    flagMines(n) {
      const got = flagRandomMines(s, rng, n)
      if (got) note(card, `${got} flag${got > 1 ? 's' : ''}`, `Flagged ${got} random hidden mine${got > 1 ? 's' : ''}.`)
      return got
    },
    heal(n) {
      const before = s.lives
      s.lives = Math.min(maxLives(s), s.lives + n)
      if (s.lives > before) note(card, '+1 life', 'Restored 1 life.')
    },
    keepStreak() {
      s.round!.streakSafe = true
    },
    say(text) {
      card.log = text
    },
  }
}

// ───────────────────────── board helpers ─────────────────────────

function revealRandomSafe(s: GameState, rng: Rng, n: number, events: GameEvent[]): number {
  const b = s.round!.board
  if (!b.generated) return 0
  const cand = rng.shuffle(b.tiles.map((_, i) => i).filter((i) => !b.tiles[i].mine && !b.tiles[i].revealed && !b.tiles[i].flagged))
  let got = 0
  for (const i of cand) {
    if (got >= n) break
    if (b.tiles[i].revealed) continue
    revealFree(s, rng, i, events)
    got++
  }
  return got
}

function flagRandomMines(s: GameState, rng: Rng, n: number): number {
  const b = s.round!.board
  if (!b.generated) return 0
  const cand = rng.shuffle(b.tiles.map((_, i) => i).filter((i) => b.tiles[i].mine && !b.tiles[i].revealed && !b.tiles[i].flagged))
  const take = cand.slice(0, n)
  for (const i of take) b.tiles[i].flagged = true
  return take.length
}

/** Reveals without it counting as a move: scores at the current multiplier, streak untouched. */
function revealFree(s: GameState, rng: Rng, idx: number, events: GameEvent[]): number {
  const r = s.round!
  const newly = flood(r.board, idx)
  if (!newly.length) return 0
  let p = 0
  for (const i of newly) p += r.board.tiles[i].n
  r.score = r2(r.score + p * multBreakdown(s).total)
  claimBonuses(s, rng, newly, events)
  return newly.length
}

function claimBonuses(s: GameState, rng: Rng, tiles: number[], events: GameEvent[]) {
  const b = s.round!.board
  for (const i of tiles) {
    const kind = b.tiles[i].bonus
    if (!kind) continue
    applyBonus(s, rng, kind, events)
    for (const c of s.cards) CARDS[c.id].onBonus?.(ctx(s, rng, c, null, false, events))
  }
}

function applyBonus(s: GameState, rng: Rng, kind: BonusKind, events: GameEvent[]) {
  const r = s.round!
  switch (kind) {
    case 'coin': {
      s.money += 1
      events.push({ text: '🪙 +$1', detail: 'Paycheck: you earned $1.' })
      break
    }
    case 'star': {
      const p = 2 + s.roundNo
      r.score = r2(r.score + p)
      events.push({ text: `⭐ +${p} pts`, detail: `Gold Star: +${p} points added straight to your score.` })
      break
    }
    case 'spark':
      r.bonusMult = r2(r.bonusMult + 0.15)
      events.push({ text: '✨ +0.15x', detail: 'Overclock: +0.15 added to your base multiplier for the rest of this round.' })
      break
    case 'flame':
      r.streak += 4
      events.push({ text: '🔥 +4 streak', detail: 'Double-Click: your streak went up by 4, which raises your multiplier.' })
      break
    case 'crystal':
      if (revealRandomSafe(s, rng, 1, events)) events.push({ text: '🔮 tile revealed', detail: 'Setup Wizard: a random hidden safe tile was uncovered for free.' })
      break
    case 'gift':
      if (s.consumables.length < CONSUMABLE_SLOTS) {
        const c = rng.pick(CONSUMABLE_LIST)
        s.consumables.push(c.id)
        events.push({ text: `🎁 ${c.emoji} ${c.name}`, detail: `Free Game: you received ${c.name} (${c.desc})` })
      } else {
        s.money += 1
        events.push({ text: '🎁 +$1', detail: 'Free Game: your item slots were full, so you got $1 instead.' })
      }
      break
    case 'shield':
      r.shield++
      events.push({ text: '🛡️ shield', detail: 'Firewall: the next mine you hit this round is harmless.' })
      break
    case 'life':
      if (s.lives < maxLives(s)) {
        s.lives++
        events.push({ text: '🙂 +1 life', detail: 'Day Off: you recovered 1 life.' })
      } else {
        s.money += 1
        events.push({ text: '🙂 +$1', detail: 'Day Off: you already had all your lives, so you got $1 instead.' })
      }
      break
  }
}

// ───────────────────────── moves ─────────────────────────

function doMove(s: GameState, rng: Rng, indices: number[]): true | string {
  const r = s.round!
  const b = r.board
  const valid = indices.filter((i) => {
    const t = b.tiles[i]
    return t && !t.revealed && !t.flagged
  })
  if (!valid.length) return 'Nothing to uncover there'
  if (!b.generated) {
    generate(b, valid[0], roundSpec(s.roundNo).bonusCells, rng)
    r.target = b.totalPoints
  }
  for (const c of s.cards) {
    c.flash = []
    c.flashInfo = []
  }
  const before = r.score
  const events: GameEvent[] = []
  const mines = valid.filter((i) => b.tiles[i].mine)
  const safe = valid.filter((i) => !b.tiles[i].mine)
  s.stats.moves++

  if (mines.length) {
    for (const i of mines) {
      b.tiles[i].revealed = true
      b.tiles[i].exploded = true
    }
    r.mistakes++
    s.stats.mistakes++
    r.streakSafe = false
    for (const c of s.cards) CARDS[c.id].onMineHit?.(ctx(s, rng, c, null, false, events))
    let blocked = false
    if (r.shield > 0) {
      r.shield--
      blocked = true
      events.push({ text: '🛡️ blast absorbed', detail: 'You hit a mine, but a shield absorbed it: no life lost and your streak is kept.' })
    } else {
      r.lostLife = true
      const revive = s.cards.findIndex((c) => CARDS[c.id].revive)
      if (s.lives <= 1 && revive >= 0) {
        events.push({ text: `${CARDS[s.cards[revive].id].emoji} saved you`, detail: `${CARDS[s.cards[revive].id].name} saved you from losing your last life, and was used up.` })
        s.cards.splice(revive, 1)
      } else {
        s.lives--
      }
      if (!r.streakSafe) r.streak = 0
    }
    if (s.lives <= 0) {
      s.phase = 'lost'
      r.last = { no: r.moves, points: 0, mult: multBreakdown(s).total, gain: 0, revealed: 0, hit: true, blocked, events }
      return true
    }
    let n = 0
    for (const i of safe) n += revealFree(s, rng, i, events)
    r.last = { no: r.moves, points: 0, mult: multBreakdown(s).total, gain: r2(r.score - before), revealed: n, hit: true, blocked, events }
    checkWin(s, rng)
    return true
  }

  const newly: number[] = []
  for (const i of safe) newly.push(...flood(b, i))
  let points = 0
  let maxN = 0
  let count4 = 0
  let count1 = 0
  let count2 = 0
  let sum3 = 0
  for (const i of newly) {
    const n = b.tiles[i].n
    points += n
    maxN = Math.max(maxN, n)
    if (n >= 4) count4++
    if (n === 1) count1++
    if (n === 2) count2++
    if (n >= 3) sum3 += n
  }
  const mult = multBreakdown(s).total
  const no = r.moves + 1
  const info: MoveInfo = { no, points, revealed: newly.length, streak: r.streak + 1, mult, maxN, count4, count1, count2, sum3 }
  let factor = 1
  for (const c of s.cards) {
    const f = CARDS[c.id].moveScoreMult?.(info, c, s) ?? 1
    if (f !== 1) {
      factor *= f
      note(c, `x${f}`, `This move scored x${f}.`)
    }
  }
  r.score = r2(r.score + points * mult * factor)
  r.streak++
  r.moves = no
  claimBonuses(s, rng, newly, events)
  for (const c of s.cards) CARDS[c.id].onMove?.(ctx(s, rng, c, info, false, events))
  r.bestStreak = Math.max(r.bestStreak ?? 0, r.streak)
  s.stats.bestStreak = Math.max(s.stats.bestStreak, r.streak)
  r.last = { no, points, mult: r2(mult * factor), gain: r2(r.score - before), revealed: newly.length, hit: false, blocked: false, events }
  checkWin(s, rng)
  return true
}

function checkWin(s: GameState, rng: Rng) {
  const r = s.round!
  if (s.phase !== 'round') return
  // the target is only known once the board exists: nothing can be won before the first move
  if (!r.board.generated) return
  if (r.score + 1e-9 >= r.target || r.board.safeLeft === 0) finishRound(s, rng)
}

function finishRound(s: GameState, rng: Rng) {
  const r = s.round!
  const b = r.board
  const lines: PayoutLine[] = [{ label: `Round ${s.roundNo} cleared`, amount: roundReward(s.roundNo) }]
  const lifeBonus = Math.floor(s.lives / 2)
  if (lifeBonus > 0) lines.push({ label: `${s.lives} lives left`, amount: lifeBonus })
  if (!r.lostLife) lines.push({ label: 'Flawless: no life lost', amount: 1 })
  const hidden = b.safeLeft / (b.cols * b.rows - b.mines)
  const skip = Math.min(1, Math.floor(hidden / 0.2))
  if (skip > 0) lines.push({ label: `Left ${Math.round(hidden * 100)}% of the board`, amount: skip })
  for (const l of lines) s.money += l.amount
  s.payout = lines
  for (const c of s.cards) CARDS[c.id].onRoundEnd?.(ctx(s, rng, c, null, true, []))
  s.stats.totalScore = r2(s.stats.totalScore + r.score)
  s.lives = maxLives(s)
  if (s.roundNo >= MAX_ROUND) {
    s.phase = 'won'
  } else {
    s.phase = 'shop'
    s.shop = rollShop(s, rng, 0)
  }
}

// ───────────────────────── shop ─────────────────────────

function rollShop(s: GameState, rng: Rng, rerolls: number): Shop {
  const w = rarityWeights(s.roundNo + 1)
  const owned = new Set(s.cards.map((c) => c.id))
  const taken = new Set<string>()
  const cards: Offer[] = []
  for (let k = 0; k < 3; k++) {
    const avail = (rar: Rarity) => CARD_LIST.filter((d) => d.rarity === rar && !owned.has(d.id) && !taken.has(d.id))
    const rarities = (Object.keys(w) as Rarity[]).filter((rar) => w[rar] > 0 && avail(rar).length > 0)
    if (!rarities.length) break
    const rar = rng.weighted(rarities, (x) => w[x])
    const def = rng.pick(avail(rar))
    taken.add(def.id)
    cards.push({ id: def.id, price: def.price })
  }
  const cons: Offer[] = []
  const pool = CONSUMABLE_LIST.slice()
  for (let k = 0; k < 2 && pool.length; k++) {
    const def = pool.splice(rng.int(pool.length), 1)[0]
    cons.push({ id: def.id, price: def.price })
  }
  return { cards, cons, rerolls }
}

// ───────────────────────── consumables ─────────────────────────

function useConsumable(s: GameState, rng: Rng, slot: number): true | string {
  const id = s.consumables[slot]
  if (!id) return 'Empty slot'
  const r = s.round!
  const b = r.board
  const events: GameEvent[] = []
  const hiddenSafe = () => b.tiles.map((_, i) => i).filter((i) => !b.tiles[i].mine && !b.tiles[i].revealed && !b.tiles[i].flagged)
  const needBoard = !b.generated && ['sprout', 'scope', 'sniffer', 'flashlight', 'dowse', 'shovel'].includes(id)
  if (needBoard) return 'Uncover a tile first'
  switch (id) {
    case 'sprout': {
      const cand = hiddenSafe().filter(
        (i) => b.tiles[i].n === 0 && neighbors(b.cols, b.rows, i).some((j) => b.tiles[j].revealed && b.tiles[j].n === 0),
      )
      if (!cand.length) return 'No empty tile next to an uncovered empty tile'
      revealFree(s, rng, rng.pick(cand), events)
      break
    }
    case 'scope': {
      const cand = hiddenSafe()
      if (!cand.length) return 'Nothing left to uncover'
      const top = Math.max(...cand.map((i) => b.tiles[i].n))
      revealFree(s, rng, rng.pick(cand.filter((i) => b.tiles[i].n === top)), events)
      break
    }
    case 'sniffer': {
      const cand = b.tiles
        .map((_, i) => i)
        .filter(
          (i) =>
            b.tiles[i].mine &&
            !b.tiles[i].revealed &&
            !b.tiles[i].flagged &&
            neighbors(b.cols, b.rows, i).some((j) => b.tiles[j].revealed && b.tiles[j].n > 0),
        )
      if (!cand.length) return 'No hidden mine next to a numbered tile'
      b.tiles[rng.pick(cand)].flagged = true
      break
    }
    case 'bandage':
      if (s.lives >= maxLives(s)) return 'Already at full lives'
      s.lives++
      break
    case 'surge':
      r.bonusMult = r2(r.bonusMult + 0.25)
      break
    case 'flashlight': {
      const cand = hiddenSafe()
      if (!cand.length) return 'Nothing left to uncover'
      revealFree(s, rng, rng.pick(cand), events)
      break
    }
    case 'ward':
      r.shield++
      break
    case 'dowse':
      if (!flagRandomMines(s, rng, 3)) return 'No hidden mines to flag'
      break
    case 'shovel':
      if (!revealRandomSafe(s, rng, 3, events)) return 'Nothing left to uncover'
      break
    case 'kindle':
      r.streak += 10
      r.bestStreak = Math.max(r.bestStreak ?? 0, r.streak)
      s.stats.bestStreak = Math.max(s.stats.bestStreak, r.streak)
      break
  }
  s.consumables.splice(slot, 1)
  const def = CONSUMABLES[id]
  events.unshift({ text: `${def.emoji} ${def.name}`, detail: `Used ${def.name}: ${def.desc}` })
  r.last = { no: r.moves, points: 0, mult: multBreakdown(s).total, gain: 0, revealed: 0, hit: false, blocked: false, events }
  checkWin(s, rng)
  return true
}

// ───────────────────────── command dispatch ─────────────────────────

const fail = (m: string) => m

function handle(s: GameState, rng: Rng, cmd: Command): true | string {
  switch (cmd.type) {
    case 'reveal':
      if (s.phase !== 'round') return fail('No round in progress')
      return doMove(s, rng, [cmd.index])
    case 'chord': {
      if (s.phase !== 'round') return fail('No round in progress')
      const b = s.round!.board
      const t = b.tiles[cmd.index]
      if (!t || !t.revealed || t.n === 0) return fail('Nothing to chord')
      const ns = neighbors(b.cols, b.rows, cmd.index)
      if (ns.filter((j) => b.tiles[j].flagged).length !== t.n) return fail('Flag count must match the number')
      return doMove(s, rng, ns)
    }
    case 'flag': {
      if (s.phase !== 'round') return fail('No round in progress')
      const t = s.round!.board.tiles[cmd.index]
      if (!t || t.revealed) return fail('Cannot flag that')
      t.flagged = !t.flagged
      return true
    }
    case 'useConsumable':
      if (s.phase !== 'round') return fail('Only usable during a round')
      return useConsumable(s, rng, cmd.slot)
    case 'buyCard': {
      const o = s.shop?.cards[cmd.offer]
      if (s.phase !== 'shop' || !o) return fail('Not available')
      if (s.cards.length >= CARD_SLOTS) return fail('Card slots are full')
      if (s.money < o.price) return fail('Not enough money')
      s.money -= o.price
      s.cards.push(newCard(s, o.id))
      s.shop!.cards[cmd.offer] = null
      s.lives = maxLives(s)
      return true
    }
    case 'buyConsumable': {
      const o = s.shop?.cons[cmd.offer]
      if (s.phase !== 'shop' || !o) return fail('Not available')
      if (s.consumables.length >= CONSUMABLE_SLOTS) return fail('Consumable slots are full')
      if (s.money < o.price) return fail('Not enough money')
      s.money -= o.price
      s.consumables.push(o.id)
      s.shop!.cons[cmd.offer] = null
      return true
    }
    case 'sellCard': {
      const c = s.cards[cmd.slot]
      if (s.phase !== 'shop' || !c) return fail('Not available')
      s.money += sellPrice(CARDS[c.id].price)
      s.cards.splice(cmd.slot, 1)
      s.lives = maxLives(s)
      return true
    }
    case 'sellConsumable': {
      const id = s.consumables[cmd.slot]
      if (s.phase !== 'shop' || !id) return fail('Not available')
      s.money += sellPrice(CONSUMABLES[id].price)
      s.consumables.splice(cmd.slot, 1)
      return true
    }
    case 'reroll': {
      if (s.phase !== 'shop' || !s.shop) return fail('Not available')
      const cost = rerollCost(s.shop.rerolls)
      if (s.money < cost) return fail('Not enough money')
      s.money -= cost
      s.shop = rollShop(s, rng, s.shop.rerolls + 1)
      return true
    }
    case 'nextRound':
      if (s.phase !== 'shop') return fail('Not available')
      s.roundNo++
      startRound(s, rng)
      return true
    case 'debug': {
      if (cmd.round !== undefined) s.roundNo = Math.max(1, Math.min(MAX_ROUND, cmd.round))
      if (cmd.money !== undefined) s.money = cmd.money
      if (cmd.cards) s.cards = cmd.cards.filter((id) => CARDS[id]).slice(0, CARD_SLOTS).map((id) => newCard(s, id))
      if (cmd.consumables) s.consumables = cmd.consumables.filter((id) => CONSUMABLES[id]).slice(0, CONSUMABLE_SLOTS)
      if (cmd.phase === 'shop') {
        s.phase = 'shop'
        s.round = s.round ?? null
        s.shop = rollShop(s, rng, 0)
      } else if (cmd.phase === 'round' || cmd.round !== undefined || cmd.cards) {
        startRound(s, rng)
      }
      if (cmd.lives !== undefined) s.lives = cmd.lives
      return true
    }
  }
}

/** Applies a command in place. Returns true if it changed the game (and was recorded). */
export function applyInPlace(s: GameState, cmd: Command, record = true): boolean {
  const rng = makeRng(s.rng)
  const res = handle(s, rng, cmd)
  s.rng = rng.state()
  if (res === true) {
    if (record) s.history = [...s.history, cmd]
    s.msg = null
    return true
  }
  s.msg = { text: res, seq: (s.msg?.seq ?? 0) + 1 }
  return false
}

/** Pure version: returns a new state. */
export function apply(prev: GameState, cmd: Command): GameState {
  const { history, ...rest } = prev
  const next = structuredClone(rest) as GameState
  next.history = history
  applyInPlace(next, cmd)
  return next
}

export function replay(seed: string, history: Command[]): GameState {
  let s = newState(seed)
  for (const c of history) s = apply(s, c)
  return s
}

export function sellValueOfCard(id: string) {
  return sellPrice(CARDS[id].price)
}
