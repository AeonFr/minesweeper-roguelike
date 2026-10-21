import { useState } from 'react'
import { MAX_ROUND, maxLives, type GameState } from '../engine'
import { infoTip, tipProps } from '../tip'
import { Icon } from './Icon'
import { UI_ICON } from './icons'
import { SettingsModal } from './Settings'

const LIFE_SLOTS = 4

export function Hud({ game }: { game: GameState }) {
  const [open, setOpen] = useState(false)
  const max = maxLives(game)
  return (
    <header className={`hud layer-ui`}>
      <button className="menu-btn" onClick={() => setOpen(true)}>
        Settings
      </button>
      <div
        className="pill round"
        {...infoTip(`Round ${game.roundNo} of ${MAX_ROUND}`, 'Every round has a bigger board with more mines. Clear all 12 to win the run.')}
      >
        ROUND <b>{game.roundNo}</b>/{MAX_ROUND}
      </div>
      <div
        className="pill money"
        {...tipProps(() => (
          <>
            <div className="tip-title">
              <span className="tip-name"><Icon file={UI_ICON.money} size={16} /> Money</span>
            </div>
            <p>Spend it in the shop between rounds. You earn more for clearing harder rounds, keeping lives, and playing flawlessly.</p>
          </>
        ))}
      >
        $<b>{game.money}</b>
      </div>
      <div
        className="lives"
        {...tipProps(() => (
          <>
            <div className="tip-title">
              <span className="tip-name"><Icon file={UI_ICON.life} size={16} /> Lives</span>
            </div>
            <p>
              {game.lives} of {max}. Hitting a mine costs one. Lives refill after every round, and the ones left at the end pay $1 each.
            </p>
          </>
        ))}
      >
        {Array.from({ length: LIFE_SLOTS }, (_, k) => (
          <span key={k} className={`life ${k < game.lives ? 'full' : k < max ? 'empty' : 'none'}`}>
            <Icon file={UI_ICON.life} size={16} />
          </span>
        ))}
      </div>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </header>
  )
}
