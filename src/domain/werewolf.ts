import type { Player } from './types'

export type GameMode = 'normal' | 'werewolf'
export type Role = 'citizen' | 'wolf'
export type Verdict = { winner: Role; reason: 'order' | 'caught' | 'escaped' | 'tie' }

export function assignRoles(players: Player[], randomValue: number): Record<string, Role> {
  if ((players.length < 4 || players.length > 8) || !Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new Error('人狼モードは4〜8人、乱数は0以上1未満です')
  }
  const wolfIndex = Math.floor(randomValue * players.length)
  return Object.fromEntries(players.map((player, index) => [player.id, index === wolfIndex ? 'wolf' : 'citizen']))
}

export function voteLeaders(votes: Record<string, string>): string[] {
  const counts = new Map<string, number>()
  for (const target of Object.values(votes)) counts.set(target, (counts.get(target) ?? 0) + 1)
  const maximum = Math.max(0, ...counts.values())
  return [...counts].filter(([, count]) => count === maximum).map(([id]) => id)
}
