import type { BonusKind } from './types'

export const BONUS_INFO: Record<BonusKind, { name: string; emoji: string; desc: string }> = {
  coin: { name: 'Paycheck', emoji: '🪙', desc: 'Earn $1.' },
  star: { name: 'Gold Star', emoji: '⭐', desc: 'Adds points to your score (2 + the round number).' },
  spark: { name: 'Overclock', emoji: '✨', desc: 'Adds x0.15 to your base multiplier for this round.' },
  flame: { name: 'Double-Click', emoji: '🔥', desc: 'Adds 4 to your streak.' },
  crystal: { name: 'Setup Wizard', emoji: '🔮', desc: 'Uncovers a random hidden safe tile.' },
  gift: { name: 'Free Game', emoji: '🎁', desc: 'Gives a random consumable, or $1 if your slots are full.' },
  shield: { name: 'Firewall', emoji: '🛡️', desc: 'The next mine you hit this round is harmless.' },
  life: { name: 'Day Off', emoji: '🙂', desc: 'Restores a life, or $1 if you already have all your lives.' },
}
