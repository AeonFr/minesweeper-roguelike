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
    desc: 'Every tile numbered 1 you uncover adds +0.5 points (not multiplied).',
    onMove: (x) => {
      if (x.move!.count1 > 0) x.addScore(r2(x.move!.count1 * 0.5))
    },
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
    desc: 'Every tile numbered 2 you uncover adds +0.75 points (not multiplied).',
    onMove: (x) => {
      if (x.move!.count2 > 0) x.addScore(r2(x.move!.count2 * 0.75))
    },
  },
  {
    id: 'hot-streak', name: 'Hot Streak', emoji: '🔥', rarity: 'uncommon', price: 6,
    desc: 'Each consecutive successful move adds x0.07 instead of x0.05.',
    streakStep: () => 0.02,
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
    desc: 'Your first move of each round scores double.',
    moveScoreMult: (m) => (m.no === 1 ? 2 : 1),
  },
  {
    id: 'sapling', name: 'Sapling', emoji: '🌱', rarity: 'uncommon', price: 7,
    desc: 'Every successful move adds x0.01 to the base multiplier (up to x0.2 per round).',
    onMove: (x) => {
      if (x.card.mult < 0.2) x.addMult(0.01)
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
    desc: 'Adds x0.2 to your base multiplier.',
    baseMult: () => 0.2,
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
    id: 'gravedigger', name: 'Grave Digger', emoji: '⚰️', rarity: 'rare', price: 9,
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
    desc: 'Your base multiplier is multiplied by 1.3.',
    baseMul: 1.3,
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
    desc: 'While your streak is 15 or more, each move adds x0.08 instead of x0.05.',
    streakStep: (_c, s) => (s.round && s.round.streak >= 15 ? 0.03 : 0),
  },
  {
    id: 'philosopher', name: 'Scholar', emoji: '🧪', rarity: 'epic', price: 13,
    desc: 'Tiles numbered 3 or higher add 75% of their value again (not multiplied).',
    onMove: (x) => {
      if (x.move!.sum3 > 0) x.addScore(r2(x.move!.sum3 * 0.75))
    },
  },
  // ───────── legendary ─────────
  {
    id: 'infinity', name: 'Infinity', emoji: '♾️', rarity: 'legendary', price: 20,
    desc: 'Adds x0.35 to your base multiplier.',
    baseMult: () => 0.35,
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
    desc: 'Every successful move has a 1 in 4 chance to flag a random hidden mine.',
    onMove: (x) => {
      if (x.rng.chance(1 / 4) && x.flagMines(1)) x.say('👁️ saw a mine')
    },
  },
  {
    id: 'black-hole', name: 'Black Hole', emoji: '🕳️', rarity: 'legendary', price: 18,
    desc: 'Moves that uncover 12 or more tiles score double.',
    moveScoreMult: (m) => (m.revealed >= 12 ? 2 : 1),
  },
  // ───────── mine-flagging and tile-uncovering ─────────
  {
    id: 'dowsing-rod', name: 'Dowsing Rod', emoji: '🪄', rarity: 'common', price: 5,
    desc: 'After your first move, flag 1 random hidden mine for every 14 mines on the board (rounded up).',
    onMove: (x) => {
      if (x.move!.no === 1 && x.flagMines(Math.ceil(x.s.round!.board.mines / 14))) x.say('🪄 flagged mines')
    },
  },
  {
    id: 'pickaxe', name: 'Pickaxe', emoji: '⛏️', rarity: 'common', price: 5,
    desc: 'After your first move, uncover 3 random hidden safe tiles.',
    onMove: (x) => {
      if (x.move!.no === 1 && x.revealSafe(3)) x.say('⛏️ dug up tiles')
    },
  },
  {
    id: 'bloodhound', name: 'Sniffer Dog', emoji: '🐕', rarity: 'uncommon', price: 6,
    desc: 'Whenever a move uncovers a tile numbered 4 or higher, flag a random hidden mine.',
    onMove: (x) => {
      if (x.move!.maxN >= 4 && x.flagMines(1)) x.say('🐕 sniffed out a mine')
    },
  },
  {
    id: 'spade', name: 'Spade', emoji: '🥄', rarity: 'uncommon', price: 6,
    desc: 'Moves that uncover 4 or more tiles also uncover 1 random hidden safe tile.',
    onMove: (x) => {
      if (x.move!.revealed >= 4 && x.revealSafe(1)) x.say('🥄 dug a bit deeper')
    },
  },
  {
    id: 'scavenger', name: 'Looter', emoji: '🦝', rarity: 'uncommon', price: 6,
    desc: 'Every mine you hit flags 2 random hidden mines.',
    onMineHit: (x) => {
      if (x.flagMines(2)) x.say('🦝 salvaged the blast')
    },
  },
  {
    id: 'radar', name: 'Radar', emoji: '📡', rarity: 'rare', price: 11,
    desc: 'Every 4th successful move, flag a random hidden mine.',
    onMove: (x) => {
      if (x.move!.no % 4 === 0 && x.flagMines(1)) x.say('📡 contact')
    },
  },
  {
    id: 'excavator', name: 'Excavator', emoji: '🚜', rarity: 'rare', price: 10,
    desc: 'Every 5th successful move, uncover a random hidden safe tile.',
    onMove: (x) => {
      if (x.move!.no % 5 === 0 && x.revealSafe(1)) x.say('🚜 cleared a tile')
    },
  },
  {
    id: 'aftershock', name: 'Tremor', emoji: '🌋', rarity: 'epic', price: 13,
    desc: 'Every mine you hit flags 1 random hidden mine and uncovers 2 random hidden safe tiles.',
    onMineHit: (x) => {
      x.flagMines(1)
      if (x.revealSafe(2)) x.say('🌋 the ground settles')
    },
  },
  {
    id: 'cartographer', name: 'Atlas', emoji: '🗺️', rarity: 'epic', price: 14,
    desc: 'After your first move, flag a sixth of the mines on the board.',
    onMove: (x) => {
      const b = x.s.round!.board
      if (x.move!.no === 1 && x.flagMines(Math.floor(b.mines / 6))) x.say('🗺️ mapped the minefield')
    },
  },
  {
    id: 'satellite', name: 'Satellite', emoji: '🛰️', rarity: 'legendary', price: 20,
    desc: 'Every 3rd successful move flags a random hidden mine. Every 6th also uncovers a random hidden safe tile.',
    onMove: (x) => {
      if (x.move!.no % 3 === 0) x.flagMines(1)
      if (x.move!.no % 6 === 0) x.revealSafe(1)
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
  if (c.score > 0) chips.push({ kind: 'score', text: `+${r2(c.score)}` })
  return chips
}
