import type { Rng } from './rng'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type BonusKind = 'coin' | 'star' | 'spark' | 'heart' | 'flame' | 'crystal' | 'gift' | 'shield'
export type Phase = 'round' | 'shop' | 'won' | 'lost'

export interface Tile {
  mine: boolean
  n: number
  revealed: boolean
  flagged: boolean
  exploded: boolean
  bonus: BonusKind | null
}

export interface Board {
  cols: number
  rows: number
  tiles: Tile[]
  generated: boolean
  mines: number
  /** Sum of all numbers on safe tiles. Filled in when the board is generated. */
  totalPoints: number
  safeLeft: number
}

/** Something that happened during a move: a short label for the chip, and the full explanation for its tooltip. */
export interface GameEvent {
  text: string
  detail: string
}

export interface LastMove {
  no: number
  /** raw tile score from revealed tiles */
  points: number
  mult: number
  /** everything the move added to the score (tiles, bonus tiles, cards) */
  gain: number
  revealed: number
  hit: boolean
  blocked: boolean
  events: GameEvent[]
}

export interface RoundState {
  board: Board
  score: number
  target: number
  streak: number
  /** extra multiplier from bonus tiles / consumables, this round only */
  bonusMult: number
  shield: number
  moves: number
  mistakes: number
  lostHeart: boolean
  streakSafe: boolean
  last: LastMove | null
}

export interface CardInst {
  uid: number
  id: string
  /** per-round scratch counter */
  counter: number
  /** multiplier accumulated this round */
  mult: number
  money: number
  score: number
  /** short texts for the last move, cleared before every move */
  flash: string[]
  log: string
}

export interface Offer {
  id: string
  price: number
}

export interface Shop {
  cards: (Offer | null)[]
  cons: (Offer | null)[]
  rerolls: number
}

export interface PayoutLine {
  label: string
  amount: number
}

export interface GameState {
  v: 1
  seed: string
  rng: number
  phase: Phase
  roundNo: number
  money: number
  hearts: number
  cards: CardInst[]
  consumables: string[]
  round: RoundState | null
  shop: Shop | null
  payout: PayoutLine[]
  nextUid: number
  stats: { moves: number; mistakes: number; bestStreak: number; totalScore: number }
  msg: { text: string; seq: number } | null
  history: Command[]
}

export type Command =
  | { type: 'reveal'; index: number }
  | { type: 'chord'; index: number }
  | { type: 'flag'; index: number }
  | { type: 'useConsumable'; slot: number }
  | { type: 'buyCard'; offer: number }
  | { type: 'buyConsumable'; offer: number }
  | { type: 'sellCard'; slot: number }
  | { type: 'sellConsumable'; slot: number }
  | { type: 'reroll' }
  | { type: 'nextRound' }
  | {
      type: 'debug'
      round?: number
      phase?: 'round' | 'shop'
      money?: number
      hearts?: number
      cards?: string[]
      consumables?: string[]
    }

export interface MoveInfo {
  no: number
  points: number
  revealed: number
  streak: number
  mult: number
  maxN: number
  /** how many uncovered tiles are numbered 4 or higher */
  count4: number
  count1: number
  count2: number
  /** sum of the numbers on uncovered tiles numbered 3 or higher */
  sum3: number
}

export interface HookCtx {
  s: GameState
  card: CardInst
  rng: Rng
  move: MoveInfo | null
  addMoney(n: number): void
  addMult(n: number): void
  addScore(n: number): void
  revealSafe(n: number): number
  flagMines(n: number): number
  heal(n: number): void
  keepStreak(): void
  say(text: string): void
}

export interface CardDef {
  id: string
  name: string
  emoji: string
  rarity: Rarity
  price: number
  desc: string
  /** added to the base multiplier */
  baseMult?: (c: CardInst, s: GameState) => number
  /** multiplies (1 + additive base) */
  baseMul?: number
  /** added to the per-streak multiplier step (0.04) */
  streakStep?: (c: CardInst, s: GameState) => number
  /** multiplies the score of the move */
  moveScoreMult?: (m: MoveInfo, c: CardInst, s: GameState) => number
  maxHearts?: number
  /** saves you from a lethal hit once, then is destroyed */
  revive?: boolean
  onMove?: (x: HookCtx) => void
  onMineHit?: (x: HookCtx) => void
  onRoundStart?: (x: HookCtx) => void
  onRoundEnd?: (x: HookCtx) => void
  onBonus?: (x: HookCtx) => void
}

export interface ConsumableDef {
  id: string
  name: string
  emoji: string
  price: number
  desc: string
}
