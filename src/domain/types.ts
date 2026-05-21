export type Player = {
  id: string
  name: string
}

export type Card = {
  id: string
  ownerId: string
  value: number
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
  mistakeCardIds: string[]
}
