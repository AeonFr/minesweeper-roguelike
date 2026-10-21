/** Every icon the UI asks for must exist at the exact size it is drawn at (cards 48, items 32, tiles 16). */
import { existsSync } from 'node:fs'
import { BONUS_INFO, CARD_LIST, CONSUMABLE_LIST } from '../src/engine'
import { BONUS_ICON, CARD_ICON, ITEM_ICON, UI_ICON } from '../src/ui/icons'

let bad = 0
const need = (what: string, file: string, size: 16 | 32 | 48, optional = false) => {
  if (file.endsWith('.svg') || existsSync(`public/icons/${size}/${file}.png`)) return
  if (optional) return console.log(`note ${what}: no ${size}px ${file} (shown without the small icon)`)
  bad++
  console.log(`MISSING ${what}: public/icons/${size}/${file}.png`)
}
for (const c of CARD_LIST) {
  need(`card ${c.id}`, CARD_ICON[c.id], 48)
  need(`card ${c.id}`, CARD_ICON[c.id], 16, true)
}
for (const c of CONSUMABLE_LIST) {
  need(`item ${c.id}`, ITEM_ICON[c.id], 32)
  need(`item ${c.id}`, ITEM_ICON[c.id], 16, true)
}
for (const k of Object.keys(BONUS_INFO)) need(`bonus ${k}`, BONUS_ICON[k as keyof typeof BONUS_ICON], 16)
for (const [k, f] of Object.entries(UI_ICON)) need(`ui ${k}`, f, k === 'logo' ? 32 : 16)
need('ui mine', UI_ICON.mine, 32)
need('ui shield', UI_ICON.shield, 32)
console.log(bad ? `${bad} missing` : 'icons ok')
process.exit(bad ? 1 : 0)
