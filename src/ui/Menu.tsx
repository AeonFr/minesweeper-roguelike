import { useState } from 'react'
import { continueRun, newRun, readSave } from '../store'
import { updateSettings, useSettings } from '../settings'
import { Help } from './Help'

export function Menu() {
  const settings = useSettings()
  const [seed, setSeed] = useState('')
  const [help, setHelp] = useState(false)
  const save = readSave()
  return (
    <div className="screen menu-screen">
      <div className="menu-hero layer-ui">
        <div className="logo">💣</div>
        <h1>Mine Rogue</h1>
        <p>Minesweeper meets roguelike. Twelve rounds. Three hearts. Bonus cards, wild multipliers, and one very bad idea per tile.</p>
        <div className="menu-actions">
          {save && (
            <button className="btn primary big" onClick={continueRun}>
              Continue · round {save.roundNo}
            </button>
          )}
          <button className={`btn big ${save ? '' : 'primary'}`} onClick={() => newRun(seed.trim() || undefined)}>
            New run
          </button>
          <input
            className="seed-input"
            placeholder="seed (optional)"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div className="menu-toggles">
          <label>
            <input type="checkbox" checked={settings.music} onChange={(e) => updateSettings({ music: e.target.checked })} /> 🎵 Music
          </label>
          <label>
            <input type="checkbox" checked={settings.sfx} onChange={(e) => updateSettings({ sfx: e.target.checked })} /> 🔊 Sounds
          </label>
          <button className="link" onClick={() => setHelp((h) => !h)}>
            {help ? 'Hide' : 'How to play'}
          </button>
        </div>
        {help && <Help />}
      </div>
    </div>
  )
}
