import type { CardDef, CardInst } from './types'

const r2 = (n: number) => Math.round(n * 100) / 100

const defs: CardDef[] = [
  // ───────── common ─────────
  {
    id: 'steady-hand', name: 'Steady Hand', emoji: '🧤', rarity: 'common', price: 3,
    desc: 'Adds x0.05 to your base multiplier.',
    baseMult: () => 0.05,
  },
  {
    id: 'pocket-change', name: 'Pocket Change', emoji: '🪙', rarity: 'common', price: 4,
    desc: 'Earn $1 at the end of every round.',
    onRoundEnd: (x) => x.addMoney(1),
  },
  {
    id: 'lucky-clover', name: 'Lucky Clover', emoji: '🍀', rarity: 'common', price: 5,
    desc: 'Every 10th successful move, uncover a random hidden safe tile.',
    onMove: (x) => {
      if (x.move!.no % 10 === 0 && x.revealSafe(1)) x.say('🍀 uncovered a tile')
    },
  },
  {
    id: 'lucky-socks', name: 'Lucky Socks', emoji: '🧦', rarity: 'common', price: 5,
    desc: 'Every 3rd successful move adds x0.05 to the base multiplier (this round).',
    onMove: (x) => {
      if (x.move!.no % 3 === 0) x.addMult(0.05)
    },
  },
  {
    id: 'counting-beads', name: 'Counting Beads', emoji: '📿', rarity: 'common', price: 5,
    desc: 'Every tile numbered 1 is worth +1 extra point.',
    tileBonus: (n) => (n === 1 ? 1 : 0),
  },
  {
    id: 'tidy-sweeper', name: 'Tidy Sweeper', emoji: '🧹', rarity: 'common', price: 4,
    desc: 'Moves that uncover 4 or more tiles add +3 points.',
    onMove: (x) => {
      if (x.move!.revealed >= 4) x.addScore(3)
    },
  },
  {
    id: 'cautious-cat', name: 'Cautious Cat', emoji: '🐱', rarity: 'common', price: 5,
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
    id: 'piggy-bank', name: 'Piggy Bank', emoji: '🐷', rarity: 'common', price: 4,
    desc: 'Earn $1 at the end of a round if you still have 3 or more hearts.',
    onRoundEnd: (x) => {
      if (x.s.hearts >= 3) x.addMoney(1)
    },
  },
  // ───────── uncommon ─────────
  {
    id: 'magnifier', name: 'Magnifier', emoji: '🔍', rarity: 'uncommon', price: 5,
    desc: 'Every tile numbered 2 is worth +1 extra point.',
    tileBonus: (n) => (n === 2 ? 1 : 0),
  },
  {
    id: 'hot-streak', name: 'Hot Streak', emoji: '🔥', rarity: 'uncommon', price: 6,
    desc: 'Each consecutive successful move adds x0.08 instead of x0.05.',
    streakStep: () => 0.03,
  },
  {
    id: 'tax-collector', name: 'Tax Collector', emoji: '🏦', rarity: 'uncommon', price: 6,
    desc: 'End of round: earn $1 for every 8 successful moves (max $4).',
    onRoundEnd: (x) => {
      const n = Math.min(4, Math.floor(x.s.round!.moves / 8))
      if (n > 0) x.addMoney(n)
    },
  },
  {
    id: 'gambler', name: 'Gambler', emoji: '🎲', rarity: 'uncommon', price: 6,
    desc: 'Every successful move has a 1 in 10 chance to earn $1.',
    onMove: (x) => {
      if (x.rng.chance(1 / 10)) x.addMoney(1)
    },
  },
  {
    id: 'first-blood', name: 'First Blood', emoji: '🩸', rarity: 'uncommon', price: 7,
    desc: 'Your first move of each round scores triple.',
    moveScoreMult: (m) => (m.no === 1 ? 3 : 1),
  },
  {
    id: 'sapling', name: 'Sapling', emoji: '🌱', rarity: 'uncommon', price: 7,
    desc: 'Every successful move adds x0.01 to the base multiplier (up to x0.25 per round).',
    onMove: (x) => {
      if (x.card.mult < 0.25) x.addMult(0.01)
    },
  },
  {
    id: 'lantern', name: 'Lantern', emoji: '🏮', rarity: 'uncommon', price: 6,
    desc: 'Hitting a mine uncovers 2 random hidden safe tiles.',
    onMineHit: (x) => {
      if (x.revealSafe(2)) x.say('🏮 lit the way')
    },
  },
  {
    id: 'compass', name: 'Compass', emoji: '🧭', rarity: 'uncommon', price: 7,
    desc: 'Every 6th successful move, flag a random hidden mine.',
    onMove: (x) => {
      if (x.move!.no % 6 === 0 && x.flagMines(1)) x.say('🧭 flagged a mine')
    },
  },
  {
    id: 'scout', name: 'Scout', emoji: '🔭', rarity: 'uncommon', price: 6,
    desc: 'Every bonus cell you uncover adds x0.05 to the base multiplier (this round).',
    onBonus: (x) => x.addMult(0.05),
  },
  // ───────── rare ─────────
  {
    id: 'extra-heart', name: 'Extra Heart', emoji: '❤️‍🔥', rarity: 'rare', price: 12,
    desc: 'You have a 4th heart. The heart is lost if this card is sold.',
    maxHearts: 1,
  },
  {
    id: 'crown', name: 'Crown', emoji: '👑', rarity: 'rare', price: 10,
    desc: 'Adds x0.25 to your base multiplier.',
    baseMult: () => 0.25,
  },
  {
    id: 'vault', name: 'Vault', emoji: '💼', rarity: 'rare', price: 9,
    desc: 'End of round: earn $1 for every $5 you hold (max $5).',
    onRoundEnd: (x) => {
      const n = Math.min(5, Math.floor(x.s.money / 5))
      if (n > 0) x.addMoney(n)
    },
  },
  {
    id: 'twin-mirror', name: 'Twin Mirror', emoji: '🪞', rarity: 'rare', price: 9,
    desc: 'Every 4th successful move scores double.',
    moveScoreMult: (m) => (m.no % 4 === 0 ? 2 : 1),
  },
  {
    id: 'lucky-seven', name: 'Lucky Seven', emoji: '7️⃣', rarity: 'rare', price: 10,
    desc: 'Every 7th successful move earns $1 and adds x0.1 to the base multiplier (this round).',
    onMove: (x) => {
      if (x.move!.no % 7 === 0) {
        x.addMoney(1)
        x.addMult(0.1)
      }
    },
  },
  {
    id: 'gravedigger', name: 'Gravedigger', emoji: '⚰️', rarity: 'rare', price: 9,
    desc: 'Every mine you hit earns $2 and adds x0.1 to the base multiplier (this round).',
    onMineHit: (x) => {
      x.addMoney(2)
      x.addMult(0.1)
    },
  },
  {
    id: 'harvest', name: 'Harvest', emoji: '🌾', rarity: 'rare', price: 8,
    desc: 'Every successful move adds +1 point.',
    onMove: (x) => x.addScore(1),
  },
  // ───────── epic ─────────
  {
    id: 'golden-ratio', name: 'Golden Ratio', emoji: '🌀', rarity: 'epic', price: 14,
    desc: 'Your base multiplier is multiplied by 1.4.',
    baseMul: 1.4,
  },
  {
    id: 'phoenix', name: 'Phoenix Feather', emoji: '🦅', rarity: 'epic', price: 14,
    desc: 'When you would lose your last heart, you survive instead. Destroyed on use.',
    revive: true,
  },
  {
    id: 'fortune-wheel', name: 'Fortune Wheel', emoji: '🎡', rarity: 'epic', price: 12,
    desc: 'End of round: earn a random $1 to $6.',
    onRoundEnd: (x) => x.addMoney(1 + x.rng.int(6)),
  },
  {
    id: 'metronome', name: 'Metronome', emoji: '🎼', rarity: 'epic', price: 13,
    desc: 'While your streak is 15 or more, each move adds x0.10 instead of x0.05.',
    streakStep: (_c, s) => (s.round && s.round.streak >= 15 ? 0.05 : 0),
  },
  {
    id: 'philosopher', name: 'Philosopher', emoji: '🧪', rarity: 'epic', price: 13,
    desc: 'Tiles numbered 3 or higher are worth double.',
    tileBonus: (n) => (n >= 3 ? n : 0),
  },
  // ───────── legendary ─────────
  {
    id: 'infinity', name: 'Infinity', emoji: '♾️', rarity: 'legendary', price: 20,
    desc: 'Adds x0.5 to your base multiplier.',
    baseMult: () => 0.5,
  },
  {
    id: 'midas', name: 'Midas Touch', emoji: '✋', rarity: 'legendary', price: 18,
    desc: 'Every tile numbered 4 or higher you uncover earns $1.',
    onMove: (x) => {
      if (x.move!.count4 > 0) x.addMoney(x.move!.count4)
    },
  },
  {
    id: 'heartbeat', name: 'Heartbeat', emoji: '💓', rarity: 'legendary', price: 20,
    desc: 'Every 25th successful move, heal 1 heart.',
    onMove: (x) => {
      if (x.move!.no % 25 === 0) x.heal(1)
    },
  },
  {
    id: 'omniscience', name: 'All-Seeing Eye', emoji: '👁️', rarity: 'legendary', price: 18,
    desc: 'Every successful move has a 1 in 3 chance to flag a random hidden mine.',
    onMove: (x) => {
      if (x.rng.chance(1 / 3) && x.flagMines(1)) x.say('👁️ saw a mine')
    },
  },
  {
    id: 'black-hole', name: 'Black Hole', emoji: '🕳️', rarity: 'legendary', price: 18,
    desc: 'Moves that uncover 10 or more tiles score double.',
    moveScoreMult: (m) => (m.revealed >= 10 ? 2 : 1),
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
  if (c.score > 0) chips.push({ kind: 'score', text: `+${r2(c.score)}` })
  return chips
}
