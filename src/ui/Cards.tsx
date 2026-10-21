import { CARDS, CONSUMABLES, cardBaseMult, cardChips, sellPrice, type CardInst, type GameState, type Rarity } from '../engine'
import { tipProps } from '../tip'
import { Icon, Rich } from './Icon'
import { CARD_ICON, ITEM_ICON } from './icons'

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

export function CardTip({ id, card, game, sell }: { id: string; card?: CardInst; game?: GameState; sell?: boolean }) {
  const def = CARDS[id]
  const lines: string[] = []
  if (card && game) {
    const m = cardBaseMult(card, game)
    if (m > 0) lines.push(`Multiplier from this card: +${m.toFixed(2)}x`)
    if (card.money > 0) lines.push(`Earned this round: $${card.money}`)
    if (card.score > 0) lines.push(`Points added this round: ${Math.round(card.score * 100) / 100}`)
    const info = card.flashInfo ?? []
    if (info.length) lines.push(`Last move: ${info.join(' ')}`)
    else if (card.flash.length) lines.push(`Last move: ${card.flash.join(' · ')}`)
    if (card.log && !info.length) lines.push(card.log)
  }
  return (
    <>
      <div className="tip-title">
        <span className="tip-name">
          <Icon file={CARD_ICON[id]} size={16} /> {def.name}
        </span>
        <span className={`rarity r-${def.rarity}`}>{RARITY_LABEL[def.rarity]}</span>
      </div>
      <p>{def.desc}</p>
      {lines.map((l, i) => (
        <p key={i} className="tip-status">
          <Rich text={l} />
        </p>
      ))}
      {sell && <p className="tip-status">Sells for ${sellPrice(def.price)}</p>}
    </>
  )
}

export function CardView({ id, card, game, sell, big }: { id: string; card?: CardInst; game: GameState; sell?: boolean; big?: boolean }) {
  const def = CARDS[id]
  const chips = card ? cardChips(card, game) : []
  const flash = card?.flash.filter((f) => !chips.some((c) => c.text === f)).slice(0, 1) ?? []
  return (
    <div className={`card r-${def.rarity} ${big ? 'big' : ''}`} {...tipProps(() => <CardTip id={id} card={card} game={game} sell={sell} />)}>
      <div className="card-head" />
      <div className="card-emoji">
        <Icon file={CARD_ICON[id]} size={48} />
      </div>
      <div className="card-name">{def.name}</div>
      <div className="chips">
        {chips.map((c, i) => (
          <span key={i} className={`chip chip-${c.kind}`}>
            {c.text}
          </span>
        ))}
        {flash.map((f, i) => (
          <span key={'f' + i} className="chip chip-flash">
            <Rich text={f} />
          </span>
        ))}
      </div>
    </div>
  )
}

export function ConsumableView({ id, sell, big }: { id: string; sell?: boolean; big?: boolean }) {
  const def = CONSUMABLES[id]
  return (
    <div
      className={`item ${big ? 'big' : ''}`}
      {...tipProps(() => (
        <>
          <div className="tip-title">
            <span className="tip-name">
              <Icon file={ITEM_ICON[id]} size={16} /> {def.name}
            </span>
            <span className="rarity r-consumable">Item</span>
          </div>
          <p>{def.desc}</p>
          {sell && <p className="tip-status">Sells for ${sellPrice(def.price)}</p>}
        </>
      ))}
    >
      <div className="card-emoji">
        <Icon file={ITEM_ICON[id]} size={32} />
      </div>
      <div className="card-name">{def.name}</div>
    </div>
  )
}

/** Cards are always portrait (5:7); consumable items are always square. */
export const EmptySlot = ({ label, kind = 'card', big }: { label: string; kind?: 'card' | 'item'; big?: boolean }) => (
  <div className={`${kind} empty ${big ? 'big' : ''}`}>
    <span>{label}</span>
  </div>
)
