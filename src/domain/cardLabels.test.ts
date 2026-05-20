import { describe, expect, it } from 'vitest'
import { dealCards, normalizePlayers } from './game'
import { cardOrdinalForOwner, formatCardLabel } from './cardLabels'

describe('cardOrdinalForOwner', () => {
  it('returns the position among cards owned by the same player', () => {
    const players = normalizePlayers(['みほ', 'ゆうと'])
    const cards = dealCards(players, [12, 44, 7, 80])

    expect(cardOrdinalForOwner(cards, cards[0])).toBe(1)
    expect(cardOrdinalForOwner(cards, cards[1])).toBe(2)
    expect(cardOrdinalForOwner(cards, cards[2])).toBe(1)
    expect(cardOrdinalForOwner(cards, cards[3])).toBe(2)
  })
})

describe('formatCardLabel', () => {
  it('adds an ordinal when a player has multiple cards', () => {
    const players = normalizePlayers(['みほ', 'ゆうと'])
    const cards = dealCards(players, [12, 44, 7, 80])

    expect(formatCardLabel(cards, players, cards[0])).toBe('みほ の1枚目')
    expect(formatCardLabel(cards, players, cards[1])).toBe('みほ の2枚目')
  })

  it('omits the ordinal when a player has only one card', () => {
    const players = normalizePlayers(['A', 'B', 'C', 'D'])
    const cards = dealCards(players, [10, 20, 30, 40])

    expect(formatCardLabel(cards, players, cards[0])).toBe('A のカード')
  })
})
