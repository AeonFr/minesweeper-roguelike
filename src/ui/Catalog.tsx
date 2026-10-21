import { useState } from 'react'
import { BONUS_INFO, CARD_LIST, CONSUMABLE_LIST, CONSUMABLES, type BonusKind } from '../engine'
import { useCatalog } from '../catalog'
import { tipProps } from '../tip'
import { CardTip } from './Cards'
import { Icon } from './Icon'
import { BONUS_ICON, ITEM_ICON, CARD_ICON } from './icons'
import { Modal } from './Modal'

type Tab = 'cards' | 'items' | 'bonus'
const BONUS_LIST = Object.keys(BONUS_INFO) as BonusKind[]
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const Unknown = ({ cls }: { cls: string }) => (
  <div className={`${cls} locked`} {...tipProps(() => <p>Not discovered yet. Keep playing to find it.</p>)}>
    <div className="card-emoji locked-mark">?</div>
    <div className="card-name">???</div>
  </div>
)

export function Catalog({ onClose }: { onClose: () => void }) {
  const cat = useCatalog()
  const [tab, setTab] = useState<Tab>('cards')
  const has = (list: string[], id: string) => cat.all || list.includes(id)
  const cards = [...CARD_LIST].sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.price - b.price)
  const counts = {
    cards: `${cards.filter((c) => has(cat.cards, c.id)).length}/${cards.length}`,
    items: `${CONSUMABLE_LIST.filter((c) => has(cat.items, c.id)).length}/${CONSUMABLE_LIST.length}`,
    bonus: `${BONUS_LIST.filter((k) => has(cat.bonus, k)).length}/${BONUS_LIST.length}`,
  }
  return (
    <Modal title="Catalog" onClose={onClose}>
      <div className="catalog">
        <p className="muted">
          Everything you have met so far. Cards and items appear when they show up in a shop; bonus tiles when you uncover one.
          {cat.all && <b className="dev-note"> Developer unlock is on.</b>}
        </p>
        <div role="tablist" className="cat-tabs">
          {(['cards', 'items', 'bonus'] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t === 'cards' ? 'Cards' : t === 'items' ? 'Items' : 'Bonus tiles'} {counts[t]}
            </button>
          ))}
        </div>
        <div className="cat-grid">
          {tab === 'cards' &&
            cards.map((def) =>
              has(cat.cards, def.id) ? (
                <div key={def.id} className={`card r-${def.rarity}`} {...tipProps(() => <CardTip id={def.id} />)}>
                  <div className="card-head" />
                  <div className="card-emoji">
                    <Icon file={CARD_ICON[def.id]} size={32} />
                  </div>
                  <div className="card-name">{def.name}</div>
                </div>
              ) : (
                <Unknown key={def.id} cls="card" />
              ),
            )}
          {tab === 'items' &&
            CONSUMABLE_LIST.map((def) =>
              has(cat.items, def.id) ? (
                <div
                  key={def.id}
                  className="item"
                  {...tipProps(() => (
                    <>
                      <div className="tip-title">
                        <span className="tip-name">
                          <Icon file={ITEM_ICON[def.id]} size={16} px={false} /> {CONSUMABLES[def.id].name}
                        </span>
                        <span className="rarity r-consumable">Item</span>
                      </div>
                      <p>{def.desc}</p>
                    </>
                  ))}
                >
                  <div className="card-emoji">
                    <Icon file={ITEM_ICON[def.id]} size={32} />
                  </div>
                  <div className="card-name">{def.name}</div>
                </div>
              ) : (
                <Unknown key={def.id} cls="item" />
              ),
            )}
          {tab === 'bonus' &&
            BONUS_LIST.map((k) =>
              has(cat.bonus, k) ? (
                <div
                  key={k}
                  className="item"
                  {...tipProps(() => (
                    <>
                      <div className="tip-title">
                        <span className="tip-name">
                          <Icon file={BONUS_ICON[k]} size={16} px={false} /> {BONUS_INFO[k].name}
                        </span>
                        <span className="rarity r-consumable">Bonus tile</span>
                      </div>
                      <p>{BONUS_INFO[k].desc}</p>
                    </>
                  ))}
                >
                  <div className="card-emoji">
                    <Icon file={BONUS_ICON[k]} size={32} />
                  </div>
                  <div className="card-name">{BONUS_INFO[k].name}</div>
                </div>
              ) : (
                <Unknown key={k} cls="item" />
              ),
            )}
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
