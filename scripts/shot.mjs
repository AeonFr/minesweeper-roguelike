#!/usr/bin/env node
/**
 * Deterministic screenshots + pixel diff against baselines.
 *
 *   npm run shot                      capture all scenes into shots/current
 *   npm run shot -- --update          also overwrite shots/baseline
 *   npm run shot -- --only shop       scenes whose name contains "shop"
 *   npm run shot -- --hide ui,fx      hide layers (ui, board, fx, bg, bonus) in every scene
 *   npm run shot -- --url "?seed=x&round=4"  one ad-hoc shot -> shots/current/adhoc.png
 *
 * Assumes `npm run dev` or `vite preview` is running; set BASE_URL (default http://localhost:5173/).
 * Diffs land in shots/diff/. Exit code 1 if any scene differs by more than 0.1% of pixels.
 */
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173/'
const args = process.argv.slice(2)
const flag = (n) => args.includes(`--${n}`)
const opt = (n) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined)

const mobile = { width: 390, height: 780 }
const desktop = { width: 1280, height: 800 }
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64')
const open = [{ type: 'reveal', index: 24 }]

const SCENES = [
  { name: 'menu', url: '?', size: mobile },
  { name: 'round-start-mobile', url: '?seed=shot&round=1', size: mobile },
  { name: 'round-open-mobile', url: `?seed=shot&round=1&cmds=${b64(open)}`, size: mobile },
  { name: 'round-late-mobile', url: `?seed=shot&round=9&cards=crown,lucky-clover,vault,compass,extra-heart&items=sprout,ward&cmds=${b64([{ type: 'reveal', index: 60 }])}`, size: mobile },
  { name: 'round-lastheart-mobile', url: `?seed=shot&round=5&hearts=1&cmds=${b64([{ type: 'reveal', index: 40 }])}`, size: mobile },
  { name: 'round-open-desktop', url: `?seed=shot&round=6&cards=crown,sapling&cmds=${b64([{ type: 'reveal', index: 50 }])}`, size: desktop },
  { name: 'shop-mobile', url: '?seed=shot&round=3&scene=shop&money=25&cards=crown,sapling&items=surge', size: mobile },
  { name: 'shop-desktop', url: '?seed=shot&round=7&scene=shop&money=25&cards=crown,sapling,vault', size: desktop },
]

const only = opt('only')
const hide = opt('hide')
const adhoc = opt('url')
const scenes = adhoc ? [{ name: 'adhoc', url: adhoc, size: opt('size') === 'desktop' ? desktop : mobile }] : SCENES.filter((s) => !only || s.name.includes(only))

const dirs = { current: 'shots/current', baseline: 'shots/baseline', diff: 'shots/diff' }
for (const d of Object.values(dirs)) fs.mkdirSync(d, { recursive: true })

const browser = await chromium.launch()
let failed = 0
for (const sc of scenes) {
  const ctx = await browser.newContext({ viewport: sc.size, deviceScaleFactor: 2, hasTouch: sc.size === mobile, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.error(`[${sc.name}] page error:`, e.message))
  let url = BASE + sc.url
  if (hide) url += (url.includes('?') ? '&' : '?') + `hide=${hide}`
  await page.goto(url)
  await page.waitForSelector('.app')
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important;caret-color:transparent!important}' })
  await page.waitForTimeout(150)
  const file = path.join(dirs.current, `${sc.name}.png`)
  await page.screenshot({ path: file })
  await ctx.close()
  const base = path.join(dirs.baseline, `${sc.name}.png`)
  if (flag('update') || !fs.existsSync(base)) {
    fs.copyFileSync(file, base)
    console.log(`${sc.name}: baseline written`)
    continue
  }
  const a = PNG.sync.read(fs.readFileSync(base))
  const b = PNG.sync.read(fs.readFileSync(file))
  if (a.width !== b.width || a.height !== b.height) {
    console.log(`${sc.name}: SIZE CHANGED ${a.width}x${a.height} -> ${b.width}x${b.height}`)
    failed++
    continue
  }
  const diff = new PNG({ width: a.width, height: a.height })
  const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 })
  const ratio = n / (a.width * a.height)
  if (n) fs.writeFileSync(path.join(dirs.diff, `${sc.name}.png`), PNG.sync.write(diff))
  const bad = ratio > 0.001
  if (bad) failed++
  console.log(`${sc.name}: ${(ratio * 100).toFixed(3)}% pixels differ ${bad ? 'FAIL' : 'ok'}`)
}
await browser.close()
process.exit(failed ? 1 : 0)
