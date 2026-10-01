import { describe, expect, it } from 'vitest'
import { assignRoles } from '../domain/werewolf'
import { normalizePlayers } from '../domain/game'
import { createInitialState, reducer } from './appState'
import type { AppState, AppAction } from './appState'

function sorted(values = [90, 60, 30, 10], wolf = 0): AppState {
  let state = reducer(createInitialState(), { type: 'startRound', mode: 'werewolf', playerNames: values.map((_, i) => `P${i}`), cardValues: values, roleRandomValue: wolf })
  state = reducer(state, { type: 'go', screen: 'topic' })
  return reducer(state, { type: 'go', screen: 'sort' })
}
function voting(): AppState {
  let state = reducer(sorted([10, 30, 60, 90]), { type: 'lockOrder' })
  state = reducer(state, { type: 'startDiscussion', now: 1000 })
  return reducer(state, { type: 'startVote', now: 61_000 })
}
function ballot(state: AppState, targets: number[]): AppState {
  targets.forEach((target, index) => { state = reducer(state, { type: 'castVote', voterId: `player-${index + 1}`, targetId: `player-${target}`, ballot: state.round!.ballot }) })
  return state
}
describe('人狼の状態遷移', () => {
  it('4〜8人で常に1人だけ人狼、1人1枚', () => {
    for (let count = 4; count <= 8; count++) {
      for (let index = 0; index < count; index++) {
        const state = sorted(Array.from({ length: count }, (_, i) => i + 1), (index + 0.5) / count)
        expect(state.round?.cards).toHaveLength(count)
        expect(Object.values(state.round!.roles).filter((r) => r === 'wolf')).toHaveLength(1)
        expect(state.round!.roles[`player-${index + 1}`]).toBe('wolf')
      }
    }
  })
  it('3人以下は開始できない、不正な乱数も拒否', () => {
    for (const count of [2, 3]) {
      const state = reducer(createInitialState(), { type: 'startRound', mode: 'werewolf', playerNames: Array(count).fill(''), cardValues: Array.from({ length: count * 2 }, (_, i) => i + 1) })
      expect(state.round).toBeNull()
      expect(state.screen).toBe('home')
    }
    for (const value of [-1, 1, NaN, Infinity]) expect(() => assignRoles(normalizePlayers(['', '', '', '']), value)).toThrow()
  })
  it('高い順なら投票なしで市民勝利、確定は一度だけ', () => {
    const state = reducer(sorted(), { type: 'lockOrder' })
    expect(state.screen).toBe('result')
    expect(state.round?.verdict).toEqual({ winner: 'citizen', reason: 'order' })
    expect(state.session.playCount).toBe(1)
    expect(reducer(state, { type: 'lockOrder' })).toBe(state)
  })
  it('低い順は不正解になり、勝敗を確定せず議論へ進む', () => {
    const state = reducer(sorted([10, 30, 60, 90]), { type: 'lockOrder' })
    expect(state.screen).toBe('discussion')
    expect(state.round?.verdict).toBeNull()
    expect(state.round?.mistakeCardIds).toHaveLength(4)
    expect(state.session.playCount).toBe(0)
  })
  it('通常のopen経路を拒否し、公開後は並びとお題を変更できない', () => {
    const before = sorted([10, 30, 60, 90])
    expect(reducer(before, { type: 'go', screen: 'open' })).toBe(before)
    const state = reducer(before, { type: 'lockOrder' })
    expect(state.screen).toBe('discussion')
    expect(state.round?.openedCardIds).toHaveLength(4)
    expect(state.round?.verdict).toBeNull()
    for (const action of [{ type: 'setSortedCardIds', cardIds: ['card-4', 'card-3', 'card-2', 'card-1'] }, { type: 'go', screen: 'sort' }, { type: 'setTopic', topic: state.round!.topic }, { type: 'finishRound' }] as AppAction[]) expect(reducer(state, action)).toBe(state)
  })
  it('手動開始後60秒経過するまで投票不可、中断後も期限を維持', () => {
    const state = reducer(sorted([10, 30, 60, 90]), { type: 'lockOrder' })
    expect(reducer(state, { type: 'startVote', now: 1_000_000 })).toBe(state)
    const started = reducer(state, { type: 'startDiscussion', now: 1000 })
    expect(reducer(started, { type: 'startDiscussion', now: 5000 })).toBe(started)
    expect(reducer(started, { type: 'startVote', now: 60_999 })).toBe(started)
    expect(reducer(started, { type: 'startVote', now: 1_000_000 }).screen).toBe('vote')
  })
  it('自分・存在しない対象・順番違い・重複・古い投票を拒否', () => {
    const state = voting()
    for (const [voterId, targetId] of [['player-1', 'player-1'], ['player-1', 'invalid'], ['player-2', 'player-1']]) expect(reducer(state, { type: 'castVote', voterId, targetId, ballot: 1 })).toBe(state)
    const action = { type: 'castVote', voterId: 'player-1', targetId: 'player-2', ballot: 1 } as const
    const changed = reducer(state, action)
    expect(reducer(changed, action)).toBe(changed)
    expect(reducer(state, { ...action, ballot: 2 })).toBe(state)
  })
  it('全員投票後に人狼を当てたら市民勝利、外せば人狼勝利', () => {
    const caught = ballot(voting(), [2, 1, 1, 1])
    expect(caught.round?.verdict).toEqual({ winner: 'citizen', reason: 'caught' })
    const escaped = ballot(voting(), [2, 3, 2, 2])
    expect(escaped.round?.verdict).toEqual({ winner: 'wolf', reason: 'escaped' })
    expect(escaped.session.playCount).toBe(1)
    expect(reducer(escaped, { type: 'castVote', voterId: 'player-4', targetId: 'player-2', ballot: 1 })).toBe(escaped)
  })
  it('同票は候補限定で再投票、再び同票なら人狼勝利', () => {
    const tied = ballot(voting(), [2, 1, 1, 2])
    expect(tied.screen).toBe('vote')
    expect(tied.round?.ballot).toBe(2)
    expect(tied.round?.votes).toEqual({})
    expect(tied.round?.voteCandidates.sort()).toEqual(['player-1', 'player-2'])
    expect(reducer(tied, { type: 'castVote', voterId: 'player-1', targetId: 'player-3', ballot: 2 })).toBe(tied)
    expect(ballot(tied, [2, 1, 1, 2]).round?.verdict).toEqual({ winner: 'wolf', reason: 'tie' })
    expect(ballot(tied, [2, 1, 1, 1]).round?.verdict?.winner).toBe('citizen')
  })
  it('無投票では結果へ進めず、再戦時は秘密・議論・投票・勝敗を初期化', () => {
    const state = voting()
    expect(reducer(state, { type: 'finishRound' })).toBe(state)
    const finished = ballot(state, [2, 1, 1, 1])
    const again = reducer(finished, { type: 'startRound', mode: 'werewolf', playerNames: ['A', 'B', 'C', 'D'], cardValues: [1, 2, 3, 4], roleRandomValue: 0.99 })
    expect(again.screen).toBe('reveal')
    expect(again.round).toMatchObject({ votes: {}, ballot: 1, verdict: null, discussionDeadline: null, openedCardIds: [], mistakeCardIds: [] })
    expect(again.round?.roles['player-4']).toBe('wolf')
    expect(again.round?.cards.map((c) => c.value)).toEqual([1, 2, 3, 4])
  })
})
