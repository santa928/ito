import { describe, expect, it } from 'vitest'
import { createInitialState, reducer } from './appState'
import type { AppState, Screen } from './appState'

/** 実際の遷移を使って、固定カードを持つ指定段階の状態を作る。 */
function atStage(stage: 'reveal' | 'topic' | 'sort' | 'open' = 'open'): AppState {
  let state = reducer(createInitialState(), { type: 'startRound', playerNames: ['A', 'B'], cardValues: [90, 70, 40, 10], topicRandomValue: 0 })
  for (const screen of ['topic', 'sort', 'open'] as const) {
    if (state.screen === stage) break
    state = reducer(state, { type: 'go', screen })
  }
  return state
}

/** 表示中の全カードを現在の順で開き、結果画面まで進める。 */
function finish(state: AppState): AppState {
  for (const cardId of state.round!.sortedCardIds) state = reducer(state, { type: 'openCard', cardId })
  return reducer(state, { type: 'finishRound' })
}

const otherTopic = { id: 'custom-topic', text: '新しいお題', category: 'everyone' as const, isBuiltin: false }

describe('appState reducer', () => {
  it('starts at home and deals a round with no lives', () => {
    expect(createInitialState().screen).toBe('home')
    const state = atStage('reveal')
    expect(state.round?.players.map((player) => player.name)).toEqual(['A', 'B'])
    expect(state.round?.cards).toHaveLength(4)
    expect(state.round).not.toHaveProperty('lives')
  })

  it('judges swaps by fixed descending ranks and keeps the round going', () => {
    let state = reducer(atStage('sort'), { type: 'setSortedCardIds', cardIds: ['card-2', 'card-1', 'card-3', 'card-4'] })
    state = reducer(state, { type: 'go', screen: 'open' })
    state = finish(state)
    expect(state.round?.mistakeCardIds).toEqual(['card-2', 'card-1'])
    expect(state.screen).toBe('result')
    expect(state.session.playCount).toBe(1)
  })

  it('does not finish before all cards are opened', () => {
    const state = reducer(atStage(), { type: 'finishRound' })
    expect(state.screen).toBe('open')
    expect(state.session.playCount).toBe(0)
    expect(state.notice).toBe('すべてのカードを開いてください。')
  })

  it('rejects duplicate, missing and unknown IDs when sorting', () => {
    const state = atStage('sort')
    for (const cardIds of [['card-1', 'card-1', 'card-3', 'card-4'], ['card-1'], ['card-1', 'card-2', 'card-3', 'unknown']]) {
      const changed = reducer(state, { type: 'setSortedCardIds', cardIds })
      expect(changed.round).toEqual(state.round)
      expect(changed.notice).toBe('カードの並び順が不正です。')
    }
  })

  it('only opens the next card and duplicate actions cannot advance', () => {
    const state = atStage()
    for (const cardId of ['card-2', 'unknown']) {
      expect(reducer(state, { type: 'openCard', cardId }).round).toEqual(state.round)
    }
    const opened = reducer(state, { type: 'openCard', cardId: 'card-1' })
    expect(opened.round?.mistakeCardIds).toEqual([])
    expect(reducer(opened, { type: 'openCard', cardId: 'card-1' })).toBe(opened)
  })

  it('changes the topic before opening without replacing the cards', () => {
    const state = atStage('reveal')
    const changed = reducer(state, { type: 'setTopic', topic: otherTopic })
    expect(changed.round?.topic).toEqual(otherTopic)
    expect(changed.round?.cards).toEqual(state.round?.cards)
    expect(changed.screen).toBe('reveal')
  })

  it('locks the topic and order after the first reveal', () => {
    const state = reducer(atStage(), { type: 'openCard', cardId: 'card-1' })
    expect(reducer(state, { type: 'setTopic', topic: otherTopic })).toBe(state)
    expect(reducer(state, { type: 'setSortedCardIds', cardIds: ['card-2', 'card-1', 'card-3', 'card-4'] })).toBe(state)
  })

  it('rejects opening or sorting in the wrong phase', () => {
    const state = atStage('reveal')
    expect(reducer(state, { type: 'openCard', cardId: 'card-1' })).toBe(state)
    expect(reducer(state, { type: 'setSortedCardIds', cardIds: ['card-2', 'card-1', 'card-3', 'card-4'] })).toBe(state)
    expect(reducer(state, { type: 'finishRound' })).toBe(state)
  })

  it('cannot skip forward or return a completed round to opening', () => {
    const home = createInitialState()
    for (const screen of ['reveal', 'topic', 'sort', 'open', 'result'] as Screen[]) expect(reducer(home, { type: 'go', screen })).toBe(home)
    const revealed = atStage('reveal')
    expect(reducer(revealed, { type: 'go', screen: 'result' })).toBe(revealed)
    expect(reducer(revealed, { type: 'go', screen: 'home' })).toBe(revealed)
    const completed = finish(atStage())
    expect(reducer(completed, { type: 'go', screen: 'open' })).toBe(completed)
    expect(reducer(completed, { type: 'finishRound' })).toBe(completed)
  })

  it('finishes, starts a fresh round with the same people and counts each completion once', () => {
    const first = finish(atStage())
    const again = reducer(first, { type: 'startRound', playerNames: first.round!.players.map((p) => p.name), cardValues: [15, 25, 35, 45], topicRandomValue: 0 })
    expect(again.screen).toBe('reveal')
    expect(again.round?.openedCardIds).toEqual([])
    expect(again.round?.mistakeCardIds).toEqual([])
    expect(again.round?.players).toEqual(first.round?.players)
    let playing = again
    for (const screen of ['topic', 'sort', 'open'] as const) playing = reducer(playing, { type: 'go', screen })
    expect(finish(playing).session.playCount).toBe(2)
  })

  it('explicitly ending a round clears only the current round', () => {
    const completed = finish(atStage())
    const ended = reducer(completed, { type: 'endRound' })
    expect(ended.round).toBeNull()
    expect(ended.screen).toBe('home')
    expect(ended.session.playCount).toBe(1)
    expect(reducer(atStage('reveal'), { type: 'endRound' }).round).toBeNull()
  })

  it('keeps the previous screen on invalid start input or topic randomness', () => {
    const state = reducer(createInitialState(), { type: 'go', screen: 'setup' })
    for (const names of [[], ['A'], Array(101).fill('A')]) {
      const changed = reducer(state, { type: 'startRound', playerNames: names, cardValues: [10, 20, 30, 40] })
      expect(changed.screen).toBe('setup')
      expect(changed.round).toBeNull()
    }
    expect(reducer(state, { type: 'startRound', playerNames: ['A', 'B'], cardValues: [10, 20, 30, 40], topicRandomValue: 2 }).notice).toBe('ラウンドを開始できませんでした。')
  })

  it('explains an empty topic pool without replacing a completed round', () => {
    const state = finish(atStage())
    const changed = reducer(state, { type: 'startRound', playerNames: ['A', 'B'], cardValues: [10, 20, 30, 40], topics: [] })
    expect(changed.round).toBe(state.round)
    expect(changed.notice).toContain('お題が0件')
  })
})
