import { CARD_SLOTS, CARDS, CONSUMABLES, CONSUMABLE_SLOTS, mineCount, rerollCost, roundSpec, sellPrice, type GameState } from '../engine'
import { dispatch } from '../store'
import { CardView, ConsumableView, EmptySlot } from './Cards'
import { Hud } from './Hud'
import { Icon } from './Icon'
import { UI_ICON } from './icons'
import { Win } from './Modal'

export function Shop({ game }: { game: GameState }) {
  const shop = game.shop!
  const spec = roundSpec(game.roundNo + 1)
  const total = game.payout.reduce((p, l) => p + l.amount, 0)
  const cardsFull = game.cards.length >= CARD_SLOTS
  const consFull = game.consumables.length >= CONSUMABLE_SLOTS
  const cost = rerollCost(shop.rerolls)
  const soldCard = (k: number) => (
    <div className="offer" key={`sold-card-${k}`}>
      <EmptySlot label="sold" />
      <button className="btn small ghost" disabled>
        &nbsp;
      </button>
    </div>
  )
  const soldItem = (k: number) => (
    <div className="offer" key={`sold-item-${k}`}>
      <EmptySlot label="sold" kind="item" />
      <button className="btn small ghost" disabled>
        &nbsp;
      </button>
    </div>
  )
  return (
    <div className="screen shop-screen">
      <Hud game={game} />
      <div className="shop-scroll">
        <Win title="Shop.exe" className="panel shop-main layer-ui">
          <div className="offers">
            {shop.cards.map((o, k) =>
              o ? (
                <div className="offer" key={o.id}>
                  <CardView id={o.id} game={game} />
                  <button className="btn small buy" disabled={game.money < o.price || cardsFull} onClick={() => dispatch({ type: 'buyCard', offer: k })}>
                    {cardsFull ? 'Full' : `Buy $${o.price}`}
                  </button>
                </div>
              ) : (
                soldCard(k)
              ),
            )}
            {shop.cons.map((o, k) =>
              o ? (
                <div className="offer" key={`${o.id}-${k}`}>
                  <ConsumableView id={o.id} />
                  <button className="btn small buy" disabled={game.money < o.price || consFull} onClick={() => dispatch({ type: 'buyConsumable', offer: k })}>
                    {consFull ? 'Full' : `Buy $${o.price}`}
                  </button>
                </div>
              ) : (
                soldItem(k)
              ),
            )}
          </div>
          <div className="offers-foot">
            <span className="muted">Cards on the left, one-use items on the right.</span>
            <button className="btn reroll" disabled={game.money < cost} onClick={() => dispatch({ type: 'reroll' })}>
              <Icon file={UI_ICON.refresh} size={16} /> Reroll ${cost}
            </button>
          </div>
        </Win>

        <div className="shop-side">
          <Win title={`Round ${game.roundNo} cleared!`} className="panel payout layer-ui">
            <table>
              <tbody>
                {game.payout.map((l, i) => (
                  <tr key={i}>
                    <td>{l.label}</td>
                    <td>+${l.amount}</td>
                  </tr>
                ))}
                <tr className="total">
                  <td>Earned</td>
                  <td>${total}</td>
                </tr>
              </tbody>
            </table>
          </Win>

          <Win title="Inventory" className="panel inventory layer-ui">
            <div className="slots cards">
              {Array.from({ length: CARD_SLOTS }, (_, k) => {
                const c = game.cards[k]
                return c ? (
                  <div className="slot-with-btn" key={`card-${c.uid}`}>
                    <CardView id={c.id} card={c} game={game} sell />
                    <button className="btn small" onClick={() => dispatch({ type: 'sellCard', slot: k })}>
                      Sell ${sellPrice(CARDS[c.id].price)}
                    </button>
                  </div>
                ) : (
                  <div className="slot-with-btn" key={`empty-card-${k}`}>
                    <EmptySlot label="card" />
                    <button className="btn small ghost" disabled>
                      &nbsp;
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="slots cards items-row">
              {Array.from({ length: CONSUMABLE_SLOTS }, (_, k) => {
                const id = game.consumables[k]
                return id ? (
                  <div className="slot-with-btn" key={`${id}-${k}`}>
                    <ConsumableView id={id} sell />
                    <button className="btn small" onClick={() => dispatch({ type: 'sellConsumable', slot: k })}>
                      Sell ${sellPrice(CONSUMABLES[id].price)}
                    </button>
                  </div>
                ) : (
                  <div className="slot-with-btn" key={`empty-item-${k}`}>
                    <EmptySlot label="item" kind="item" />
                    <button className="btn small ghost" disabled>
                      &nbsp;
                    </button>
                  </div>
                )
              })}
            </div>
          </Win>
        </div>
      </div>
      <div className="next-bar layer-ui">
        <div className="next-info">
          <b>Next: round {game.roundNo + 1}</b>
          <span>
            {spec.cols}×{spec.rows} · {mineCount(spec)} mines ({Math.round(spec.density * 100)}%)
          </span>
        </div>
        <button className="btn primary big" onClick={() => dispatch({ type: 'nextRound' })}>
          Next round →
        </button>
      </div>
    </div>
  )
}
