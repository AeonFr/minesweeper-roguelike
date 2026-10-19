import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BONUS_INFO, CONSUMABLE_SLOTS, CARD_SLOTS, mineCount, multBreakdown, neighbors, roundSpec, type GameState } from '../engine'
import { dispatch, newRun, quitToMenu } from '../store'
import { tipProps } from '../tip'
import { CardView, ConsumableView, EmptySlot } from './Cards'
import { Hud } from './Hud'
import { Modal } from './Modal'

const fmt = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

// ───────────────────────── score bar ─────────────────────────

function ScoreBar({ game }: { game: GameState }) {
  const r = game.round!
  const mb = multBreakdown(game)
  const last = r.last
  const pct = r.target ? Math.min(100, (r.score / r.target) * 100) : 0
  return (
    <section className="scorebar layer-ui">
      <div className="progress">
        <div className="fill" style={{ width: `${pct}%` }} />
        <span>
          {fmt(r.score)} / {r.target || '?'}
        </span>
      </div>
      <div className="calc">
        <div
          className="chipbox chipsbox"
          {...tipProps(() => (
            <>
              <div className="tip-title">Chips</div>
              <p>Points from the tiles you uncovered with your last move: each tile is worth its number.</p>
            </>
          ))}
        >
          <small>CHIPS</small>
          <b>{last ? Math.round(last.points * 10) / 10 : 0}</b>
        </div>
        <span className="times">×</span>
        <div
          className="chipbox multbox"
          {...tipProps(() => (
            <>
              <div className="tip-title">Multiplier ×{mb.total.toFixed(2)}</div>
              <table className="mult-table">
                <tbody>
                  <tr><td>Base</td><td>×{mb.start.toFixed(2)}</td></tr>
                  {mb.cards !== 0 && <tr><td>Bonus cards</td><td>+{mb.cards.toFixed(2)}</td></tr>}
                  {mb.cardMul !== 1 && <tr><td>Card multiplier</td><td>×{mb.cardMul}</td></tr>}
                  {mb.bonus !== 0 && <tr><td>Bonus cells &amp; items</td><td>+{mb.bonus.toFixed(2)}</td></tr>}
                  <tr><td>Base multiplier</td><td>×{mb.base.toFixed(2)}</td></tr>
                  <tr><td>Streak {mb.streak} × {mb.step.toFixed(2)}</td><td>+{mb.streakPart.toFixed(2)}</td></tr>
                </tbody>
              </table>
              <p className="tip-status">A mine resets the streak.</p>
            </>
          ))}
        >
          <small>MULT</small>
          <b>{mb.total.toFixed(2)}</b>
        </div>
        <div className={`gain ${last?.hit ? 'bad' : ''}`} key={`${game.stats.moves}-${last?.gain}`}>
          {last ? (last.hit ? (last.blocked ? '🛡️' : '💥') : `+${fmt(last.gain)}`) : ''}
        </div>
        <div className={`streak ${r.streak >= 10 ? 'hot' : ''}`}>
          🔥<b>{r.streak}</b>
        </div>
        {r.shield > 0 && <div className="shield">🛡️{r.shield}</div>}
      </div>
      <div className="events">
        {last?.events.slice(0, 3).map((e, i) => (
          <span key={`${game.stats.moves}-${i}`} className="event">
            {e}
          </span>
        ))}
      </div>
    </section>
  )
}

// ───────────────────────── board ─────────────────────────

const LONG_PRESS = 380

