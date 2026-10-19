import { useState } from 'react'
import { MAX_ROUND, maxHearts, type GameState } from '../engine'
import { tipProps } from '../tip'
import { SettingsModal } from './Settings'

const HEART_SLOTS = 4

export function Hud({ game }: { game: GameState }) {
  const [open, setOpen] = useState(false)
  const max = maxHearts(game)
  const danger = game.phase === 'round' && game.hearts <= 1
  return (
    <header className={`hud layer-ui ${danger ? 'danger' : ''}`}>
      <button className="icon-btn" aria-label="Menu" onClick={() => setOpen(true)}>
        ☰
      </button>
      <div className="pill round">
        ROUND <b>{game.roundNo}</b>/{MAX_ROUND}
      </div>
      <div
        className="pill money"
        {...tipProps(() => (
          <>
            <div className="tip-title">💵 Money</div>
            <p>Spend it in the shop between rounds. You earn more for clearing harder rounds, keeping hearts, and playing flawlessly.</p>
          </>
        ))}
      >
        $<b>{game.money}</b>
      </div>
      <div
        className="hearts"
        {...tipProps(() => (
          <>
            <div className="tip-title">❤️ Hearts</div>
            <p>
              {game.hearts} of {max}. Hitting a mine costs one. Hearts refill after every round, and the ones left at the end pay $1 each.
            </p>
          </>
        ))}
      >
        {Array.from({ length: HEART_SLOTS }, (_, k) => (
          <span key={k} className={`heart ${k < game.hearts ? 'full' : k < max ? 'empty' : 'none'}`}>
            {k < game.hearts ? '❤️' : '🖤'}
          </span>
        ))}
      </div>
      {danger && <div className="danger-banner">⚠ LAST HEART ⚠</div>}
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </header>
  )
}
