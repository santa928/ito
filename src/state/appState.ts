import type { Card, Player, Topic } from '../domain/types'
import { dealCards, judgeNextCard, normalizePlayers } from '../domain/game'
import { assignRoles, voteLeaders } from '../domain/werewolf'
import type { GameMode, Role, Verdict } from '../domain/werewolf'
import { sortCardIdsByValue } from '../domain/game'
import { builtInTopics, pickTopic } from '../domain/topics'

export type Screen = 'home' | 'setup' | 'reveal' | 'topic' | 'sort' | 'open' | 'result' | 'topics' | 'howToPlay' | 'discussion' | 'vote'

export type RoundState = {
  mode: GameMode
  roles: Record<string, Role>
  discussionDeadline: number | null
  votes: Record<string, string>
  voteCandidates: string[]
  ballot: 1 | 2
  verdict: Verdict | null
  players: Player[]
  cards: Card[]
  sortedCardIds: string[]
  openedCardIds: string[]
  mistakeCardIds: string[]
  topic: Topic
}

export type AppState = {
  screen: Screen
  round: RoundState | null
  session: {
    playCount: number
  }
  notice: string | null
}

export type AppAction =
  | { type: 'go'; screen: Screen }
  | { type: 'endRound' }
  | { type: 'startRound'; mode?: GameMode; roleRandomValue?: number; playerNames: string[]; cardValues: number[]; topicRandomValue?: number; topics?: Topic[] }
  | { type: 'setSortedCardIds'; cardIds: string[] }
  | { type: 'setTopic'; topic: Topic }
  | { type: 'openCard'; cardId: string }
  | { type: 'finishRound' }
  | { type: 'lockOrder' }
  | { type: 'startDiscussion'; now: number }
  | { type: 'startVote'; now: number }
  | { type: 'castVote'; voterId: string; targetId: string; ballot: 1 | 2 }
  | { type: 'setNotice'; message: string }
  | { type: 'clearNotice' }

/** 現在のラウンドに含まれるカード ID と同一集合の並び替えかを判定する。 */
function hasSameCardIdSet(cards: Card[], cardIds: string[]): boolean {
  if (cards.length !== cardIds.length) {
    return false
  }

  const expectedIds = new Set(cards.map((card) => card.id))
  const actualIds = new Set(cardIds)
  if (expectedIds.size !== actualIds.size) {
    return false
  }

  return cardIds.every((cardId) => expectedIds.has(cardId))
}

/** アプリ全体の初期状態を作る。 */
export function createInitialState(): AppState {
  return {
    screen: 'home',
    round: null,
    session: {
      playCount: 0,
    },
    notice: null,
  }
}

