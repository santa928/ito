import { useState } from 'react'
import type { Card, Player, Topic } from '../domain/types'
import { formatPlayerLabel } from '../domain/cardLabels'
import { PrimaryButton } from './PrimaryButton'
import { Modal } from './Modal'
import { SecretCards } from './SecretCards'

import type { Role } from '../domain/werewolf'

type RoundControlsProps = {
  roles?: Record<string, Role>
  ascending?: boolean
  topic: Topic
  players: Player[]
  cards: Card[]
  rerollDisabledReason: string | null
  onHome: () => void
  onRerollTopic: () => void
}

type ReviewMode = 'topic' | 'cards' | 'exit' | null

/** ラウンドの終了確認と、秘密表示を持ち越さないお題・本人カードの再確認を提供する。 */
export function RoundControls({ topic, players, cards, roles, ascending, rerollDisabledReason, onHome, onRerollTopic }: RoundControlsProps) {
  const [mode, setMode] = useState<ReviewMode>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id ?? '')
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? players[0]

  /** Modalと秘密カードを同時にアンマウントし、呼出元へ戻る。 */
  function closeDialog() {
    setMode(null)
  }

  return (
    <>
      <nav className="mb-3 rounded-2xl border border-[#b8894c]/50 bg-[#fff7e6]/92 p-2 shadow-[0_10px_20px_rgba(61,38,15,0.14)]" aria-label="ラウンド中の操作">
        <div className="grid grid-cols-3 gap-2">
          <button className="min-h-11 rounded-xl border border-[#d9ba82] bg-[#fffaf0] px-2 py-2 text-sm font-black text-[#352113]" onClick={() => setMode('exit')}>ホーム</button>
          <button className="min-h-11 rounded-xl border border-[#d9ba82] bg-[#fffaf0] px-2 py-2 text-sm font-black text-[#352113]" onClick={() => setMode('topic')}>お題</button>
          <button className="min-h-11 rounded-xl border border-[#d9ba82] bg-[#fffaf0] px-2 py-2 text-sm font-black text-[#352113]" onClick={() => setMode('cards')}>カード確認</button>
        </div>
      </nav>

      {mode ? (
        <Modal label={mode === 'topic' ? 'お題確認' : mode === 'cards' ? 'カード再確認' : 'ゲームを終了しますか？'} onClose={closeDialog}>
          {mode === 'exit' ? (
            <>
              <h2 className="text-2xl font-black">ゲームを終了しますか？</h2>
              <p className="mt-3 leading-7">このラウンドを終了すると再開できません。名前とお題の設定は残ります。</p>
              <div className="mt-5 grid gap-3">
                <PrimaryButton autoFocus onClick={closeDialog}>続ける</PrimaryButton>
                <PrimaryButton variant="secondary" onClick={onHome}>終了してホームへ</PrimaryButton>
              </div>
            </>
          ) : mode === 'topic' ? (
            <>
              <p className="text-sm font-black text-[#806344]">お題確認</p>
              <h2 className="mt-2 text-2xl font-black leading-tight">{topic.text}</h2>
              <p className="mt-3 text-sm font-bold leading-relaxed text-[#5a4631]">数字は言わず、このお題に対する例えで相談します。並べるのは{ascending ? '小さい順（1→100）' : '高い順（100→1）'}です。</p>
              {rerollDisabledReason ? <p className="mt-3 text-sm text-[#5a4631]">{rerollDisabledReason}</p> : null}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <PrimaryButton variant="secondary" disabled={Boolean(rerollDisabledReason)} onClick={onRerollTopic}>再抽選</PrimaryButton>
                <PrimaryButton autoFocus onClick={closeDialog}>閉じる</PrimaryButton>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-black text-[#806344]">カード再確認</p>
              <h2 className="mt-2 text-2xl font-black leading-tight">本人だけが長押し</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {players.map((player) => (
                  <button
                    key={player.id}
                    className={`break-anywhere min-h-11 rounded-xl border px-3 py-2 text-sm font-black ${player.id === selectedPlayer?.id ? 'border-[#2b6655] bg-[#2b6655] text-white' : 'border-[#d9ba82] bg-[#fffaf0] text-[#352113]'}`}
                    aria-pressed={player.id === selectedPlayer?.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                  >
                    {formatPlayerLabel(players, player)}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                {selectedPlayer ? <SecretCards key={selectedPlayer.id} cards={cards} players={players} ownerId={selectedPlayer.id} role={roles?.[selectedPlayer.id]} /> : null}
              </div>
              <PrimaryButton autoFocus className="mt-4 w-full" variant="secondary" onClick={closeDialog}>閉じる</PrimaryButton>
            </>
          )}
        </Modal>
      ) : null}
    </>
  )
}
