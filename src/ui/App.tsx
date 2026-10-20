import { useEffect, useRef, useState } from 'react'
import { setIntensity, setMusic, setMusicSeed, setScene, setSfx, sfx } from '../audio/audio'
import { useSettings } from '../settings'
import { useGame, useHiddenLayers } from '../store'
import { TipLayer } from '../tip'
import type { GameState } from '../engine'
import { DebugPanel } from './DebugPanel'
import { Menu } from './Menu'
import { RoundView } from './Round'
import { Shop } from './Shop'

function Toast({ game }: { game: GameState | null }) {
  const seq = game?.msg?.seq
  return game?.msg ? (
    <div className="toast layer-ui" key={seq}>
      {game.msg.text}
    </div>
  ) : null
}

function useAudioSync(game: GameState | null) {
  const settings = useSettings()
  const prev = useRef<GameState | null>(null)
  useEffect(() => setMusic(settings.music), [settings.music])
  useEffect(() => setSfx(settings.sfx), [settings.sfx])
  useEffect(() => {
    if (game) setMusicSeed(game.seed)
  }, [game?.seed])
  useEffect(() => {
    setScene(!game ? 'menu' : game.phase === 'shop' ? 'shop' : 'round')
    setIntensity(game && game.phase === 'round' ? (game.hearts <= 1 ? 2 : game.hearts === 2 ? 1 : 0) : 0)
  }, [game?.phase, game?.hearts])
  useEffect(() => {
    const p = prev.current
    prev.current = game
    if (!game || !p || p.seed !== game.seed) return
    if (game.msg && game.msg.seq !== p.msg?.seq) return sfx('error')
    if (game.history.length === p.history.length) return
    const cmd = game.history[game.history.length - 1]
    if (game.phase === 'lost' && p.phase !== 'lost') return sfx('lose')
    if (game.phase !== p.phase && game.phase === 'shop') return sfx('win')
    if (game.phase === 'won') return sfx('win')
    if (cmd.type === 'flag') return sfx('flag')
    if (cmd.type === 'buyCard' || cmd.type === 'buyConsumable' || cmd.type === 'sellCard' || cmd.type === 'sellConsumable') return sfx('buy')
    if (game.stats.mistakes > p.stats.mistakes) return sfx('boom')
    if (game.round?.last?.events.length) return sfx('bonus')
    if (game.stats.moves > p.stats.moves) return sfx('reveal')
  }, [game])
}

export function App() {
  const game = useGame()
  useHiddenLayers()
  useAudioSync(game)
  const danger = !!game && game.phase === 'round' && game.hearts <= 1
  // After the winning move we stay on the board (with a summary) until the player continues to the shop.
  const [seen, setSeen] = useState<string | null>(null)
  const clearKey = game ? `${game.seed}:${game.roundNo}` : ''
  const showResult = !!game && game.phase === 'shop' && !!game.round?.last && seen !== clearKey
  return (
    <div className={`app ${danger ? 'danger' : ''}`}>
      <div className="bg layer-bg" />
      <div className="vignette layer-fx" />
      {!game ? <Menu /> : game.phase === 'shop' && !showResult ? <Shop game={game} /> : <RoundView game={game} onContinue={() => setSeen(clearKey)} />}
      <TipLayer />
      <Toast game={game} />
      <DebugPanel />
    </div>
  )
}
