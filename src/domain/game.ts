import type { Card, JudgeResult, OpenedCard, Player, RoundResult } from './types'

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

/** カード総数からミスを許容するライフ数を計算する。 */
export function calculateLives(cardCount: number): number {
  if (cardCount <= 4) {
    return 1
  }
  if (cardCount <= 6) {
    return 2
  }
  return 3
}

/** 選択カードが未オープンの最小カードかを判定し、ライフとミスを返す。 */
export function judgeNextCard(
  cards: Card[],
  openedCardIds: string[],
  selectedCardId: string,
  currentLives: number,
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

  const smallestUnopenedValue = Math.min(...unopenedCards.map((card) => card.value))
  const isCorrect = selectedCard.value === smallestUnopenedValue
  const remainingLives = isCorrect ? currentLives : Math.max(0, currentLives - 1)

  return {
    card: selectedCard,
    isCorrect,
    remainingLives,
    mistakeCardIds: isCorrect ? [] : [selectedCard.id],
  }
}

/** 開いた順序とミス情報からラウンド結果を作る。 */
export function summarizeRound(
  cards: Card[],
  openedCardIds: string[],
  mistakeCardIds: string[],
  remainingLives: number,
): RoundResult {
  const mistakes = new Set(mistakeCardIds)
  const openedCards: OpenedCard[] = openedCardIds.map((cardId, index) => {
    const card = cards.find((candidate) => candidate.id === cardId)
    if (!card) {
      throw new Error(`オープン済みカードが見つかりません: ${cardId}`)
    }
    return {
      ...card,
      openedAt: index + 1,
      wasMistake: mistakes.has(card.id),
    }
  })

  return {
    success: remainingLives > 0,
    openedCards,
    mistakeCardIds,
    remainingLives,
  }
}
