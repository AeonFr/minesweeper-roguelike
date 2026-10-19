import { CARD_SLOTS, CARDS, CONSUMABLES, CONSUMABLE_SLOTS, mineCount, rerollCost, roundSpec, sellPrice, type GameState } from '../engine'
import { dispatch } from '../store'
import { CardView, ConsumableView, EmptySlot } from './Cards'
import { Hud } from './Hud'

export function Shop({ game }: { game: GameState }) {
  const shop = game.shop!
  const spec = roundSpec(game.roundNo + 1)
  const mines = mineCount(spec)
  const total = game.payout.reduce((p, l) => p + l.amount, 0)
  const cardsFull = game.cards.length >= CARD_SLOTS
  const consFull = game.consumables.length >= CONSUMABLE_SLOTS
  const cost = rerollCost(shop.rerolls)
  return (
    <div className="screen shop-screen">
      <Hud game={game} />
      <div className="shop-scroll">
        <section className="panel payout layer-ui">
          <h2>Round {game.roundNo} cleared!</h2>
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
        </section>

        <section className="panel layer-ui">
          <h3>Bonus cards</h3>
          <div className="offers">
            {shop.cards.map((o, k) =>
              o ? (
                <div className="offer" key={o.id}>
                  <CardView id={o.id} game={game} big />
                  <button
                    className="btn buy"
                    disabled={game.money < o.price || cardsFull}
                    onClick={() => dispatch({ type: 'buyCard', offer: k })}
                  >
                    {cardsFull ? 'Full' : `Buy $${o.price}`}
                  </button>
                </div>
              ) : (
                <div className="offer" key={`sold-${k}`}>
                  <div className="card big empty">
                    <span>sold</span>
                  </div>
                  <button className="btn buy ghost" disabled>
                    &nbsp;
                  </button>
                </div>
              ),
            )}
          </div>
          <h3>Consumables</h3>
          <div className="offers">
            {shop.cons.map((o, k) =>
              o ? (
                <div className="offer" key={`${o.id}-${k}`}>
                  <ConsumableView id={o.id} big />
                  <button
                    className="btn buy"
                    disabled={game.money < o.price || consFull}
                    onClick={() => dispatch({ type: 'buyConsumable', offer: k })}
                  >
                    {consFull ? 'Full' : `Buy $${o.price}`}
                  </button>
                </div>
              ) : (
                <div className="offer" key={`sold-${k}`}>
                  <div className="card big empty">
                    <span>sold</span>
                  </div>
                  <button className="btn buy ghost" disabled>
                    &nbsp;
                  </button>
                </div>
              ),
            )}
            <div className="offer">
              <button className="reroll" disabled={game.money < cost} onClick={() => dispatch({ type: 'reroll' })}>
                <span>🔄</span>
                <small>Reroll ${cost}</small>
              </button>
              <button className="btn buy ghost" disabled>
                &nbsp;
              </button>
            </div>
          </div>
        </section>

        <section className="panel layer-ui">
          <h3>Your items</h3>
          <div className="slots cards">
            {Array.from({ length: CARD_SLOTS }, (_, k) => {
              const c = game.cards[k]
              return c ? (
                <div className="slot-with-btn" key={c.uid}>
                  <CardView id={c.id} card={c} game={game} sell />
                  <button className="btn small" onClick={() => dispatch({ type: 'sellCard', slot: k })}>
                    Sell ${sellPrice(CARDS[c.id].price)}
                  </button>
                </div>
              ) : (
                <div className="slot-with-btn" key={k}>
                  <EmptySlot label="card" />
                  <button className="btn small ghost" disabled>
                    &nbsp;
                  </button>
                </div>
              )
            })}
          </div>
          <div className="slots lower">
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
                <div className="slot-with-btn" key={k}>
                  <EmptySlot label="item" />
                  <button className="btn small ghost" disabled>
                    &nbsp;
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </div>
      <div className="next-bar layer-ui">
        <div className="next-info">
          <b>Next: round {game.roundNo + 1}</b>
          <span>
            {spec.cols}×{spec.rows} · {mines} mines ({Math.round(spec.density * 100)}%)
          </span>
        </div>
        <button className="btn primary big" onClick={() => dispatch({ type: 'nextRound' })}>
          Next round →
        </button>
      </div>
    </div>
  )
}
