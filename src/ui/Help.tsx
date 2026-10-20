import { BONUS_INFO, type BonusKind } from '../engine'
import { Icon } from './Icon'
import { BONUS_ICON } from './icons'

export function Help() {
  return (
    <div className="help">
      <h3>How to play</h3>
      <ul>
        <li>
          <b>Tap</b> a tile to uncover it, <b>hold</b> (or right-click) to flag it. Use the Dig/Flag button to swap. Tap a number whose flags are
          all placed to uncover the rest around it.
        </li>
        <li>Every number is worth that many chips. Chips × multiplier = score. Reach the target (the total of the whole board) to win the round.</li>
        <li>Each consecutive safe move adds +0.04 to the multiplier. A mine resets it and costs a heart. No hearts, run over.</li>
        <li>Survive 12 rounds. Between rounds, spend money on bonus cards (5 slots) and consumables (2 slots).</li>
        <li>The first tap of a round is always safe.</li>
      </ul>
      <h3>Bonus cells</h3>
      <p className="muted">Some safe tiles hide a bonus cell. You only find out when you uncover them, and never on a mine. Afterwards, hover or tap the icon on the tile to see what it did.</p>
      <ul className="bonus-list">
        {(Object.keys(BONUS_INFO) as BonusKind[]).map((k) => (
          <li key={k}>
            <span className="mini-bonus">
              <Icon file={BONUS_ICON[k]} size={20} px={false} />
            </span>
            <span>
              <b>{BONUS_INFO[k].name}</b>: {BONUS_INFO[k].desc}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
