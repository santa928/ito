import { describe, expect, it } from 'vitest'
import {
  calculateLives,
  dealCards,
  judgeNextCard,
  normalizePlayers,
  summarizeRound,
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

describe('calculateLives', () => {
  it('returns 1 life for four or fewer cards', () => {
    expect(calculateLives(4)).toBe(1)
  })

  it('returns 2 lives for five or six cards', () => {
    expect(calculateLives(6)).toBe(2)
  })

  it('returns 3 lives for seven or more cards', () => {
    expect(calculateLives(7)).toBe(3)
  })
})

describe('judgeNextCard', () => {
  const cards = [
    { id: 'card-1', ownerId: 'player-1', value: 20 },
    { id: 'card-2', ownerId: 'player-2', value: 10 },
    { id: 'card-3', ownerId: 'player-3', value: 70 },
  ]

  it('marks the smallest unopened card as correct', () => {
    expect(judgeNextCard(cards, [], 'card-2', 1)).toEqual({
      card: cards[1],
      isCorrect: true,
      remainingLives: 1,
      mistakeCardIds: [],
    })
  })

  it('decreases life and records a mistake when opening a larger card early', () => {
    expect(judgeNextCard(cards, [], 'card-1', 1)).toEqual({
      card: cards[0],
      isCorrect: false,
      remainingLives: 0,
      mistakeCardIds: ['card-1'],
    })
  })

  it('throws when selected card is already opened', () => {
    expect(() => judgeNextCard(cards, ['card-2'], 'card-2', 1)).toThrow(
      'すでにオープン済みのカードです',
    )
  })

  it('throws when all cards are already opened', () => {
    expect(() => judgeNextCard(cards, ['card-1', 'card-2', 'card-3'], 'card-2', 1)).toThrow(
      'オープンできるカードがありません',
    )
  })

  it('allows an unopened card with the same minimum value as another unopened card', () => {
    const duplicateValueCards = [
      { id: 'card-1', ownerId: 'player-1', value: 10 },
      { id: 'card-2', ownerId: 'player-2', value: 10 },
      { id: 'card-3', ownerId: 'player-3', value: 30 },
    ]

    expect(judgeNextCard(duplicateValueCards, [], 'card-2', 1)).toEqual({
      card: duplicateValueCards[1],
      isCorrect: true,
      remainingLives: 1,
      mistakeCardIds: [],
    })
  })
})

describe('summarizeRound', () => {
  it('returns success when at least one life remains', () => {
    const cards = [
      { id: 'card-1', ownerId: 'player-1', value: 10 },
      { id: 'card-2', ownerId: 'player-2', value: 20 },
    ]
    expect(summarizeRound(cards, ['card-1', 'card-2'], ['card-2'], 1)).toEqual({
      success: true,
      remainingLives: 1,
      mistakeCardIds: ['card-2'],
      openedCards: [
        { id: 'card-1', ownerId: 'player-1', value: 10, openedAt: 1, wasMistake: false },
        { id: 'card-2', ownerId: 'player-2', value: 20, openedAt: 2, wasMistake: true },
      ],
    })
  })
})
