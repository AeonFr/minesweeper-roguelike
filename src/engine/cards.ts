import { BASE_LIVES } from './difficulty'
import type { CardDef, CardInst, GameState } from './types'

const r2 = (n: number) => Math.round(n * 100) / 100

/** (game.ts has maxLives, but it imports this file) */
const hasAllLives = (s: GameState) => s.lives >= BASE_LIVES + s.cards.reduce((n, c) => n + (CARDS[c.id]?.maxLives ?? 0), 0)

const defs: CardDef[] = [
  // ───────── common ─────────
  {
    id: 'steady-hand', name: 'Steady Hand', emoji: '🧤', rarity: 'common', price: 4,
    desc: 'Adds x0.05 to your base multiplier.',
    baseMult: () => 0.05,
  },
  {
    id: 'pocket-change', name: 'Pocket Change', emoji: '🪙', rarity: 'common', price: 5,
    desc: 'Earn $1 at the end of every round.',
    onRoundEnd: (x) => x.addMoney(1),
  },
  {
    id: 'lucky-clover', name: 'Autofill', emoji: '🍀', rarity: 'common', price: 6,
    desc: 'Every 10th successful move, uncover a random hidden safe tile.',
    onMove: (x) => {
      if (x.move!.no % 10 === 0 && x.revealSafe(1)) x.say('🍀 uncovered a tile')
    },
  },
  {
    id: 'lucky-socks', name: 'Crunch Time', emoji: '🧦', rarity: 'common', price: 6,
    desc: 'Every 3rd successful move adds x0.05 to the base multiplier (this round).',
    onMove: (x) => {
      if (x.move!.no % 3 === 0) x.addMult(0.05)
    },
  },
  {
    id: 'counting-beads', name: 'Ledger', emoji: '📿', rarity: 'common', price: 6,
    desc: 'Every tile numbered 1 you uncover adds +0.5 points (not multiplied).',
    onMove: (x) => {
      if (x.move!.count1 > 0) x.addScore(r2(x.move!.count1 * 0.5))
    },
  },
  {
    id: 'tidy-sweeper', name: 'Tidy Sweeper', emoji: '🧹', rarity: 'common', price: 5,
    desc: 'Moves that uncover 4 or more tiles add +3 points.',
    onMove: (x) => {
      if (x.move!.revealed >= 4) x.addScore(3)
    },
  },
  {
    id: 'cautious-cat', name: 'Undercover', emoji: '🐱', rarity: 'common', price: 6,
    desc: 'The first time you hit a mine each round, your streak is not reset.',
    onMineHit: (x) => {
      if (x.card.counter === 0) {
        x.card.counter = 1
        x.keepStreak()
        x.say('🐱 streak saved')
      }
    },
  },
  {
    id: 'piggy-bank', name: 'Pension', emoji: '🐷', rarity: 'common', price: 5,
    desc: 'Earn $1 at the end of a round if you still have 3 or more lives.',
    onRoundEnd: (x) => {
      if (x.s.lives >= 3) x.addMoney(1)
    },
  },
  // ───────── uncommon ─────────
  {
    id: 'magnifier', name: 'Magnifier', emoji: '🔍', rarity: 'uncommon', price: 6,
    desc: 'Every tile numbered 2 you uncover adds +0.75 points (not multiplied).',
    onMove: (x) => {
      if (x.move!.count2 > 0) x.addScore(r2(x.move!.count2 * 0.75))
    },
  },
  {
    id: 'hot-streak', name: 'Fast Forward', emoji: '🔥', rarity: 'uncommon', price: 7,
    desc: 'Each consecutive successful move adds x0.06 instead of x0.04.',
    streakStep: () => 0.02,
  },
  {
    id: 'tax-collector', name: 'Payroll', emoji: '🏦', rarity: 'uncommon', price: 7,
    desc: 'End of round: earn $1 for every 10 successful moves (max $3).',
    onRoundEnd: (x) => {
      const n = Math.min(3, Math.floor(x.s.round!.moves / 10))
      if (n > 0) x.addMoney(n)
    },
  },
  {
    id: 'gambler', name: 'Office Raffle', emoji: '🎲', rarity: 'uncommon', price: 7,
    desc: 'Every successful move has a 1 in 14 chance to earn $1.',
    onMove: (x) => {
      if (x.rng.chance(1 / 14)) x.addMoney(1)
    },
  },
  {
    id: 'first-blood', name: 'Blank Page', emoji: '🩸', rarity: 'uncommon', price: 8,
    desc: 'Your first move of each round scores x1.5.',
    moveScoreMult: (m) => (m.no === 1 ? 1.5 : 1),
  },
  {
    id: 'sapling', name: 'Patch Tuesday', emoji: '🌱', rarity: 'uncommon', price: 8,
    desc: 'Every successful move adds x0.01 to the base multiplier (up to x0.2 per round).',
    onMove: (x) => {
      if (x.card.mult < 0.2) x.addMult(0.01)
    },
  },
  {
    id: 'lantern', name: 'Rollback', emoji: '🏮', rarity: 'uncommon', price: 7,
    desc: 'Hitting a mine uncovers 2 random hidden safe tiles.',
    onMineHit: (x) => {
      if (x.revealSafe(2)) x.say('🏮 lit the way')
    },
  },
  {
    id: 'compass', name: 'Bookmark', emoji: '🧭', rarity: 'uncommon', price: 8,
    desc: 'Every 10th successful move, flag a random hidden mine.',
    onMove: (x) => {
      if (x.move!.no % 10 === 0 && x.flagMines(1)) x.say('🧭 flagged a mine')
    },
  },
  {
    id: 'scout', name: 'Search Party', emoji: '🔭', rarity: 'uncommon', price: 7,
    desc: 'Every bonus tile you uncover adds x0.05 to the base multiplier (this round).',
    onBonus: (x) => x.addMult(0.05),
  },
  // ───────── rare ─────────
  {
    id: 'extra-life', name: 'Continue?', emoji: '❤️‍🔥', rarity: 'rare', price: 14,
    desc: 'You have a 4th life. The life is lost if this card is sold.',
    maxLives: 1,
  },
  {
    id: 'crown', name: 'Users and Roles', emoji: '👑', rarity: 'rare', price: 12,
    desc: 'Adds x0.2 to your base multiplier.',
    baseMult: () => 0.2,
  },
  {
    id: 'vault', name: 'Vault', emoji: '💼', rarity: 'rare', price: 11,
    desc: 'End of round: earn $1 for every $8 you hold (max $3).',
    onRoundEnd: (x) => {
      const n = Math.min(3, Math.floor(x.s.money / 8))
      if (n > 0) x.addMoney(n)
    },
  },
  {
    id: 'twin-mirror', name: 'Carbon Copy', emoji: '🪞', rarity: 'rare', price: 11,
    desc: 'Every 4th successful move scores double.',
    moveScoreMult: (m) => (m.no % 4 === 0 ? 2 : 1),
  },
  {
    id: 'lucky-seven', name: 'Weekly Sync', emoji: '7️⃣', rarity: 'rare', price: 12,
    desc: 'Every 7th successful move adds x0.15 to the base multiplier (this round).',
    onMove: (x) => {
      if (x.move!.no % 7 === 0) {
        x.addMult(0.15)
      }
    },
  },
  {
    id: 'gravedigger', name: 'Dumpster Diving', emoji: '⚰️', rarity: 'rare', price: 11,
    desc: 'Every mine you hit earns $1 and adds x0.1 to the base multiplier (this round).',
    onMineHit: (x) => {
      x.addMoney(1)
      x.addMult(0.1)
    },
  },
  {
    id: 'harvest', name: 'Chain Mail', emoji: '🌾', rarity: 'rare', price: 10,
    desc: 'Every successful move adds +1 point.',
    onMove: (x) => x.addScore(1),
  },
  // ───────── epic ─────────
  {
    id: 'golden-ratio', name: 'Pivot Table', emoji: '🌀', rarity: 'epic', price: 20,
    desc: 'Your base multiplier is multiplied by 1.5.',
    baseMul: 1.5,
  },
  {
    id: 'phoenix', name: 'Last Backup', emoji: '🦅', rarity: 'epic', price: 20,
    desc: 'When you would lose your last life, you survive instead. Destroyed on use.',
    revive: true,
  },
  {
    id: 'fortune-wheel', name: 'Payday', emoji: '🎡', rarity: 'epic', price: 18,
    desc: 'Every round starts with +0.3 on your base multiplier. End of round: earn a random $1 to $3.',
    onRoundStart: (x) => x.addMult(0.3),
    onRoundEnd: (x) => x.addMoney(1 + x.rng.int(3)),
  },
  {
    id: 'metronome', name: 'Muscle Memory', emoji: '🎼', rarity: 'epic', price: 19,
    desc: 'While your streak is 4 or more, each move adds x0.1 instead of x0.04.',
    streakStep: (_c, s) => (s.round && s.round.streak >= 4 ? 0.06 : 0),
  },
  {
    id: 'philosopher', name: 'Scholar', emoji: '🧪', rarity: 'epic', price: 19,
    desc: 'Tiles numbered 3 or higher add 75% of their value again (not multiplied).',
    onMove: (x) => {
      if (x.move!.sum3 > 0) x.addScore(r2(x.move!.sum3 * 0.75))
    },
  },
  // ───────── legendary ─────────
  {
    id: 'infinity', name: 'Mainframe', emoji: '♾️', rarity: 'legendary', price: 28,
    desc: 'Adds x0.7 to your base multiplier.',
    baseMult: () => 0.7,
  },
  {
    id: 'midas', name: 'Stock Options', emoji: '✋', rarity: 'legendary', price: 26,
    desc: 'Tiles numbered 3 or higher add x0.02 to the base multiplier per point on them (a 4 adds x0.08, this round). Every second tile numbered 4 or higher also earns $1.',
    onMove: (x) => {
      if (x.move!.sum3 > 0) x.addMult(r2(0.02 * x.move!.sum3))
      if (x.move!.count4 > 0) {
        const before = Math.floor(x.card.counter / 2)
        x.card.counter += x.move!.count4
        const n = Math.floor(x.card.counter / 2) - before
        if (n > 0) x.addMoney(n)
      }
    },
  },
  {
    id: 'heartbeat', name: 'Autosave', emoji: '💓', rarity: 'legendary', price: 28,
    desc: 'Every 10th successful move, heal 1 life, or add x0.1 to the base multiplier (this round) if you have all your lives.',
    onMove: (x) => {
      if (x.move!.no % 10 !== 0) return
      if (hasAllLives(x.s)) x.addMult(0.1)
      else x.heal(1)
    },
  },
  {
    id: 'omniscience', name: 'Root Access', emoji: '👁️', rarity: 'legendary', price: 26,
    desc: 'Every successful move has a 1 in 7 chance to flag a random hidden mine.',
    onMove: (x) => {
      if (x.rng.chance(1 / 7) && x.flagMines(1)) x.say('👁️ saw a mine')
    },
  },
  {
    id: 'black-hole', name: 'Disk Partition', emoji: '🕳️', rarity: 'legendary', price: 26,
    desc: 'Moves that uncover 3 or more tiles score double.',
    moveScoreMult: (m) => (m.revealed >= 3 ? 2 : 1),
  },
  // ───────── mine-flagging and tile-uncovering ─────────
  {
    id: 'dowsing-rod', name: 'Red Marker', emoji: '🪄', rarity: 'common', price: 6,
    desc: 'After your first move, flag 1 random hidden mine.',
    onMove: (x) => {
      if (x.move!.no === 1 && x.flagMines(1)) x.say('🪄 flagged a mine')
    },
  },
  {
    id: 'pickaxe', name: 'Toolbox', emoji: '⛏️', rarity: 'common', price: 6,
    desc: 'After your first move, uncover 2 random hidden safe tiles.',
    onMove: (x) => {
      if (x.move!.no === 1 && x.revealSafe(2)) x.say('⛏️ dug up tiles')
    },
  },
  {
    id: 'bloodhound', name: 'Deep Search', emoji: '🐕', rarity: 'uncommon', price: 7,
    desc: 'Whenever a move uncovers a tile numbered 4 or higher, flag a random hidden mine.',
    onMove: (x) => {
      if (x.move!.maxN >= 4 && x.flagMines(1)) x.say('🐕 sniffed out a mine')
    },
  },
  {
    id: 'spade', name: 'My Documents', emoji: '🥄', rarity: 'uncommon', price: 7,
    desc: 'Moves that uncover 4 or more tiles also uncover 1 random hidden safe tile.',
    onMove: (x) => {
      if (x.move!.revealed >= 4 && x.revealSafe(1)) x.say('🥄 dug a bit deeper')
    },
  },
  {
    id: 'scavenger', name: 'Lost & Found', emoji: '🦝', rarity: 'uncommon', price: 7,
    desc: 'Every mine you hit flags 1 random hidden mine.',
    onMineHit: (x) => {
      if (x.flagMines(1)) x.say('🦝 salvaged the blast')
    },
  },
  {
    id: 'radar', name: 'Radar', emoji: '📡', rarity: 'rare', price: 13,
    desc: 'Every 6th successful move, flag a random hidden mine.',
    onMove: (x) => {
      if (x.move!.no % 6 === 0 && x.flagMines(1)) x.say('📡 contact')
    },
  },
  {
    id: 'excavator', name: 'Cache Hit', emoji: '🚜', rarity: 'rare', price: 12,
    desc: 'Every 5th successful move, uncover a random hidden safe tile.',
    onMove: (x) => {
      if (x.move!.no % 5 === 0 && x.revealSafe(1)) x.say('🚜 cleared a tile')
    },
  },
  {
    id: 'aftershock', name: 'Fatal Error', emoji: '🌋', rarity: 'epic', price: 19,
    desc: 'Every mine you hit flags 1 random hidden mine and uncovers 1 random hidden safe tile.',
    onMineHit: (x) => {
      x.flagMines(1)
      if (x.revealSafe(1)) x.say('🌋 the ground settles')
    },
  },
  {
    id: 'cartographer', name: 'Intranet', emoji: '🗺️', rarity: 'epic', price: 20,
    desc: 'After your first move, flag a tenth of the mines on the board (rounded down).',
    onMove: (x) => {
      const b = x.s.round!.board
      if (x.move!.no === 1 && x.flagMines(Math.floor(b.mines / 10))) x.say('🗺️ mapped the minefield')
    },
  },
  {
    id: 'satellite', name: 'Broadband', emoji: '🛰️', rarity: 'legendary', price: 28,
    desc: 'Every 5th successful move flags a random hidden mine. Every 15th also uncovers a random hidden safe tile.',
    onMove: (x) => {
      if (x.move!.no % 5 === 0) x.flagMines(1)
      if (x.move!.no % 15 === 0) x.revealSafe(1)
    },
  },
]

export const CARDS: Record<string, CardDef> = Object.fromEntries(defs.map((d) => [d.id, d]))
export const CARD_LIST = defs

export function cardBaseMult(c: CardInst, s: Parameters<NonNullable<CardDef['baseMult']>>[1]) {
  return r2((CARDS[c.id].baseMult?.(c, s) ?? 0) + c.mult)
}

/** Chips shown permanently on a card (until the next round). */
export function cardChips(c: CardInst, s: Parameters<NonNullable<CardDef['baseMult']>>[1]) {
  const def = CARDS[c.id]
  const chips: { kind: 'mult' | 'money' | 'score' | 'flash'; text: string }[] = []
  const m = cardBaseMult(c, s)
  if (m > 0) chips.push({ kind: 'mult', text: `+${m.toFixed(2)}x` })
  if (def.baseMul) chips.push({ kind: 'mult', text: `x${def.baseMul}` })
  if (c.money > 0) chips.push({ kind: 'money', text: `+$${c.money}` })
  if (c.score > 0) chips.push({ kind: 'score', text: `+${r2(c.score)} pts` })
  return chips
}
