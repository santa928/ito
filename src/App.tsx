import { useMemo, useReducer, useState } from 'react'
import { Layout } from './components/Layout'
import { PrimaryButton } from './components/PrimaryButton'
import { getEnabledTopics } from './domain/topics'
import { HomeScreen } from './screens/HomeScreen'
import { HowToPlayScreen } from './screens/HowToPlayScreen'
import { OpenScreen } from './screens/OpenScreen'
import { ResultScreen } from './screens/ResultScreen'
import { RevealScreen } from './screens/RevealScreen'
import { SetupScreen } from './screens/SetupScreen'
import { SortScreen } from './screens/SortScreen'
import { TopicScreen } from './screens/TopicScreen'
import { TopicsScreen } from './screens/TopicsScreen'
import { createInitialState, reducer } from './state/appState'
import { defaultSettings, loadSettings, saveSettings } from './storage/settings'

function createCardValues(count: number): number[] {
  const values = new Set<number>()
  while (values.size < count) {
    values.add(Math.floor(Math.random() * 100) + 1)
  }
  return [...values]
}

/** アプリの画面状態をreducerに接続し、ゲーム全体の進行を描画する。 */
export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)
  const [settings, setSettings] = useState(() => {
    try {
      return loadSettings()
    } catch {
      return defaultSettings
    }
  })
  const lastNames = useMemo(() => settings.lastPlayerNames, [settings.lastPlayerNames])
  const round = state.round

  function startRound(names: string[]) {
    const cardCount = names.length * (names.length <= 3 ? 2 : 1)
    const nextSettings = { ...settings, lastPlayerNames: names }
    const saveResult = saveSettings(nextSettings)
    setSettings(nextSettings)
    if (!saveResult.ok) {
      dispatch({ type: 'setNotice', message: saveResult.message })
    }
    dispatch({
      type: 'startRound',
      playerNames: names,
      cardValues: createCardValues(cardCount),
      topics: getEnabledTopics({
        categoryVisibility: nextSettings.categoryVisibility,
        hiddenTopicIds: new Set(nextSettings.hiddenTopicIds),
        customTopics: nextSettings.customTopics,
      }),
    })
  }

  return (
    <Layout>
      {state.notice ? (
        <div className="mb-3 rounded-xl border border-[#d8b77a] bg-[#fff4d9] p-3 text-sm font-bold text-[#5a4631]">
          <div className="flex items-center justify-between gap-3">
            <span>{state.notice}</span>
            <PrimaryButton className="min-h-9 px-3 py-1 text-sm" variant="secondary" onClick={() => dispatch({ type: 'clearNotice' })}>
              閉じる
            </PrimaryButton>
          </div>
        </div>
      ) : null}
      {state.screen === 'home' ? (
        <HomeScreen
          onPlay={() => dispatch({ type: 'go', screen: 'setup' })}
          onTopics={() => dispatch({ type: 'go', screen: 'topics' })}
          onHowToPlay={() => dispatch({ type: 'go', screen: 'howToPlay' })}
        />
      ) : null}
      {state.screen === 'setup' ? (
        <SetupScreen initialNames={lastNames} onBack={() => dispatch({ type: 'go', screen: 'home' })} onStart={startRound} />
      ) : null}
      {state.screen === 'reveal' && round ? (
        <RevealScreen players={round.players} cards={round.cards} onComplete={() => dispatch({ type: 'go', screen: 'topic' })} />
      ) : null}
      {state.screen === 'topic' && round ? (
        <TopicScreen topic={round.topic} onNext={() => dispatch({ type: 'go', screen: 'sort' })} />
      ) : null}
      {state.screen === 'sort' && round ? (
        <SortScreen
          cards={round.cards}
          players={round.players}
          sortedCardIds={round.sortedCardIds}
          onChange={(cardIds) => dispatch({ type: 'setSortedCardIds', cardIds })}
          onNext={() => dispatch({ type: 'go', screen: 'open' })}
        />
      ) : null}
      {state.screen === 'open' && round ? (
        <OpenScreen
          cards={round.cards}
          players={round.players}
          sortedCardIds={round.sortedCardIds}
          openedCardIds={round.openedCardIds}
          mistakeCardIds={round.mistakeCardIds}
          lives={round.lives}
          onOpen={(cardId) => dispatch({ type: 'openCard', cardId })}
          onFinish={() => dispatch({ type: 'finishRound' })}
        />
      ) : null}
      {state.screen === 'result' && round ? (
        <ResultScreen
          cards={round.cards}
          players={round.players}
          openedCardIds={round.openedCardIds}
          mistakeCardIds={round.mistakeCardIds}
          lives={round.lives}
          successCount={state.session.successCount}
          playCount={state.session.playCount}
          onAgain={() => startRound(round.players.map((player) => player.name))}
          onHome={() => dispatch({ type: 'go', screen: 'home' })}
        />
      ) : null}
      {state.screen === 'howToPlay' ? <HowToPlayScreen onBack={() => dispatch({ type: 'go', screen: 'home' })} /> : null}
      {state.screen === 'topics' ? (
        <TopicsScreen
          settings={settings}
          onSave={(nextSettings) => {
            const saveResult = saveSettings(nextSettings)
            setSettings(nextSettings)
            if (!saveResult.ok) {
              dispatch({ type: 'setNotice', message: saveResult.message })
              return
            }
            dispatch({ type: 'go', screen: 'home' })
          }}
          onBack={() => dispatch({ type: 'go', screen: 'home' })}
        />
      ) : null}
    </Layout>
  )
}
