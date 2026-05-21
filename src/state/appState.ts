import type { Card, Player, Topic } from '../domain/types'
import { dealCards, judgeNextCard, normalizePlayers, sortCardIdsByValue } from '../domain/game'
import { builtInTopics, pickTopic } from '../domain/topics'

export type Screen = 'home' | 'setup' | 'reveal' | 'topic' | 'sort' | 'open' | 'result' | 'topics' | 'howToPlay'

export type RoundState = {
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
  | { type: 'startRound'; playerNames: string[]; cardValues: number[]; topicRandomValue?: number; topics?: Topic[] }
  | { type: 'setSortedCardIds'; cardIds: string[] }
  | { type: 'setTopic'; topic: Topic }
  | { type: 'openCard'; cardId: string }
  | { type: 'finishRound' }
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
    case 'go':
      return { ...state, screen: action.screen }
    case 'startRound': {
      try {
        const players = normalizePlayers(action.playerNames)
        const cards = dealCards(players, action.cardValues)
        return {
          ...state,
          screen: 'reveal',
          round: {
            players,
            cards,
            sortedCardIds: cards.map((card) => card.id),
            openedCardIds: [],
            mistakeCardIds: [],
            topic: pickTopic(action.topics ?? builtInTopics, action.topicRandomValue),
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
      if (!state.round) {
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
      if (!state.round) {
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
    case 'openCard': {
      if (!state.round || state.round.openedCardIds.includes(action.cardId)) {
        return state
      }
      try {
        const result = judgeNextCard(
          state.round.cards,
          state.round.openedCardIds,
          action.cardId,
          sortCardIdsByValue(state.round.cards, 'descending'),
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
      if (!state.round) {
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
