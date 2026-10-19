/**
 * Balance simulator.
 *   npm run sim -- curve [n]            per-round stats with no items
 *   npm run sim -- run [n]              full runs with a greedy shopping bot
 *   npm run sim -- cards [round] [n]    each card alone vs baseline, in one round
 */
import { CARD_LIST } from '../src/engine'
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

if (mode === 'curve') {
  const n = Number(a1 ?? 300)
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
  console.log('round | played win%  cleared@win  moves  payout')
  perRound.forEach((rs, i) => {
    if (!rs.length) return
    const s = summarize(rs)
    console.log(`${String(i + 1).padStart(5)} | ${String(rs.length).padStart(6)} ${pct(s.win)}  ${pct(s.completion)}      ${f(s.moves)} ${f(s.payout)}`)
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