function Board({ game, mode }: { game: GameState; mode: 'dig' | 'flag' }) {
  const r = game.round!
  const b = r.board
  const wrap = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(32)
  const press = useRef<{ i: number; timer: number; fired: boolean } | null>(null)
  const pointerType = useRef('mouse')
  const lost = game.phase === 'lost'
  const playing = game.phase === 'round'

  useLayoutEffect(() => {
    const el = wrap.current!
    const measure = () => {
      const w = el.clientWidth - 12
      const h = el.clientHeight - 12
      setSize(Math.max(20, Math.floor(Math.min(w / b.cols, h / b.rows, 56))))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [b.cols, b.rows])

  useEffect(() => {
    if (game.stats.mistakes > 0 && r.last?.hit && grid.current) {
      grid.current.animate(
        [{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,3px)' }, { transform: 'translate(5px,-3px)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(0,0)' }],
        { duration: 320, easing: 'ease-out' },
      )
    }
  }, [game.stats.mistakes, r.last?.hit])

  const indexOf = (target: EventTarget | null) => {
    const el = (target as HTMLElement | null)?.closest<HTMLElement>('[data-i]')
    return el ? Number(el.dataset.i) : -1
  }

  const primary = (i: number, flagging: boolean) => {
    if (!playing) return
    const t = b.tiles[i]
    if (t.revealed) {
      if (t.n > 0 && !flagging) {
        const flags = neighbors(b.cols, b.rows, i).filter((j) => b.tiles[j].flagged).length
        if (flags === t.n) dispatch({ type: 'chord', index: i })
      }
      return
    }
    dispatch(flagging ? { type: 'flag', index: i } : { type: 'reveal', index: i })
  }

  const onDown = (e: React.PointerEvent) => {
    pointerType.current = e.pointerType
    if (e.button !== 0) return
    const i = indexOf(e.target)
    if (i < 0) return
    const timer = window.setTimeout(() => {
      if (press.current) {
        press.current.fired = true
        navigator.vibrate?.(15)
        primary(i, mode === 'dig') // long-press does the opposite of the mode
      }
    }, LONG_PRESS)
    press.current = { i, timer, fired: false }
  }
  const onUp = (e: React.PointerEvent) => {
    const p = press.current
    if (!p) return
    clearTimeout(p.timer)
    press.current = null
    if (p.fired || e.button !== 0) return
    if (indexOf(e.target) === p.i) primary(p.i, mode === 'flag')
  }
  const cancel = () => {
    if (press.current) clearTimeout(press.current.timer)
    press.current = null
  }
  const onContext = (e: React.MouseEvent) => {
    e.preventDefault()
    if (pointerType.current !== 'mouse') return
    const i = indexOf(e.target)
    if (i >= 0) primary(i, true)
  }

  return (
    <div className="board-area layer-board" ref={wrap}>
      <div
        ref={grid}
        className="grid"
        style={{ gridTemplateColumns: `repeat(${b.cols}, ${size}px)`, ['--cell' as string]: `${size}px` }}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={onContext}
      >
        {b.tiles.map((t, i) => {
          const cls = ['tile']
          let face: React.ReactNode = null
          if (t.revealed) {
            cls.push('revealed', `n${t.n}`)
            if (t.exploded) {
              cls.push('exploded')
              face = '💥'
            } else {
              face = t.n || ''
              if (t.bonus) cls.push('claimed')
            }
          } else {
            cls.push('hidden')
            if (t.flagged) {
              cls.push('flagged')
              face = '🚩'
            } else if (lost && t.mine) {
              cls.push('mine')
              face = '💣'
            }
            if (t.bonus && !t.flagged) cls.push('has-bonus', `bonus-${t.bonus}`)
          }
          return (
            <div key={i} data-i={i} className={cls.join(' ')}>
              <span className="face">
                {face}
                {t.bonus && !t.flagged && (!t.revealed || !t.exploded) && (
                  <span className="bonus-art" title={t.revealed ? '' : BONUS_INFO[t.bonus].name}>
                    {BONUS_INFO[t.bonus].emoji}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ───────────────────────── tray ─────────────────────────

function Tray({ game, mode, setMode }: { game: GameState; mode: 'dig' | 'flag'; setMode: (m: 'dig' | 'flag') => void }) {
  const playing = game.phase === 'round'
  return (
    <footer className="tray layer-ui">
      <div className="slots cards">
        {Array.from({ length: CARD_SLOTS }, (_, k) => {
          const c = game.cards[k]
          return c ? <CardView key={c.uid} id={c.id} card={c} game={game} /> : <EmptySlot key={k} label="card" />
        })}
      </div>
      <div className="slots lower">
        {Array.from({ length: CONSUMABLE_SLOTS }, (_, k) => {
          const id = game.consumables[k]
          return id ? (
            <div key={`${id}-${k}`} className="slot-with-btn">
              <ConsumableView id={id} />
              <button className="btn small" disabled={!playing} onClick={() => dispatch({ type: 'useConsumable', slot: k })}>
                Use
              </button>
            </div>
          ) : (
            <div key={k} className="slot-with-btn">
              <EmptySlot label="item" />
              <button className="btn small ghost" disabled>
                &nbsp;
              </button>
            </div>
          )
        })}
        <button className={`mode-toggle ${mode}`} onClick={() => setMode(mode === 'dig' ? 'flag' : 'dig')} aria-label="Toggle dig or flag mode">
          <span className="mode-icon">{mode === 'dig' ? '⛏️' : '🚩'}</span>
          <span className="mode-text">{mode === 'dig' ? 'Digging' : 'Flagging'}</span>
          <small>hold = {mode === 'dig' ? 'flag' : 'dig'}</small>
        </button>
      </div>
    </footer>
  )
}

// ───────────────────────── end of run overlay ─────────────────────────

function EndOverlay({ game }: { game: GameState }) {
  const [peek, setPeek] = useState(false)
  const won = game.phase === 'won'
  if (peek)
    return (
      <button className="peek-back" onClick={() => setPeek(false)}>
        Show results
      </button>
    )
  return (
    <Modal>
      <h2>{won ? '🏆 You cleared all 12 rounds!' : '💀 Run over'}</h2>
      <p className="muted">
        {won ? 'Every mine, outplayed.' : `You fell in round ${game.roundNo}.`} Seed <code>{game.seed}</code>
      </p>
      <table className="stats">
        <tbody>
          <tr><td>Rounds cleared</td><td>{won ? 12 : game.roundNo - 1}</td></tr>
          <tr><td>Total score</td><td>{fmt(game.stats.totalScore)}</td></tr>
          <tr><td>Best streak</td><td>{game.stats.bestStreak}</td></tr>
          <tr><td>Mines hit</td><td>{game.stats.mistakes}</td></tr>
          <tr><td>Moves</td><td>{game.stats.moves}</td></tr>
        </tbody>
      </table>
      <div className="modal-actions">
        {!won && (
          <button className="btn" onClick={() => setPeek(true)}>
            Look at board
          </button>
        )}
        <button className="btn" onClick={quitToMenu}>
          Menu
        </button>
        <button className="btn primary" onClick={() => newRun()}>
          New run
        </button>
      </div>
    </Modal>
  )
}

// ───────────────────────── round view ─────────────────────────

export function RoundView({ game }: { game: GameState }) {
  const [mode, setMode] = useState<'dig' | 'flag'>('dig')
  const r = game.round!
  const spec = roundSpec(game.roundNo)
  const flagsLeft = mineCount(spec) - r.board.tiles.filter((t) => t.flagged || t.exploded).length
  return (
    <div className="screen round-screen">
      <Hud game={game} />
      <ScoreBar game={game} />
      <div className="board-wrap">
        <div className="board-meta layer-ui">
          <span>
            {spec.cols}×{spec.rows}
          </span>
          <span>💣 {flagsLeft}</span>
          {!r.board.generated && <span className="hint">tap any tile to start</span>}
        </div>
        <Board game={game} mode={mode} />
      </div>
      <Tray game={game} mode={mode} setMode={setMode} />
      {(game.phase === 'lost' || game.phase === 'won') && <EndOverlay game={game} />}
    </div>
  )
}

