import { describe, expect, it } from 'vitest'
import { createInitialState, reducer } from './appState'

describe('appState reducer', () => {
  it('starts at home', () => {
    expect(createInitialState().screen).toBe('home')
  })

  it('starts a round from setup', () => {
    const state = reducer(createInitialState(), {
      type: 'startRound',
      playerNames: ['みほ', 'ゆうと'],
      cardValues: [10, 60, 20, 80],
      topicRandomValue: 0,
    })

    expect(state.screen).toBe('reveal')
    expect(state.round?.players.map((player) => player.name)).toEqual(['みほ', 'ゆうと'])
    expect(state.round?.cards).toHaveLength(4)
    expect(state.round).not.toHaveProperty('lives')
  })

  it('records a mistake and keeps the round going', () => {
    const started = reducer(createInitialState(), {
      type: 'startRound',
      playerNames: ['A', 'B'],
      cardValues: [50, 60, 10, 20],
      topicRandomValue: 0,
    })

    const opened = reducer(started, { type: 'openCard', cardId: 'card-1' })
    expect(opened.round?.mistakeCardIds).toEqual(['card-1'])
    expect(opened.screen).toBe('open')
  })

  it('judges the opened cards against the high-to-low card order', () => {
    const started = reducer(createInitialState(), {
      type: 'startRound',
      playerNames: ['A', 'B'],
      cardValues: [90, 80, 70, 60],
      topicRandomValue: 0,
    })

    const opened = reducer(started, { type: 'openCard', cardId: 'card-1' })

    expect(opened.round?.mistakeCardIds).toEqual([])
  })

  it('does not finish a round before all cards are opened', () => {
    const started = reducer(createInitialState(), {
      type: 'startRound',
      playerNames: ['A', 'B'],
      cardValues: [10, 20, 30, 40],
      topicRandomValue: 0,
    })
    const opened = reducer(started, { type: 'openCard', cardId: 'card-1' })

    const finished = reducer(opened, { type: 'finishRound' })

    expect(finished.screen).not.toBe('result')
    expect(finished.session.playCount).toBe(0)
    expect(finished.notice).toBe('すべてのカードを開いてください。')
  })

  it('rejects sorted card ids that do not match the current round card set', () => {
    const started = reducer(createInitialState(), {
      type: 'startRound',
      playerNames: ['A', 'B'],
      cardValues: [10, 20, 30, 40],
      topicRandomValue: 0,
    })
    const originalSortedCardIds = started.round?.sortedCardIds

    const duplicate = reducer(started, {
      type: 'setSortedCardIds',
      cardIds: ['card-1', 'card-1', 'card-3', 'card-4'],
    })
    const missing = reducer(started, {
      type: 'setSortedCardIds',
      cardIds: ['card-1', 'card-2', 'card-3'],
    })
    const unknown = reducer(started, {
      type: 'setSortedCardIds',
      cardIds: ['card-1', 'card-2', 'card-3', 'card-999'],
    })

    for (const state of [duplicate, missing, unknown]) {
      expect(state.round?.sortedCardIds).toEqual(originalSortedCardIds)
      expect(state.notice).toBe('カードの並び順が不正です。')
    }
  })

  it('does not throw when opening an unknown card id', () => {
    const started = reducer(createInitialState(), {
      type: 'startRound',
      playerNames: ['A', 'B'],
      cardValues: [10, 20, 30, 40],
      topicRandomValue: 0,
    })

    expect(() => reducer(started, { type: 'openCard', cardId: 'card-999' })).not.toThrow()
    const opened = reducer(started, { type: 'openCard', cardId: 'card-999' })

    expect(opened.round?.openedCardIds).toEqual([])
    expect(opened.notice).toBe('カードをオープンできませんでした。')
  })

  it('does not duplicate opened card ids when opening the same card twice', () => {
    const started = reducer(createInitialState(), {
      type: 'startRound',
      playerNames: ['A', 'B'],
      cardValues: [10, 20, 30, 40],
      topicRandomValue: 0,
    })
    const opened = reducer(started, { type: 'openCard', cardId: 'card-1' })

    const reopened = reducer(opened, { type: 'openCard', cardId: 'card-1' })

    expect(reopened.round?.openedCardIds).toEqual(['card-1'])
  })

  it('updates the current topic without restarting the round', () => {
    const started = reducer(createInitialState(), {
      type: 'startRound',
      playerNames: ['A', 'B'],
      cardValues: [10, 20, 30, 40],
      topicRandomValue: 0,
    })

    const rerolled = reducer(started, {
      type: 'setTopic',
      topic: {
        id: 'custom-topic',
        text: '新しいお題',
        category: 'everyone',
        isBuiltin: false,
      },
    })

    expect(rerolled.round?.topic.text).toBe('新しいお題')
    expect(rerolled.round?.cards).toEqual(started.round?.cards)
    expect(rerolled.screen).toBe('reveal')
  })

  it('does not throw and keeps the previous screen when topic random value is invalid', () => {
    const previous = reducer(createInitialState(), { type: 'go', screen: 'setup' })

    expect(() =>
      reducer(previous, {
        type: 'startRound',
        playerNames: ['A', 'B'],
        cardValues: [10, 20, 30, 40],
        topicRandomValue: 2,
      }),
    ).not.toThrow()
    const state = reducer(previous, {
      type: 'startRound',
      playerNames: ['A', 'B'],
      cardValues: [10, 20, 30, 40],
      topicRandomValue: 2,
    })

    expect(state.screen).toBe('setup')
    expect(state.round).toBeNull()
    expect(state.notice).toBe('ラウンドを開始できませんでした。')
  })

  it('finishes after all cards are opened and increments play count', () => {
    const started = reducer(createInitialState(), {
      type: 'startRound',
      playerNames: ['A', 'B'],
      cardValues: [10, 20, 30, 40],
      topicRandomValue: 0,
    })
    const allOpened = ['card-1', 'card-2', 'card-3', 'card-4'].reduce(
      (state, cardId) => reducer(state, { type: 'openCard', cardId }),
      started,
    )

    const finished = reducer(allOpened, { type: 'finishRound' })

    expect(finished.screen).toBe('result')
    expect(finished.session.playCount).toBe(1)
    expect(finished.session).not.toHaveProperty('successCount')
  })
})
