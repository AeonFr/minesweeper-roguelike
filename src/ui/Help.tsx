import { BONUS_INFO, type BonusKind } from '../engine'

export function Help() {
  return (
    <div className="help">
      <h3>How to play</h3>
      <ul>
        <li>
          <b>Tap</b> a tile to uncover it, <b>hold</b> (or right-click) to flag it. Use the ⛏️/🚩 button to swap. Tap a number whose flags are
          all placed to uncover the rest around it.
        </li>
        <li>Every number is worth that many chips. Chips × multiplier = score. Reach the target (the total of the whole board) to win the round.</li>
        <li>Each consecutive safe move adds +0.05 to the multiplier. A mine resets it and costs a heart. No hearts, run over.</li>
        <li>Survive 12 rounds. Between rounds, spend money on bonus cards (5 slots) and consumables (2 slots).</li>
        <li>The first tap of a round is always safe.</li>
      </ul>
      <h3>Bonus cells</h3>
      <p className="muted">Shiny tiles appear after your first move. Mostly they sit on safe ground… mostly.</p>
      <ul className="bonus-list">
        {(Object.keys(BONUS_INFO) as BonusKind[]).map((k) => (
          <li key={k}>
            <span className={`mini-bonus bonus-${k}`}>{BONUS_INFO[k].emoji}</span>
            <span>
              <b>{BONUS_INFO[k].name}</b>: {BONUS_INFO[k].desc}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
