import { useEffect, useMemo, useReducer, useState } from 'react'
import { Layout } from './components/Layout'
import { PrimaryButton } from './components/PrimaryButton'
import { RoundControls } from './components/RoundControls'
import { UpdatePrompt } from './components/UpdatePrompt'
import { RoundProgress } from './components/RoundProgress'
import { getEnabledTopics, pickTopic } from './domain/topics'
import { cardsPerPlayer, createCardValues, limitPlayerName } from './domain/game'
import { WerewolfScreen } from './screens/WerewolfScreen'
import type { GameMode } from './domain/werewolf'
import type { Topic } from './domain/types'
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
import { loadSettings, loadSettingsWithNotice, saveSettings } from './storage/settings'

/** 現在の設定から、このラウンドで使えるお題候補を作る。 */
function getPlayableTopics(settings: ReturnType<typeof loadSettings>): Topic[] {
  return getEnabledTopics({
    categoryVisibility: settings.categoryVisibility,
    hiddenTopicIds: new Set(settings.hiddenTopicIds),
    customTopics: settings.customTopics,
  })
}

/** アプリの画面状態をreducerに接続し、ゲーム全体の進行を描画する。 */
export function App() {
  const [loaded] = useState(loadSettingsWithNotice)
  const [state, dispatch] = useReducer(reducer, loaded.notice, (notice) => ({ ...createInitialState(), notice }))
  const [settings, setSettings] = useState(loaded.settings)
  const [needsExplicitSave, setNeedsExplicitSave] = useState(Boolean(loaded.notice))
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(Boolean(loaded.notice))
  const lastNames = useMemo(() => settings.lastPlayerNames, [settings.lastPlayerNames])
  const [gameMode, setGameMode] = useState<GameMode>('normal')
  const [setupNames, setSetupNames] = useState<string[] | null>(null)
  const [settingsReturnScreen, setSettingsReturnScreen] = useState<'home' | 'setup'>('home')
  const playableTopics = useMemo(() => getPlayableTopics(settings), [settings])
  const round = state.round
  // 画面を進めた後も前の画面のスクロール位置に取り残さず、見出しから読めるようにする。
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [state.screen])
  const rerollDisabledReason = round && round.openedCardIds.length > 0
    ? 'カードを開いた後は、お題を変更できません。'
    : playableTopics.length < 2 ? '再抽選するには、お題を2件以上ONにしてください。' : null

  /** 配布前に人数を検査し、保存に失敗しても今回のゲームは続ける。 */
  function startRound(names: string[], mode: GameMode = gameMode) {
    if (playableTopics.length === 0) {
      dispatch({ type: 'setNotice', message: 'お題が0件です。お題管理でカテゴリとお題を1件以上ONにしてください。' })
      return
    }
    let cardValues: number[]
    let normalizedNames: string[]
    try {
      if (!Array.isArray(names) || names.some((name) => typeof name !== 'string')) throw new Error('名前が不正です')
      normalizedNames = names.map((name) => limitPlayerName(name.trim()))
      if (mode === 'werewolf' && (names.length < 4 || names.length > 8)) throw new Error('人数が不正です')
      cardValues = createCardValues(names.length * cardsPerPlayer(names.length))
    } catch {
      dispatch({ type: 'setNotice', message: mode === 'werewolf' ? '人数を4〜8人にして、もう一度開始してください。' : '人数を2〜8人にして、もう一度開始してください。' })
      return
    }
    const nextSettings = { ...settings, lastPlayerNames: normalizedNames }
    // 修復対象の元データは、お題管理で明示保存するまで開始操作でも上書きしない。
    const saveResult = needsExplicitSave ? null : saveSettings(nextSettings)
    setHasUnsavedSettings(needsExplicitSave || !saveResult?.ok)
    setSettings(nextSettings)
    if (saveResult && !saveResult.ok) {
      dispatch({ type: 'setNotice', message: saveResult.message })
    }
    dispatch({
      type: 'startRound',
      mode,
      roleRandomValue: mode === 'werewolf' ? Math.random() : undefined,
      playerNames: normalizedNames,
      cardValues,
      topics: getPlayableTopics(nextSettings),
    })
  }

  /** 開封前で別の候補があるときだけ、現在のお題を除いて抽選する。 */
  function rerollTopic() {
    if (!round || rerollDisabledReason) {
      return
    }
    const topics = getPlayableTopics(settings)
    const candidates = topics.length > 1 ? topics.filter((topic) => topic.id !== round.topic.id) : topics
    try {
      dispatch({ type: 'setTopic', topic: pickTopic(candidates) })
    } catch {
      dispatch({ type: 'setNotice', message: 'お題を再抽選できませんでした。' })
    }
  }

  const showRoundControls = round && ['reveal', 'topic', 'sort', 'open'].includes(state.screen)

  return (
    <Layout>
      {state.screen === 'home' ? <UpdatePrompt hasUnsavedSettings={hasUnsavedSettings} /> : null}
      {state.notice ? (
        <div role="status" className="mb-3 rounded-xl border border-[#d8b77a] bg-[#fff4d9] p-3 text-sm font-bold text-[#5a4631]">
          <div className="flex items-center justify-between gap-3">
            <span>{state.notice}</span>
            <PrimaryButton size="compact" className="shrink-0" variant="secondary" onClick={() => dispatch({ type: 'clearNotice' })}>
              閉じる
            </PrimaryButton>
          </div>
        </div>
      ) : null}
      {round && ['reveal', 'topic', 'sort', 'open', 'discussion', 'vote'].includes(state.screen) ? <RoundProgress phase={state.screen} mode={round.mode} /> : null}
      {showRoundControls ? (
        <RoundControls
          key={state.screen}
          roles={round.roles}
          topic={round.topic}
          players={round.players}
          cards={round.cards}
          rerollDisabledReason={rerollDisabledReason}
          onHome={() => dispatch({ type: 'endRound' })}
          onRerollTopic={rerollTopic}
        />
      ) : null}
      {state.screen === 'home' ? (
        <HomeScreen
          onPlay={() => { setSetupNames(null); dispatch({ type: 'go', screen: 'setup' }) }}
          onTopics={() => { setSettingsReturnScreen('home'); dispatch({ type: 'go', screen: 'topics' }) }}
          onHowToPlay={() => dispatch({ type: 'go', screen: 'howToPlay' })}
        />
      ) : null}
      {state.screen === 'setup' ? (
        <SetupScreen
          mode={gameMode}
          onModeChange={setGameMode}
          initialNames={setupNames ?? lastNames}
          playableTopicCount={playableTopics.length}
          onBack={() => dispatch({ type: 'go', screen: 'home' })}
          onStart={(names) => startRound(names)}
          onTopics={(names) => {
            setSetupNames(names)
            setSettingsReturnScreen('setup')
            dispatch({ type: 'go', screen: 'topics' })
          }}
        />
      ) : null}
      {state.screen === 'reveal' && round ? (
        <RevealScreen roles={round.roles} players={round.players} cards={round.cards} onComplete={() => dispatch({ type: 'go', screen: 'topic' })} />
      ) : null}
      {state.screen === 'topic' && round ? (
        <TopicScreen werewolf={round.mode === 'werewolf'} topic={round.topic} rerollDisabledReason={rerollDisabledReason} onReroll={rerollTopic} onNext={() => dispatch({ type: 'go', screen: 'sort' })} />
      ) : null}
      {state.screen === 'sort' && round ? (
        <SortScreen
          werewolf={round.mode === 'werewolf'}
          cards={round.cards}
          players={round.players}
          sortedCardIds={round.sortedCardIds}
          onChange={(cardIds) => dispatch({ type: 'setSortedCardIds', cardIds })}
          onNext={() => dispatch(round.mode === 'werewolf' ? { type: 'lockOrder' } : { type: 'go', screen: 'open' })}
        />
      ) : null}
      {state.screen === 'open' && round ? (
        <OpenScreen
          cards={round.cards}
          players={round.players}
          sortedCardIds={round.sortedCardIds}
          openedCardIds={round.openedCardIds}
          mistakeCardIds={round.mistakeCardIds}
          onOpen={(cardId) => dispatch({ type: 'openCard', cardId })}
          onFinish={() => dispatch({ type: 'finishRound' })}
        />
      ) : null}
      {state.screen === 'result' && round?.mode === 'normal' ? (
        <ResultScreen
          cards={round.cards}
          players={round.players}
          openedCardIds={round.openedCardIds}
          mistakeCardIds={round.mistakeCardIds}
          playCount={state.session.playCount}
          onAgain={() => startRound(round.players.map((player) => player.name), round.mode)}
          onHome={() => dispatch({ type: 'endRound' })}
        />
      ) : null}
      {round?.mode === 'werewolf' && (state.screen === 'discussion' || state.screen === 'vote' || state.screen === 'result') ? (
        <WerewolfScreen phase={state.screen} round={round} dispatch={dispatch} onAgain={() => startRound(round.players.map((player) => player.name), round.mode)} />
      ) : null}
      {state.screen === 'howToPlay' ? <HowToPlayScreen onBack={() => dispatch({ type: 'go', screen: 'home' })} /> : null}
      {state.screen === 'topics' ? (
        <TopicsScreen
          settings={settings}
          onSave={(nextSettings) => {
            const saveResult = saveSettings(nextSettings)
            if (saveResult.ok) setNeedsExplicitSave(false)
            setHasUnsavedSettings(!saveResult.ok)
            setSettings(nextSettings)
            if (!saveResult.ok) {
              dispatch({ type: 'setNotice', message: saveResult.message })
            }
            dispatch({ type: 'go', screen: settingsReturnScreen })
          }}
          onBack={() => dispatch({ type: 'go', screen: settingsReturnScreen })}
        />
      ) : null}
    </Layout>
  )
}
