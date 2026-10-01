import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { limitPlayerName, MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS } from '../domain/game'

import type { GameMode } from '../domain/werewolf'

type SetupScreenProps = {
  mode?: GameMode
  onModeChange?: (mode: GameMode) => void
  initialNames: string[]
  playableTopicCount: number
  onBack: () => void
  onStart: (names: string[]) => void
  onTopics: (names: string[]) => void
}

/** 参加人数と任意のプレイヤー名を入力する準備画面。 */
export function SetupScreen({ initialNames, mode = 'normal', onModeChange, playableTopicCount, onBack, onStart, onTopics }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, initialNames.length || 3)))
  const [names, setNames] = useState<string[]>(initialNames.length > 0 ? initialNames : ['', '', ''])
  const nameInputs = useRef<(HTMLInputElement | null)[]>([])

  const count = mode === 'werewolf' ? Math.min(8, Math.max(4, playerCount)) : playerCount
  const visibleNames = Array.from({ length: count }, (_, index) => names[index] ?? '')

  /** 入力途中の空白は保ち、前後の空白を除く名前に共通上限を適用する。 */
  function updateName(index: number, value: string) {
    const nextNames = [...names]
    nextNames[index] = Array.from(value.trim()).length > MAX_NAME_LENGTH ? limitPlayerName(value.trim()) : value
    setNames(nextNames)
  }

  /** IMEの確定では移動せず、次へ/完了キーで入力先を進める。ゲームは開始しない。 */
  function advanceName(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    if (index < count - 1) nameInputs.current[index + 1]?.focus()
    else event.currentTarget.blur()
  }

  return (
    <CardSurface>
      <ScreenHeader eyebrow="準備" title="遊ぶ人を決める" description={mode === 'werewolf' ? '4〜8人・1人1枚。人狼1人、市民はほか全員。高い順（100→1）に並べ、失敗したら議論と秘密投票。名前は24文字まで。' : '名前は24文字まで。空でも始められます。2〜3人は1人2枚、4〜8人は1人1枚です。'} />
      <label className="mb-5 grid gap-2 text-sm font-bold">モード
        <select aria-label="モード" className="min-h-12 rounded-xl border border-[#c79b57] bg-[#fff8e9] px-3 text-base" value={mode} onChange={(event) => onModeChange?.(event.target.value as GameMode)}>
          <option value="normal">通常（100→1）</option><option value="werewolf">人狼（100→1・4〜8人）</option>
        </select>
      </label>
      <div className="mb-5 grid gap-3 rounded-xl border border-[#d8c3a0] bg-[#fffaf0] p-3">
        <p className="text-sm font-bold">抽選対象{playableTopicCount}件</p>
        {playableTopicCount === 0 ? <p role="status" className="text-sm leading-6">カテゴリとお題を1件以上ONにしてください。</p> : null}
        <PrimaryButton size="compact" variant="secondary" onClick={() => onTopics(visibleNames)}>お題を選ぶ</PrimaryButton>
      </div>
      <label className="grid gap-2 text-sm font-bold text-[#5a4631]">
        人数
        <select
          aria-label="人数"
          className="min-h-12 rounded-xl border border-[#c79b57] bg-[#fff8e9] px-3 text-base font-bold shadow-inner"
          value={count}
          onChange={(event) => setPlayerCount(Number(event.target.value))}
        >
          {(mode === 'werewolf' ? [4, 5, 6, 7, 8] : [2, 3, 4, 5, 6, 7, 8]).map((count) => (
            <option key={count} value={count}>
              {count}人
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4 grid gap-3">
        {visibleNames.map((name, index) => (
          <label key={index} className="grid gap-2 text-sm font-bold text-[#5a4631]">
            プレイヤー{index + 1}
            <input
              ref={(node) => { nameInputs.current[index] = node }}
              aria-label={`プレイヤー${index + 1}`}
              className="min-h-12 rounded-xl border border-[#c79b57] bg-[#fff8e9] px-3 text-base font-bold shadow-inner"
              value={name}
              autoComplete="off"
              enterKeyHint={index === count - 1 ? 'done' : 'next'}
              onChange={(event) => updateName(index, event.target.value)}
              onKeyDown={(event) => advanceName(event, index)}
              placeholder={`プレイヤー${index + 1}`}
            />
          </label>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <PrimaryButton variant="secondary" onClick={onBack}>
          戻る
        </PrimaryButton>
        <PrimaryButton disabled={playableTopicCount === 0} onClick={() => onStart(visibleNames)}>開始</PrimaryButton>
      </div>
    </CardSurface>
  )
}
