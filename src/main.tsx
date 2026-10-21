import { createRoot } from 'react-dom/client'
import type { Command } from './engine'
import { dispatch, dispatchAll, installDebugApi, LAYERS, newRun, setLayers, type Layer } from './store'
import { App } from './ui/App'
import '98.css'
import './styles.css'

installDebugApi()

/**
 * URL controls (handy for screenshots and repros):
 *   ?seed=abc            start a fresh run with that seed
 *   ?round=5&scene=shop  jump straight to the shop after round 5 (needs seed or starts one)
 *   ?cards=crown,vault   give cards (debug)   ?items=sprout,ward   give consumables
 *   ?money=30&lives=1
 *   ?cmds=<base64 JSON>  replay commands after setup
 *   ?hide=ui,fx          hide layers: ui, board, fx, bg, bonus
 *   ?debug               show debug panel
 */
function bootFromUrl() {
  const q = new URLSearchParams(location.search)
  const hide = (q.get('hide') ?? '').split(',').filter((l): l is Layer => (LAYERS as readonly string[]).includes(l))
  setLayers(hide)
  const seed = q.get('seed')
  const scripted = seed || q.has('scene') || q.has('round') || q.has('cmds') || q.has('cards')
  if (!scripted) return
  newRun(seed ?? 'screenshot')
  const csv = (k: string) => (q.get(k) ? q.get(k)!.split(',') : undefined)
  const num = (k: string) => (q.has(k) ? Number(q.get(k)) : undefined)
  if (q.has('round') || q.has('cards') || q.has('items') || q.has('money') || q.get('scene') === 'shop') {
    dispatch({
      type: 'debug',
      round: num('round'),
      phase: q.get('scene') === 'shop' ? 'shop' : 'round',
      cards: csv('cards'),
      consumables: csv('items'),
      money: num('money'),
    })
  }
  if (q.has('cmds')) dispatchAll(JSON.parse(atob(q.get('cmds')!)) as Command[])
  if (q.has('lives')) dispatch({ type: 'debug', lives: num('lives') })
}

bootFromUrl()
createRoot(document.getElementById('root')!).render(<App />)
