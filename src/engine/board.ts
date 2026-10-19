import type { Rng } from './rng'
import type { Board, BonusKind, Tile } from './types'

export function neighbors(cols: number, rows: number, i: number): number[] {
  const x = i % cols
  const y = (i / cols) | 0
  const out: number[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) out.push(ny * cols + nx)
    }
  }
  return out
}

export const blankTile = (): Tile => ({
  mine: false,
  n: 0,
  revealed: false,
  flagged: false,
  exploded: false,
  bonus: null,
})

export function emptyBoard(cols: number, rows: number, mines: number): Board {
  return {
    cols,
    rows,
    tiles: Array.from({ length: cols * rows }, blankTile),
    generated: false,
    mines,
    totalPoints: 0,
    safeLeft: cols * rows - mines,
  }
}

const BONUS_WEIGHTS: [BonusKind, number][] = [
  ['coin', 28],
  ['star', 24],
  ['spark', 14],
  ['flame', 12],
  ['crystal', 10],
  ['gift', 6],
  ['shield', 4],
  ['heart', 3],
]

/** Chance that a bonus cell is a lure sitting on a mine. */
export const LURE_CHANCE = 0.12

/**
 * Places mines (never on the first click or its neighbours, so the first move
 * always opens an empty area), computes numbers, then places bonus cells.
 */
export function generate(board: Board, firstIdx: number, bonusCount: number, rng: Rng): void {
  const { cols, rows, tiles } = board
  const zone = new Set([firstIdx, ...neighbors(cols, rows, firstIdx)])
  let candidates = tiles.map((_, i) => i).filter((i) => !zone.has(i))
  // tiny boards: shrink the safe zone rather than failing
  if (candidates.length < board.mines) candidates = tiles.map((_, i) => i).filter((i) => i !== firstIdx)
  const mineIdx = rng.shuffle(candidates).slice(0, board.mines)
  for (const i of mineIdx) tiles[i].mine = true
  let total = 0
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].mine) continue
    tiles[i].n = neighbors(cols, rows, i).filter((j) => tiles[j].mine).length
    total += tiles[i].n
  }
  board.totalPoints = total
  board.generated = true

  const lures = rng.shuffle(mineIdx)
  const safe = rng.shuffle(tiles.map((_, i) => i).filter((i) => !tiles[i].mine && i !== firstIdx))
  const numbered = safe.filter((i) => tiles[i].n > 0)
  const pool = numbered.length >= bonusCount ? numbered : safe
  for (let k = 0; k < bonusCount; k++) {
    const lure = rng.chance(LURE_CHANCE) && lures.length > 0
    const idx = lure ? lures.pop()! : pool.pop()
    if (idx === undefined) break
    tiles[idx].bonus = rng.weighted(BONUS_WEIGHTS, (b) => b[1])[0]
  }
}

/** Reveals `start`, expanding through empty tiles. Returns newly revealed indices. */
export function flood(board: Board, start: number): number[] {
  const { cols, rows, tiles } = board
  const out: number[] = []
  const stack = [start]
  while (stack.length) {
    const i = stack.pop()!
    const t = tiles[i]
    if (t.revealed || t.flagged || t.mine) continue
    t.revealed = true
    board.safeLeft--
    out.push(i)
    if (t.n === 0) for (const j of neighbors(cols, rows, i)) stack.push(j)
  }
  return out
}
