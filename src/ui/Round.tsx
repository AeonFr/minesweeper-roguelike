import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  BONUS_INFO,
  CARDS,
  CARD_SLOTS,
  CONSUMABLE_SLOTS,
  mineCount,
  multBreakdown,
  neighbors,
  roundSpec,
  type GameState,
} from '../engine'
import { dispatch, newRun, quitToMenu } from '../store'
import { infoTip, tipProps } from '../tip'
import { CardView, ConsumableView, EmptySlot } from './Cards'
import { Hud } from './Hud'
import { Icon, Rich } from './Icon'
import { BONUS_ICON, CARD_ICON, UI_ICON } from './icons'
import { Modal, Win } from './Modal'

const fmt = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

// ───────────────────────── score bar ─────────────────────────

function ScoreBar({ game }: { game: GameState }) {
  const r = game.round!
  const mb = multBreakdown(game)
  const last = r.last
  const pct = r.target ? Math.min(100, (r.score / r.target) * 100) : 0
  return (
    <section className="scorebar layer-ui">
      <div
        className="score-line"
        {...infoTip(
          'Score / target',
          r.target
            ? `Reach ${r.target} points to clear the round. The target is the total of every number on the board, but multipliers usually get you there before you uncover everything.`
            : 'The target is revealed when you make your first move: it is the total of every number on the board.',
        )}
      >
        <span>
          Score <b>{fmt(r.score)}</b>
        </span>
        <span>
          Target <b>{r.target || '?'}</b>
        </span>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="calc">
        <div className="chipbox chipsbox" {...infoTip('Chips', 'Points from the tiles you uncovered with your last move: each tile is worth its number.')}>
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
        <div
          className={`gain ${last?.hit ? 'bad' : ''}`}
          key={`${game.stats.moves}-${last?.gain}`}
          {...infoTip(
            'Last move',
            last
              ? last.hit
                ? last.blocked
                  ? 'You hit a mine, but a shield absorbed it.'
                  : 'You hit a mine: a heart was lost and your streak was reset.'
                : `Your last move scored ${fmt(last.gain)} points in total: tiles × multiplier, plus any bonus cells and card effects.`
              : 'Your points from the last move show up here.',
          )}
        >
          {last ? (last.hit ? <Icon file={last.blocked ? UI_ICON.shield : UI_ICON.mine} size={24} px={false} /> : `+${fmt(last.gain)}`) : ''}
        </div>
        <div
          className={`streak ${r.streak >= 10 ? 'hot' : ''}`}
          {...infoTip('Streak', `${r.streak} safe moves in a row. Each one adds +${mb.step.toFixed(2)} to the multiplier until you hit a mine.`)}
        >
          <Icon file={UI_ICON.streak} size={16} px={false} />
          <b>{r.streak}</b>
        </div>
        {r.shield > 0 && (
          <div className="shield" {...infoTip('Shield', `The next ${r.shield > 1 ? r.shield + ' mines you hit are' : 'mine you hit is'} harmless.`)}>
            <Icon file={UI_ICON.shield} size={16} px={false} />
            {r.shield}
          </div>
        )}
      </div>
      <div className="events">
        {last?.events.slice(0, 3).map((e, i) => (
          <span key={`${game.stats.moves}-${i}`} className="event" {...infoTip('Triggered by your last move', <Rich text={e} />)}>
            <Rich text={e} />
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
  const art = Math.round(size * 0.68)

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
              face = <Icon file={UI_ICON.mine} size={art} px={false} />
            } else {
              face = t.n || ''
              if (t.bonus) cls.push('claimed')
            }
          } else {
            cls.push('hidden')
            if (t.flagged) {
              cls.push('flagged')
              face = <Icon file={UI_ICON.flag} size={art} px={false} />
            } else if (lost && t.mine) {
              cls.push('mine')
              face = <Icon file={UI_ICON.mine} size={art} px={false} />
            }
          }
          // Bonus cells stay secret until uncovered; afterwards the tile explains what it did.
          const bonus = t.revealed && !t.exploded ? t.bonus : null
          const tip = bonus
            ? tipProps(() => (
                <>
                  <div className="tip-title">
                    <span className="tip-name">
                      <Icon file={BONUS_ICON[bonus]} size={16} px={false} /> {BONUS_INFO[bonus].name}
                    </span>
                    <span className="rarity r-consumable">Bonus cell</span>
                  </div>
                  <p>{BONUS_INFO[bonus].desc}</p>
                  <p className="tip-status">Already collected.</p>
                </>
              ))
            : {}
          return (
            <div key={i} data-i={i} className={cls.join(' ')} {...tip}>
              <span className="face">
                {face}
                {bonus && (
                  <span className="bonus-art">
                    <Icon file={BONUS_ICON[bonus]} size={Math.round(size * 0.46)} px={false} />
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
          return c ? <CardView key={`card-${c.uid}`} id={c.id} card={c} game={game} /> : <EmptySlot key={`empty-${k}`} label="card" />
        })}
      </div>
      <div className="slots lower">
        {Array.from({ length: CONSUMABLE_SLOTS }, (_, k) => {
          const id = game.consumables[k]
          return id ? (
            <div key={`item-${id}-${k}`} className="slot-with-btn">
              <ConsumableView id={id} />
              <button className="btn small" disabled={!playing} onClick={() => dispatch({ type: 'useConsumable', slot: k })}>
                Use
              </button>
            </div>
          ) : (
            <div key={`empty-${k}`} className="slot-with-btn">
              <EmptySlot label="item" kind="item" />
              <button className="btn small ghost" disabled>
                &nbsp;
              </button>
            </div>
          )
        })}
        <button className={`mode-toggle ${mode}`} onClick={() => setMode(mode === 'dig' ? 'flag' : 'dig')} aria-label="Toggle dig or flag mode">
          <span className="mode-icon">
            <Icon file={mode === 'dig' ? UI_ICON.dig : UI_ICON.flag} size={28} />
          </span>
          <span className="mode-text">{mode === 'dig' ? 'Digging' : 'Flagging'}</span>
          <small>hold = {mode === 'dig' ? 'flag' : 'dig'}</small>
        </button>
      </div>
    </footer>
  )
}

// ───────────────────────── round clear summary ─────────────────────────

/** Shown after the winning move, before the shop, so you can see exactly why the round ended. */
function RoundClear({ game, onContinue }: { game: GameState; onContinue: () => void }) {
  const [peek, setPeek] = useState(false)
  const r = game.round!
  const last = r.last!
  const reachedTarget = r.score + 1e-9 >= r.target
  const effects = game.cards.filter((c) => c.flash.length || c.log)
  const total = game.payout.reduce((p, l) => p + l.amount, 0)
  if (peek)
    return (
      <button className="peek-back" onClick={() => setPeek(false)}>
        Back to results
      </button>
    )
  return (
    <Modal title="Round Clear!">
      <h2>Round {game.roundNo} cleared</h2>
      <p className="why">
        {reachedTarget ? (
          <>
            Your score <b>{fmt(r.score)}</b> reached the target of <b>{r.target}</b>.
          </>
        ) : (
          <>You uncovered every safe tile.</>
        )}
      </p>
      <h3>Winning move</h3>
      <table className="stats">
        <tbody>
          <tr><td>Tiles uncovered</td><td>{last.revealed}</td></tr>
          <tr><td>Chips × multiplier</td><td>{Math.round(last.points * 10) / 10} × {last.mult.toFixed(2)}</td></tr>
          <tr><td>Total scored</td><td>+{fmt(last.gain)}</td></tr>
          <tr><td>Streak</td><td>{r.streak}</td></tr>
        </tbody>
      </table>
      <h3>What triggered</h3>
      {last.events.length === 0 && effects.length === 0 ? (
        <p className="muted">No bonus cells, items or card effects.</p>
      ) : (
        <ul className="triggers">
          {last.events.map((e, i) => (
            <li key={`e${i}`}>
              <Rich text={e} size={16} />
            </li>
          ))}
          {effects.map((c) => (
            <li key={c.uid}>
              <Icon file={CARD_ICON[c.id]} size={16} px={false} />
              <span>
                <b>{CARDS[c.id].name}</b>: <Rich text={[...c.flash, c.log].filter(Boolean).join(' · ')} size={16} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <h3>Payout</h3>
      <table className="stats">
        <tbody>
          {game.payout.map((l, i) => (
            <tr key={i}>
              <td>{l.label}</td>
              <td>+${l.amount}</td>
            </tr>
          ))}
          <tr className="total"><td>Total</td><td>${total}</td></tr>
        </tbody>
      </table>
      <div className="modal-actions">
        <button className="btn" onClick={() => setPeek(true)}>
          Look at board
        </button>
        <button className="btn primary" onClick={onContinue}>
          Go to shop →
        </button>
      </div>
    </Modal>
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
    <Modal title={won ? 'You Win!' : 'Game Over'}>
      <h2>{won ? 'You cleared all 12 rounds!' : 'Run over'}</h2>
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

export function RoundView({ game, onContinue }: { game: GameState; onContinue?: () => void }) {
  const [mode, setMode] = useState<'dig' | 'flag'>('dig')
  const r = game.round!
  const spec = roundSpec(game.roundNo)
  const flagsLeft = mineCount(spec) - r.board.tiles.filter((t) => t.flagged || t.exploded).length
  return (
    <div className="screen round-screen">
      <Hud game={game} />
      <ScoreBar game={game} />
      <Win title={`Minesweeper - Round ${game.roundNo}`} className="board-wrap">
        <div className="board-meta layer-ui">
          <span {...infoTip('Board size', `${spec.cols} columns × ${spec.rows} rows.`)}>
            {spec.cols}×{spec.rows}
          </span>
          <span
            className="mines-left"
            {...infoTip('Mines left', `${mineCount(spec)} mines in total, minus the flags you placed and the mines you already hit.`)}
          >
            <Icon file={UI_ICON.mine} size={14} px={false} /> {flagsLeft}
          </span>
          {!r.board.generated && <span className="hint">tap any tile to start</span>}
        </div>
        <Board game={game} mode={mode} />
      </Win>
      <Tray game={game} mode={mode} setMode={setMode} />
      {(game.phase === 'lost' || game.phase === 'won') && <EndOverlay game={game} />}
      {game.phase === 'shop' && onContinue && <RoundClear game={game} onContinue={onContinue} />}
    </div>
  )
}
