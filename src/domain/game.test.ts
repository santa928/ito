import { describe, expect, it } from 'vitest'
import {
  dealCards,
  createCardValues,
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

  it('rejects unsupported player counts before dealing', () => {
    expect(() => dealCards([{ id: 'a', name: 'A' }], [10, 20])).toThrow()
    const tooMany = Array.from({ length: 9 }, (_, i) => ({ id: String(i), name: String(i) }))
    expect(() => dealCards(tooMany, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toThrow()
  })

  it('rejects duplicate or invalid values instead of introducing ambiguous ranks', () => {
    const players = normalizePlayers(['A', 'B'])
    for (const invalid of [0, 101, 2.5, Number.NaN, Infinity, 20]) {
      expect(() => dealCards(players, [invalid, 20, 30, 40])).toThrow()
    }
  })

  it('rejects extra cards and duplicate player identities', () => {
    const players = normalizePlayers(['A', 'B'])
    expect(() => dealCards(players, [10, 20, 30, 40, 50])).toThrow()
    expect(() => dealCards([players[0], players[0]], [10, 20, 30, 40])).toThrow()
  })
})

describe('judgeNextCard', () => {
  const cards = [
    { id: 'card-1', ownerId: 'player-1', value: 20 },
    { id: 'card-2', ownerId: 'player-2', value: 10 },
    { id: 'card-3', ownerId: 'player-3', value: 70 },
  ]

  it('marks the highest card as correct at the first fixed position', () => {
    expect(judgeNextCard(cards, [], 'card-3')).toEqual({
      card: cards[2],
      isCorrect: true,
      mistakeCardIds: [],
    })
  })

  it('records a mistake when opening a lower card early', () => {
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

  it('uses stable dealt order as a tie breaker for standalone callers', () => {
    const duplicateValueCards = [
      { id: 'card-1', ownerId: 'player-1', value: 10 },
      { id: 'card-2', ownerId: 'player-2', value: 10 },
      { id: 'card-3', ownerId: 'player-3', value: 30 },
    ]

    expect(judgeNextCard(duplicateValueCards, ['card-3', 'card-1'], 'card-2')).toEqual({
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

  it('marks the card at the current position in the high-to-low order as correct', () => {
    expect(judgeNextCard(cards, [], 'card-1')).toEqual({
      card: cards[0],
      isCorrect: true,
      mistakeCardIds: [],
    })
  })

  it('keeps a swapped card wrong even if it becomes the highest unopened card later', () => {
    expect(judgeNextCard(cards, ['card-2'], 'card-1')).toEqual({
      card: cards[0],
      isCorrect: false,
      mistakeCardIds: ['card-1'],
    })
  })
})

describe('finite card generation', () => {
  it('terminates with unique cards even with a constant random source', () => {
    let calls = 0
    const values = createCardValues(100, () => { calls += 1; return 0 })
    expect(values).toEqual(Array.from({ length: 100 }, (_, index) => index + 1))
    expect(calls).toBeLessThanOrEqual(100)
    expect(createCardValues(0)).toEqual([])
  })

  it('rejects invalid counts and random values', () => {
    for (const count of [-1, 1.5, 101, Number.NaN, Infinity]) expect(() => createCardValues(count)).toThrow()
    for (const random of [-1, 1, Number.NaN, Infinity]) expect(() => createCardValues(4, () => random)).toThrow()
  })

  it.each([2, 3, 4, 5, 6, 7, 8])('deals the correct number of unique cards for %i players', (count) => {
    const names = Array.from({ length: count }, (_, index) => String(index))
    const required = count <= 3 ? count * 2 : count
    const cards = dealCards(normalizePlayers(names), createCardValues(required))
    expect(cards).toHaveLength(required)
    expect(new Set(cards.map((card) => card.value)).size).toBe(required)
    expect(cards.every((card) => Number.isInteger(card.value) && card.value >= 1 && card.value <= 100)).toBe(true)
  })
})

/** 独立した正解配列から、4枚の全提出順を作る。 */
function permutations(values: string[]): string[][] {
  return values.length === 0 ? [[]] : values.flatMap((value) => permutations(values.filter((other) => other !== value)).map((rest) => [value, ...rest]))
}

it.each(permutations(['a', 'b', 'c', 'd']))('fixed ranks for submitted order %j', (...order: string[]) => {
  const cards = [
    { id: 'd', ownerId: 'P1', value: 10 }, { id: 'b', ownerId: 'P2', value: 70 },
    { id: 'a', ownerId: 'P3', value: 90 }, { id: 'c', ownerId: 'P4', value: 40 },
  ]
  const expected = ['a', 'b', 'c', 'd']
  order.forEach((id, index) => expect(judgeNextCard(cards, order.slice(0, index), id).isCorrect).toBe(id === expected[index]))
})
