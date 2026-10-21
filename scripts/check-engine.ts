/** Engine invariants. Run: npx tsx scripts/check-engine.ts */
import { applyInPlace, CARDS, CONSUMABLE_LIST, newState } from '../src/engine'

let failed = 0
const check = (ok: boolean, msg: string) => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`)
}

// using any consumable before the first move must never win (or otherwise end) the round
for (const c of CONSUMABLE_LIST) {
  const s = newState(`check-${c.id}`)
  applyInPlace(s, { type: 'debug', consumables: [c.id] }, false)
  applyInPlace(s, { type: 'useConsumable', slot: 0 }, false)
  check(s.phase === 'round' && !s.round!.board.generated, `${c.id} before the first move keeps phase 'round'`)
  // and the first move still works normally afterwards
  applyInPlace(s, { type: 'reveal', index: 0 }, false)
  check(s.round!.board.generated && s.round!.target > 0, `${c.id}: board generates on the first move (target ${s.round!.target})`)
}

// shop never offers the same consumable twice, including after rerolls
for (let i = 0; i < 300; i++) {
  const s = newState(`shop-${i}`)
  applyInPlace(s, { type: 'debug', phase: 'shop', money: 99 }, false)
  for (let k = 0; k < 3; k++) {
    const ids = s.shop!.cons.map((o) => o!.id)
    if (new Set(ids).size !== ids.length) check(false, `duplicate consumables ${ids} (seed ${i}, reroll ${k})`)
    applyInPlace(s, { type: 'reroll' }, false)
  }
}
check(true, 'shop consumable offers are distinct')

// the first shop (after round 1, about $5-6 to spend) only offers common cards, rerolls included
{
  let bad = 0
  for (let i = 0; i < 300; i++) {
    const s = newState(`first-shop-${i}`)
    applyInPlace(s, { type: 'debug', phase: 'shop', round: 1, money: 99 }, false)
    for (let k = 0; k < 3; k++) {
      for (const o of s.shop!.cards) if (o && CARDS[o.id].rarity !== 'common') bad++
      applyInPlace(s, { type: 'reroll' }, false)
    }
  }
  check(bad === 0, `first shop only offers common cards (${bad} others)`)
}

if (failed) {
  console.log(`${failed} check(s) failed`)
  process.exit(1)
}
