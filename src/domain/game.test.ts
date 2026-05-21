import { describe, expect, it } from 'vitest'
import {
  dealCards,
  judgeNextCard,
  normalizePlayers,
  sortCardIdsByValue,
} from './game'

describe('normalizePlayers', () => {
  it('uses entered names and fills empty names with player labels', () => {
    expect(normalizePlayers(['みほ', '', '  ゆうと  '])).toEqual([
      { id: 'player-1', name: 'みほ' },
      { id: 'player-2', name: 'プレイヤー2' },
      { id: 'player-3', name: 'ゆうと' },
    ])
  })
})

describe('dealCards', () => {
  it('throws when players is empty', () => {
    expect(() => dealCards([], [])).toThrow('プレイヤーがいません')
  })

  it('deals two cards each for two players', () => {
    const players = normalizePlayers(['A', 'B'])
    const cards = dealCards(players, [12, 44, 7, 80])
    expect(cards).toEqual([
      { id: 'card-1', ownerId: 'player-1', value: 12 },
      { id: 'card-2', ownerId: 'player-1', value: 44 },
      { id: 'card-3', ownerId: 'player-2', value: 7 },
      { id: 'card-4', ownerId: 'player-2', value: 80 },
    ])
  })

  it('deals one card each for four players', () => {
    const players = normalizePlayers(['A', 'B', 'C', 'D'])
    const cards = dealCards(players, [10, 20, 30, 40])
    expect(cards.map((card) => card.ownerId)).toEqual([
      'player-1',
      'player-2',
      'player-3',
      'player-4',
    ])
  })
})

describe('judgeNextCard', () => {
  const cards = [
    { id: 'card-1', ownerId: 'player-1', value: 20 },
    { id: 'card-2', ownerId: 'player-2', value: 10 },
    { id: 'card-3', ownerId: 'player-3', value: 70 },
  ]

  it('marks the smallest unopened card as correct', () => {
    expect(judgeNextCard(cards, [], 'card-2')).toEqual({
      card: cards[1],
      isCorrect: true,
      mistakeCardIds: [],
    })
  })

  it('records a mistake when opening a larger card early', () => {
    expect(judgeNextCard(cards, [], 'card-1')).toEqual({
      card: cards[0],
      isCorrect: false,
      mistakeCardIds: ['card-1'],
    })
  })

  it('throws when selected card is already opened', () => {
    expect(() => judgeNextCard(cards, ['card-2'], 'card-2')).toThrow(
      'すでにオープン済みのカードです',
    )
  })

  it('throws when all cards are already opened', () => {
    expect(() => judgeNextCard(cards, ['card-1', 'card-2', 'card-3'], 'card-2')).toThrow(
      'オープンできるカードがありません',
    )
  })

  it('allows an unopened card with the same minimum value as another unopened card', () => {
    const duplicateValueCards = [
      { id: 'card-1', ownerId: 'player-1', value: 10 },
      { id: 'card-2', ownerId: 'player-2', value: 10 },
      { id: 'card-3', ownerId: 'player-3', value: 30 },
    ]

    expect(judgeNextCard(duplicateValueCards, [], 'card-2')).toEqual({
      card: duplicateValueCards[1],
      isCorrect: true,
      mistakeCardIds: [],
    })
  })
})

describe('sortCardIdsByValue', () => {
  const cards = [
    { id: 'card-1', ownerId: 'player-1', value: 30 },
    { id: 'card-2', ownerId: 'player-2', value: 90 },
    { id: 'card-3', ownerId: 'player-3', value: 60 },
  ]

  it('orders cards from high to low for the consultation phase', () => {
    expect(sortCardIdsByValue(cards, 'descending')).toEqual(['card-2', 'card-3', 'card-1'])
  })

  it('orders cards from low to high when explicitly requested', () => {
    expect(sortCardIdsByValue(cards, 'ascending')).toEqual(['card-1', 'card-3', 'card-2'])
  })
})

describe('judgeNextCard with a fixed expected order', () => {
  const cards = [
    { id: 'card-1', ownerId: 'player-1', value: 90 },
    { id: 'card-2', ownerId: 'player-2', value: 80 },
    { id: 'card-3', ownerId: 'player-3', value: 70 },
  ]
  const expectedOrder = ['card-1', 'card-2', 'card-3']

  it('marks the card at the current position in the high-to-low order as correct', () => {
    expect(judgeNextCard(cards, [], 'card-1', expectedOrder)).toEqual({
      card: cards[0],
      isCorrect: true,
      mistakeCardIds: [],
    })
  })

  it('keeps a swapped card wrong even if it becomes the highest unopened card later', () => {
    expect(judgeNextCard(cards, ['card-2'], 'card-1', expectedOrder)).toEqual({
      card: cards[0],
      isCorrect: false,
      mistakeCardIds: ['card-1'],
    })
  })
})
