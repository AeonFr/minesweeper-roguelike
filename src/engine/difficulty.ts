export const MAX_ROUND = 12
export const CARD_SLOTS = 5
export const CONSUMABLE_SLOTS = 2
export const BASE_HEARTS = 3
export const BASE_STREAK_STEP = 0.05

export interface RoundSpec {
  cols: number
  rows: number
  density: number
  bonusCells: number
}

const DIMS: [number, number, number][] = [
  [7, 7, 0.12],
  [8, 8, 0.13],
  [8, 9, 0.14],
  [9, 9, 0.15],
  [9, 10, 0.16],
  [10, 10, 0.17],
  [10, 11, 0.185],
  [10, 12, 0.21],
  [11, 12, 0.225],
  [11, 13, 0.245],
  [12, 14, 0.265],
  [12, 15, 0.29],
]

export function roundSpec(round: number): RoundSpec {
  const [cols, rows, density] = DIMS[Math.min(round, MAX_ROUND) - 1]
  return { cols, rows, density, bonusCells: 2 + Math.floor(round / 3) }
}

export const mineCount = (spec: RoundSpec) => Math.round(spec.cols * spec.rows * spec.density)

/** Base payout for clearing a round. */
export const roundReward = (round: number) => 3 + Math.ceil(round / 2)

export const sellPrice = (price: number) => Math.max(1, Math.floor(price / 2))

export const rerollCost = (rerolls: number) => 2 + rerolls

/** Shop rarity weights for the round about to be played. */
export function rarityWeights(upcomingRound: number) {
  const r = upcomingRound
  return {
    common: Math.max(25, 64 - 3 * r),
    uncommon: 30,
    rare: r >= 3 ? Math.min(22, 6 + 2 * (r - 3)) : 0,
    epic: r >= 6 ? Math.min(16, 3 * (r - 5)) : 0,
    legendary: r >= 9 ? Math.min(10, 2 * (r - 8)) : 0,
  }
}
