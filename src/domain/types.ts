export type Player = {
  id: string
  name: string
}

export type Card = {
  id: string
  ownerId: string
  value: number
}

export type OpenedCard = Card & {
  openedAt: number
  wasMistake: boolean
}

export type TopicCategory = 'everyone' | 'friends' | 'drinks'

export type Topic = {
  id: string
  text: string
  category: TopicCategory
  isBuiltin: boolean
}

export type JudgeResult = {
  card: Card
  isCorrect: boolean
  remainingLives: number
  mistakeCardIds: string[]
}

export type RoundResult = {
  success: boolean
  openedCards: OpenedCard[]
  mistakeCardIds: string[]
  remainingLives: number
}