/** 画面遷移、ラウンド進行、セッション成績を更新する。 */
export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'go': {
      const destinations: Record<Screen, Screen[]> = {
        home: ['setup', 'topics', 'howToPlay'],
        setup: ['home', 'topics'],
        topics: ['home', 'setup'],
        howToPlay: ['home'],
        reveal: ['topic'],
        topic: ['sort'],
        sort: ['open'],
        open: [],
        result: [],
        discussion: [],
        vote: [],
      }
      if (state.round?.mode === 'werewolf' && action.screen === 'open') return state
      return destinations[state.screen].includes(action.screen) ? { ...state, screen: action.screen } : state
    }
    case 'endRound':
      return { ...state, screen: 'home', round: null }
    case 'startRound': {
      if (state.round && state.screen !== 'result') return state
      const topics = action.topics ?? builtInTopics
      if (topics.length === 0) {
        return { ...state, notice: 'お題が0件です。お題管理でカテゴリとお題を1件以上ONにしてください。' }
      }
      try {
        const players = normalizePlayers(action.playerNames)
        const mode = action.mode ?? 'normal'
        const roles = mode === 'werewolf' ? assignRoles(players, action.roleRandomValue ?? Math.random()) : {}
        const cards = dealCards(players, action.cardValues)
        return {
          ...state,
          screen: 'reveal',
          round: {
            mode,
            roles,
            discussionDeadline: null,
            votes: {},
            voteCandidates: players.map((player) => player.id),
            ballot: 1,
            verdict: null,
            players,
            cards,
            sortedCardIds: cards.map((card) => card.id),
            openedCardIds: [],
            mistakeCardIds: [],
            topic: pickTopic(topics, action.topicRandomValue),
          },
        }
      } catch {
        return {
          ...state,
          notice: 'ラウンドを開始できませんでした。',
        }
      }
    }
    case 'setSortedCardIds': {
      if (!state.round || state.screen !== 'sort') {
        return state
      }
      if (!hasSameCardIdSet(state.round.cards, action.cardIds)) {
        return {
          ...state,
          notice: 'カードの並び順が不正です。',
        }
      }
      return {
        ...state,
        round: {
          ...state.round,
          sortedCardIds: action.cardIds,
        },
      }
    }
    case 'setTopic': {
      if (!state.round || state.round.openedCardIds.length > 0 || !['reveal', 'topic', 'sort', 'open'].includes(state.screen)) {
        return state
      }
      return {
        ...state,
        round: {
          ...state.round,
          topic: action.topic,
        },
      }
    }
    case 'lockOrder': {
      if (!state.round || state.round.mode !== 'werewolf' || state.screen !== 'sort') return state
      const expected = sortCardIdsByValue(state.round.cards, 'descending')
      const mistakes = state.round.sortedCardIds.filter((id, index) => id !== expected[index])
      const correct = mistakes.length === 0
      return { ...state, screen: correct ? 'result' : 'discussion',
        session: { playCount: state.session.playCount + (correct ? 1 : 0) },
        round: { ...state.round, openedCardIds: [...state.round.sortedCardIds], mistakeCardIds: mistakes,
          verdict: correct ? { winner: 'citizen', reason: 'order' } : null } }
    }
    case 'startDiscussion': {
      if (!state.round || state.screen !== 'discussion' || state.round.discussionDeadline !== null || !Number.isFinite(action.now) || action.now < 0) return state
      return { ...state, round: { ...state.round, discussionDeadline: action.now + 60_000 } }
    }
    case 'startVote': {
      if (!state.round || state.screen !== 'discussion' || state.round.discussionDeadline === null || !Number.isFinite(action.now) || action.now < state.round.discussionDeadline) return state
      return { ...state, screen: 'vote' }
    }
    case 'castVote': {
      const round = state.round
      if (!round || state.screen !== 'vote' || action.ballot !== round.ballot || round.votes[action.voterId]
        || round.players[Object.keys(round.votes).length]?.id !== action.voterId
        || action.voterId === action.targetId || !round.voteCandidates.includes(action.targetId)) return state
      const votes = { ...round.votes, [action.voterId]: action.targetId }
      if (Object.keys(votes).length < round.players.length) return { ...state, round: { ...round, votes } }
      const leaders = voteLeaders(votes)
      if (leaders.length > 1 && round.ballot === 1) {
        return { ...state, round: { ...round, votes: {}, voteCandidates: leaders, ballot: 2 } }
      }
      const caught = leaders.length === 1 && round.roles[leaders[0]] === 'wolf'
      return { ...state, screen: 'result', session: { playCount: state.session.playCount + 1 },
        round: { ...round, votes, verdict: { winner: caught ? 'citizen' : 'wolf', reason: leaders.length > 1 ? 'tie' : caught ? 'caught' : 'escaped' } } }
    }
    case 'openCard': {
      if (!state.round || state.screen !== 'open' || state.round.openedCardIds.includes(action.cardId)) {
        return state
      }
      if (state.round.sortedCardIds[state.round.openedCardIds.length] !== action.cardId) {
        return { ...state, notice: 'カードをオープンできませんでした。次のカードから開いてください。' }
      }
      try {
        const result = judgeNextCard(
          state.round.cards,
          state.round.openedCardIds,
          action.cardId,
        )
        return {
          ...state,
          screen: 'open',
          round: {
            ...state.round,
            openedCardIds: [...state.round.openedCardIds, action.cardId],
            mistakeCardIds: [...state.round.mistakeCardIds, ...result.mistakeCardIds],
          },
        }
      } catch {
        return {
          ...state,
          notice: 'カードをオープンできませんでした。',
        }
      }
    }
    case 'finishRound': {
      if (!state.round || state.screen !== 'open') {
        return state
      }
      if (state.round.openedCardIds.length !== state.round.cards.length) {
        return {
          ...state,
          notice: 'すべてのカードを開いてください。',
        }
      }
      return {
        ...state,
        screen: 'result',
        session: {
          playCount: state.session.playCount + 1,
        },
      }
    }
    case 'clearNotice':
      return { ...state, notice: null }
    case 'setNotice':
      return { ...state, notice: action.message }
    default:
      return state
  }
}
