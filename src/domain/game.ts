import type { Card, JudgeResult, Player } from './types'

export type SortDirection = 'ascending' | 'descending'

/** 入力された名前をゲーム内プレイヤーとして扱える形式へ正規化する。 */
export function normalizePlayers(names: string[]): Player[] {
  return names.map((name, index) => {
    const trimmedName = name.trim()
    const playerNumber = index + 1
    return {
      id: `player-${playerNumber}`,
      name: trimmedName.length > 0 ? trimmedName : `プレイヤー${playerNumber}`,
    }
  })
}

/** プレイヤー人数から1人あたりの配布カード枚数を決める。 */
export function cardsPerPlayer(playerCount: number): number {
  return playerCount <= 3 ? 2 : 1
}

/** プレイヤー順に指定された数値をカードとして配る。 */
export function dealCards(players: Player[], values: number[]): Card[] {
  if (players.length === 0) {
    throw new Error('プレイヤーがいません')
  }

  const perPlayer = cardsPerPlayer(players.length)
  const requiredCardCount = players.length * perPlayer

  if (values.length < requiredCardCount) {
    throw new Error(`カード値が足りません: required=${requiredCardCount}, actual=${values.length}`)
  }

  return players.flatMap((player, playerIndex) =>
    Array.from({ length: perPlayer }, (_, cardIndex) => {
      const valueIndex = playerIndex * perPlayer + cardIndex
      return {
        id: `card-${valueIndex + 1}`,
        ownerId: player.id,
        value: values[valueIndex],
      }
    }),
  )
}

/** カードIDを数字の大小順に並べ、同値なら元の配布順を保つ。 */
export function sortCardIdsByValue(cards: Card[], direction: SortDirection): string[] {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((left, right) => {
      const valueDiff =
        direction === 'ascending'
          ? left.card.value - right.card.value
          : right.card.value - left.card.value
      return valueDiff === 0 ? left.index - right.index : valueDiff
    })
    .map(({ card }) => card.id)
}

/** 選択カードが期待順の現在位置にあるかを判定し、ミス情報を返す。 */
export function judgeNextCard(
  cards: Card[],
  openedCardIds: string[],
  selectedCardId: string,
  expectedCardIds?: string[],
): JudgeResult {
  const selectedCard = cards.find((card) => card.id === selectedCardId)
  if (!selectedCard) {
    throw new Error(`カードが見つかりません: ${selectedCardId}`)
  }

  const openedSet = new Set(openedCardIds)
  const unopenedCards = cards.filter((card) => !openedSet.has(card.id))
  if (unopenedCards.length === 0) {
    throw new Error('オープンできるカードがありません')
  }
  if (openedSet.has(selectedCard.id)) {
    throw new Error(`すでにオープン済みのカードです: ${selectedCard.id}`)
  }

  const expectedCardId = expectedCardIds?.[openedCardIds.length]
  const smallestUnopenedValue = Math.min(...unopenedCards.map((card) => card.value))
  const isCorrect = expectedCardId
    ? selectedCard.id === expectedCardId
    : selectedCard.value === smallestUnopenedValue

  return {
    card: selectedCard,
    isCorrect,
    mistakeCardIds: isCorrect ? [] : [selectedCard.id],
  }
}
