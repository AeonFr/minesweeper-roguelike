export const MAX_ROUND = 12
export const CARD_SLOTS = 5
export const CONSUMABLE_SLOTS = 2
export const BASE_LIVES = 3
export const BASE_STREAK_STEP = 0.04

export interface RoundSpec {
  cols: number
  rows: number
  density: number
  bonusCells: number
}

const DIMS: [number, number, number][] = [
  [7, 7, 0.14],
  [8, 8, 0.15],
  [8, 9, 0.16],
  [9, 9, 0.17],
  [9, 10, 0.18],
  [10, 10, 0.19],
  [10, 11, 0.2],
  [10, 12, 0.215],
  [11, 12, 0.225],
  [11, 13, 0.25],
  [12, 14, 0.26],
  [12, 16, 0.265],
]

export function roundSpec(round: number): RoundSpec {
  const [cols, rows, density] = DIMS[Math.min(round, MAX_ROUND) - 1]
  return { cols, rows, density, bonusCells: 1 + Math.floor(round / 4) }
}

export const mineCount = (spec: RoundSpec) => Math.round(spec.cols * spec.rows * spec.density)

/** Base payout for clearing a round. The first four rounds pay $1 extra, so one slip doesn't leave nothing to spend. */
export const roundReward = (round: number) => 1 + Math.ceil(round / 4) + (round <= 4 ? 1 : 0)

export const sellPrice = (price: number) => Math.max(1, Math.floor(price / 2))

export const rerollCost = (rerolls: number) => 2 + rerolls

/** Shop rarity weights for the round about to be played. */
export function rarityWeights(upcomingRound: number) {
  const r = upcomingRound
  return {
    common: Math.max(25, 64 - 3 * r),
    // the first shop (round 2 upcoming) only has about $5-6 to spend, so only cheap cards show up there
    uncommon: r >= 3 ? 30 : 0,
    rare: r >= 4 ? Math.min(22, 6 + 2 * (r - 4)) : 0,
    epic: r >= 6 ? Math.min(16, 3 * (r - 5)) : 0,
    legendary: r >= 9 ? Math.min(10, 2 * (r - 8)) : 0,
  }
}
