import type { Card, Player } from './types'

/** 同じ持ち主のカード群の中で、対象カードが何枚目かを1始まりで返す。 */
export function cardOrdinalForOwner(cards: Card[], card: Card): number {
  const ownerCards = cards.filter((candidate) => candidate.ownerId === card.ownerId)
  const ordinal = ownerCards.findIndex((candidate) => candidate.id === card.id) + 1

  if (ordinal === 0) {
    throw new Error(`カードが見つかりません: ${card.id}`)
  }

  return ordinal
}

/** 並べ替えやふりかえりで使う、持ち主と何枚目かが分かるカード名を作る。 */
export function formatCardLabel(cards: Card[], players: Player[], card: Card): string {
  const owner = players.find((player) => player.id === card.ownerId)
  if (!owner) {
    throw new Error(`プレイヤーが見つかりません: ${card.ownerId}`)
  }

  const ownerCardCount = cards.filter((candidate) => candidate.ownerId === card.ownerId).length
  if (ownerCardCount <= 1) {
    return `${owner.name} のカード`
  }

  return `${owner.name} の${cardOrdinalForOwner(cards, card)}枚目`
}
