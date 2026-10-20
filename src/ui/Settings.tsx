import { useState } from 'react'
import { quitToMenu, useGame } from '../store'
import { updateSettings, useSettings } from '../settings'
import { Help } from './Help'
import { Icon } from './Icon'
import { UI_ICON } from './icons'
import { Modal } from './Modal'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useSettings()
  const game = useGame()
  const [help, setHelp] = useState(false)
  return (
    <Modal title="Options" onClose={onClose}>
      <div className="toggle-row">
        <input id="opt-music" type="checkbox" checked={settings.music} onChange={(e) => updateSettings({ music: e.target.checked })} />
        <label htmlFor="opt-music"><Icon file={UI_ICON.music} size={16} /> Music</label>
      </div>
      <div className="toggle-row">
        <input id="opt-sfx" type="checkbox" checked={settings.sfx} onChange={(e) => updateSettings({ sfx: e.target.checked })} />
        <label htmlFor="opt-sfx"><Icon file={UI_ICON.sound} size={16} /> Sound effects</label>
      </div>
      {game && (
        <p className="muted">
          Seed: <code>{game.seed}</code> · {game.history.length} actions
        </p>
      )}
      <div className="modal-actions">
        <button className="btn" onClick={() => setHelp((h) => !h)}>
          {help ? 'Hide help' : 'How to play'}
        </button>
        {game && (
          <button
            className="btn"
            onClick={() => {
              quitToMenu()
              onClose()
            }}
          >
            Save &amp; exit
          </button>
        )}
        <button className="btn primary" onClick={onClose}>
          Resume
        </button>
      </div>
      {help && <Help />}
    </Modal>
  )
}
