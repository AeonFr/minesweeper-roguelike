import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useGame } from './store'

interface TipState {
  anchor: HTMLElement
  render: () => ReactNode
}

let tip: TipState | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function showTip(anchor: HTMLElement, render: () => ReactNode) {
  tip = { anchor, render }
  emit()
}
export function hideTip() {
  if (!tip) return
  tip = null
  emit()
}

/**
 * The `click` that follows a tap reports pointerType "mouse" in WebKit, so the real
 * pointer type is remembered from pointerdown instead.
 */
let lastPointerType = 'mouse'
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => (lastPointerType = e.pointerType), true)
}

/** Hover on mouse, tap-to-toggle on touch. Spread onto any element. */
export function tipProps(render: () => ReactNode) {
  return {
    'data-tip': '',
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse') showTip(e.currentTarget, render)
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse') hideTip()
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      if (lastPointerType === 'mouse') return
      const el = e.currentTarget
      if (tip?.anchor === el) hideTip()
      else showTip(el, render)
    },
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    if (tip && !(e.target as HTMLElement).closest('[data-tip]')) hideTip()
  })
}

/** Simple title + explanation tooltip. */
export const infoTip = (title: ReactNode, body: ReactNode) =>
  tipProps(() => (
    <>
      <div className="tip-title">{title}</div>
      <p>{body}</p>
    </>
  ))

export function TipLayer() {
  const cur = useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => tip,
  )
  const game = useGame() // re-render the content when the game changes
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, top: 0, ready: false })

  useLayoutEffect(() => {
    if (!cur || !ref.current) {
      setPos((p) => (p.ready ? { ...p, ready: false } : p))
      return
    }
    const a = cur.anchor.getBoundingClientRect()
    const w = ref.current.offsetWidth
    const h = ref.current.offsetHeight
    const vw = window.innerWidth
    let left = a.left + a.width / 2 - w / 2
    left = Math.max(8, Math.min(vw - w - 8, left))
    let top = a.top - h - 8
    if (top < 8) top = a.bottom + 8
    setPos((p) => (p.ready && p.left === left && p.top === top ? p : { left, top, ready: true }))
  }, [cur, game])

  if (!cur || !document.contains(cur.anchor)) return null
  // Portalled to <body>, like modals: .app is its own stacking context, so inside it a tip would sit under any modal.
  return createPortal(
    <div ref={ref} className="tip layer-ui" style={{ left: pos.left, top: pos.top, opacity: pos.ready ? 1 : 0 }}>
      {cur.render()}
    </div>,
    document.body,
  )
}
