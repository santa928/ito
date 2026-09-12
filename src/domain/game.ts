import type { Card, JudgeResult, Player } from './types'

export type SortDirection = 'ascending' | 'descending'

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 8
export const MAX_NAME_LENGTH = 24

/** 絵文字のサロゲートペアを壊さず、名前入力を共通の文字数上限に収める。 */
export function limitPlayerName(name: string): string {
  return Array.from(name).slice(0, MAX_NAME_LENGTH).join('')
}

/** 配布可能な人数だけを受け入れ、不正な保存値による過大な処理を防ぐ。 */
function validatePlayerCount(count: number): void {
  if (!Number.isInteger(count) || count < MIN_PLAYERS || count > MAX_PLAYERS) {
    throw new Error('人数は2〜8人で指定してください')
  }
}

/** 有限の山札から重複なしで数字を引く。乱数が偏っても処理は終了する。 */
export function createCardValues(count: number, random: () => number = Math.random): number[] {
  if (!Number.isInteger(count) || count < 0 || count > 100) {
    throw new Error('カード枚数は0〜100枚で指定してください')
  }
  const deck = Array.from({ length: 100 }, (_, index) => index + 1)
  for (let index = 0; index < count; index += 1) {
    const value = random()
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new Error('乱数値は0以上1未満で指定してください')
    }
    const selectedIndex = index + Math.floor(value * (deck.length - index))
    ;[deck[index], deck[selectedIndex]] = [deck[selectedIndex], deck[index]]
  }
  return deck.slice(0, count)
}

/** 入力された名前をゲーム内プレイヤーとして扱える形式へ正規化する。 */
export function normalizePlayers(names: string[]): Player[] {
  validatePlayerCount(names.length)
  return names.map((name, index) => {
    if (typeof name !== 'string') throw new Error('名前を文字で入力してください')
    const trimmedName = limitPlayerName(name.trim())
    const playerNumber = index + 1
    return {
      id: `player-${playerNumber}`,
      name: trimmedName.length > 0 ? trimmedName : `プレイヤー${playerNumber}`,
    }
  })
}

/** プレイヤー人数から1人あたりの配布カード枚数を決める。 */
export function cardsPerPlayer(playerCount: number): number {
  validatePlayerCount(playerCount)
  return playerCount <= 3 ? 2 : 1
}

/** プレイヤー順に指定された数値をカードとして配る。 */
export function dealCards(players: Player[], values: number[]): Card[] {
  if (players.length === 0) {
    throw new Error('プレイヤーがいません')
  }

  const perPlayer = cardsPerPlayer(players.length)
  const requiredCardCount = players.length * perPlayer

  if (values.length !== requiredCardCount) {
    throw new Error(`カードの枚数が正しくありません: required=${requiredCardCount}, actual=${values.length}`)
  }
  if (players.some((player) => !player.id.trim()) || new Set(players.map((player) => player.id)).size !== players.length) {
    throw new Error('プレイヤーを重複しないIDで指定してください')
  }

  const dealtValues = values.slice(0, requiredCardCount)
  if (dealtValues.some((value) => !Number.isInteger(value) || value < 1 || value > 100)
    || new Set(dealtValues).size !== requiredCardCount) {
    throw new Error('カードは1〜100の重複しない整数で指定してください')
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

/** 全カードを高い順に並べた固定順位と、今回開くカードの位置を比較する。 */
export function judgeNextCard(
  cards: Card[],
  openedCardIds: string[],
  selectedCardId: string,
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

  const expectedCardId = sortCardIdsByValue(cards, 'descending')[openedCardIds.length]
  const isCorrect = selectedCard.id === expectedCardId

  return {
    card: selectedCard,
    isCorrect,
    mistakeCardIds: isCorrect ? [] : [selectedCard.id],
  }
}
