import { useEffect, useState } from 'react'
import { CARD_LIST } from '../engine'
import { dispatch, LAYERS, rewindTo, toggleLayer, useGame, useHiddenLayers } from '../store'

/** Toggle with ` (backtick) or open with ?debug. Layer toggles make focused screenshots easy. */
export function DebugPanel() {
  const [open, setOpen] = useState(() => new URLSearchParams(location.search).has('debug'))
  const hidden = useHiddenLayers()
  const game = useGame()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === '`' && setOpen((o) => !o)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (!open) return null
  return (
    <div className="debug">
      <b>debug</b>
      <div>
        {LAYERS.map((l) => (
          <label key={l}>
            <input type="checkbox" checked={!hidden.split(' ').includes(l)} onChange={() => toggleLayer(l)} /> {l}
          </label>
        ))}
      </div>
      {game && (
        <>
          <div>
            history: {game.history.length}{' '}
            <input type="range" min={0} max={game.history.length} value={game.history.length} onChange={(e) => rewindTo(Number(e.target.value))} />
          </div>
          <div>
            <button onClick={() => dispatch({ type: 'debug', money: game.money + 20 })}>+$20</button>
            <button onClick={() => dispatch({ type: 'debug', phase: 'shop' })}>shop</button>
            <button onClick={() => dispatch({ type: 'debug', round: Math.min(12, game.roundNo + 1), phase: 'round' })}>round+</button>
            <select onChange={(e) => e.target.value && dispatch({ type: 'debug', cards: [...game.cards.map((c) => c.id), e.target.value] })} value="">
              <option value="">+card</option>
              {CARD_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  )
}
