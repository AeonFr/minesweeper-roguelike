/**
 * Balance simulator.
 *   npm run sim -- curve [n]            per-round stats with no items
 *   npm run sim -- run [n]              full runs with a greedy shopping bot
 *   npm run sim -- cards [round] [n]    each card alone vs baseline, in one round
 *   npm run sim -- loadouts [k] [n]     random k-card loadouts (shop odds) per round: how little of the board is enough?
 */
import { CARD_LIST, emptyBoard, generate, hashSeed, makeRng, mineCount, rarityWeights, roundSpec, type Rarity } from '../src/engine'
import { isolatedRound, playRun, type RoundResult } from './bot'

const [mode = 'curve', a1, a2] = process.argv.slice(2)
const avg = (xs: number[]) => (xs.length ? xs.reduce((p, c) => p + c, 0) / xs.length : 0)
const pct = (x: number) => (x * 100).toFixed(0).padStart(3) + '%'
const f = (x: number, d = 1) => x.toFixed(d).padStart(6)

function summarize(rs: RoundResult[]) {
  const wins = rs.filter((r) => r.won)
  return {
    win: wins.length / rs.length,
    completion: avg(wins.map((r) => r.completion)),
    moves: avg(rs.map((r) => r.moves)),
    guesses: avg(rs.map((r) => r.guesses)),
    mistakes: avg(rs.map((r) => r.mistakes)),
    payout: avg(wins.map((r) => r.payout)),
    // "close finish": won with the last move leaving score ratio barely over 1 and few tiles needed
    scoreRatio: avg(wins.map((r) => r.scoreRatio)),
  }
}

function boardStats(round: number, n: number) {
  let zero = 0
  let numbered = 0
  let safe = 0
  let all = 0
  let bonus = 0
  for (let i = 0; i < n; i++) {
    const spec = roundSpec(round)
    const b = emptyBoard(spec.cols, spec.rows, mineCount(spec))
    const rng = makeRng(hashSeed(`bs-${round}-${i}`))
    generate(b, Math.floor(b.rows / 2) * b.cols + Math.floor(b.cols / 2), spec.bonusCells, rng)
    for (const t of b.tiles) {
      all++
      if (t.bonus) bonus++
      if (t.mine) continue
      safe++
      if (t.n === 0) zero++
      else numbered++
    }
  }
  return { empty: zero / safe, numbered: numbered / safe, mines: 1 - safe / all, bonus: bonus / n }
}

if (mode === 'curve') {
  const n = Number(a1 ?? 300)
  console.log('round | mines%  empty% of safe  numbered% of safe  bonus tiles')
  for (let round = 1; round <= 12; round++) {
    const b = boardStats(round, 200)
    console.log(`${String(round).padStart(5)} | ${pct(b.mines)}    ${pct(b.empty)}            ${pct(b.numbered)}               ${b.bonus.toFixed(1)}`)
  }
  console.log()
  console.log('round | win%  cleared@win  moves guesses mistakes payout')
  for (let round = 1; round <= 12; round++) {
    const rs = Array.from({ length: n }, (_, i) => isolatedRound(`curve-${round}-${i}`, round, []))
    const s = summarize(rs)
    console.log(
      `${String(round).padStart(5)} | ${pct(s.win)}  ${pct(s.completion)}      ${f(s.moves)} ${f(s.guesses)} ${f(s.mistakes, 2)}     ${f(s.payout)}`,
    )
  }
} else if (mode === 'run') {
  const n = Number(a1 ?? 200)
  const reached: number[] = []
  let wins = 0
  const perRound: RoundResult[][] = Array.from({ length: 12 }, () => [])
  for (let i = 0; i < n; i++) {
    const r = playRun(`run-${i}`)
    reached.push(r.reached)
    if (r.won) wins++
    r.rounds.forEach((x) => perRound[x.round - 1].push(x))
  }
  console.log(`runs: ${n}  won: ${pct(wins / n)}  avg round reached: ${avg(reached).toFixed(2)}`)
  const dist = Array.from({ length: 12 }, (_, i) => reached.filter((x) => x === i + 1).length)
  console.log('died at round:', dist.map((d, i) => `${i + 1}:${d}`).join('  '))
  console.log('round | played win%  cleared@win  moves  payout | $ at shop  $ left  cards owned')
  perRound.forEach((rs, i) => {
    if (!rs.length) return
    const s = summarize(rs)
    console.log(`${String(i + 1).padStart(5)} | ${String(rs.length).padStart(6)} ${pct(s.win)}  ${pct(s.completion)}      ${f(s.moves)} ${f(s.payout)} | ${f(avg(rs.map((r) => r.shopMoney ?? 0)))} ${f(avg(rs.map((r) => r.moneyLeft ?? 0)))} ${f(avg(rs.map((r) => r.cardsOwned ?? 0)), 2)}`)
  })
} else if (mode === 'cards') {
  const round = Number(a1 ?? 6)
  const n = Number(a2 ?? 300)
  const base = summarize(Array.from({ length: n }, (_, i) => isolatedRound(`card-${i}`, round, [])))
  console.log(`round ${round}, baseline: win ${pct(base.win)} cleared@win ${pct(base.completion)} payout ${base.payout.toFixed(2)}`)
  console.log('card                 rarity     price | win%   dWin  cleared dClear  dPay')
  const rows = CARD_LIST.map((c) => {
    const s = summarize(Array.from({ length: n }, (_, i) => isolatedRound(`card-${i}`, round, [c.id])))
    return { c, s }
  })
  for (const { c, s } of rows) {
    console.log(
      `${(c.emoji + ' ' + c.name).padEnd(22)}${c.rarity.padEnd(10)} $${String(c.price).padStart(2)} | ${pct(s.win)} ${((s.win - base.win) * 100).toFixed(0).padStart(5)}  ${pct(s.completion)}  ${((s.completion - base.completion) * 100).toFixed(0).padStart(5)}  ${(s.payout - base.payout).toFixed(2).padStart(5)}`,
    )
  }
}

if (mode === 'loadouts') {
  const k = Number(a1 ?? 4)
  const n = Number(a2 ?? 300)
  console.log(`random ${k}-card loadouts, n=${n} per round`)
  console.log('round | win%  cleared@win(mean)  p10   p50   <40%cleared  mean score/target')
  for (const round of [2, 4, 6, 8, 10, 12]) {
    const w = rarityWeights(round + 1)
    const rs: RoundResult[] = []
    for (let i = 0; i < n; i++) {
      const rng = makeRng(hashSeed(`lo-${round}-${i}`))
      const pool = CARD_LIST.slice()
      const picks: string[] = []
      while (picks.length < k) {
        const c = rng.weighted(pool, (d) => w[d.rarity as Rarity] || 0.0001)
        pool.splice(pool.indexOf(c), 1)
        picks.push(c.id)
      }
      rs.push(isolatedRound(`lo-${round}-${i}`, round, picks))
    }
    const wins = rs.filter((r) => r.won)
    const comp = wins.map((r) => r.completion).sort((a, b) => a - b)
    const q = (p: number) => comp[Math.floor(p * (comp.length - 1))] ?? 0
    const low = wins.filter((r) => r.completion < 0.4).length / rs.length
    console.log(
      `${String(round).padStart(5)} | ${pct(wins.length / rs.length)}  ${pct(avg(comp))}              ${pct(q(0.1))}  ${pct(q(0.5))}  ${pct(low)}        ${avg(wins.map((r) => r.scoreRatio)).toFixed(2)}`,
    )
  }
}
