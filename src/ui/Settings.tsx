import { useState } from 'react'
import { quitToMenu, useGame } from '../store'
import { updateSettings, useSettings } from '../settings'
import { Help } from './Help'
import { Modal } from './Modal'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useSettings()
  const game = useGame()
  const [help, setHelp] = useState(false)
  return (
    <Modal onClose={onClose}>
      <h2>Menu</h2>
      <label className="toggle-row">
        <span>🎵 Music</span>
        <input type="checkbox" checked={settings.music} onChange={(e) => updateSettings({ music: e.target.checked })} />
      </label>
      <label className="toggle-row">
        <span>🔊 Sound effects</span>
        <input type="checkbox" checked={settings.sfx} onChange={(e) => updateSettings({ sfx: e.target.checked })} />
      </label>
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
