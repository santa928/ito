import { useState } from 'react'
import { formatCardLabel } from '../domain/cardLabels'
import type { Card, Player, Topic } from '../domain/types'
import { PrimaryButton } from './PrimaryButton'

type RoundControlsProps = {
  topic: Topic
  players: Player[]
  cards: Card[]
  onHome: () => void
  onRerollTopic: () => void
}

type ReviewMode = 'topic' | 'cards' | null

/** ラウンド中にお題や自分のカードを再確認するための共通操作列を描画する。 */
export function RoundControls({ topic, players, cards, onHome, onRerollTopic }: RoundControlsProps) {
  const [mode, setMode] = useState<ReviewMode>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id ?? '')
  const [isHolding, setIsHolding] = useState(false)
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId) ?? players[0]
  const selectedCards = selectedPlayer ? cards.filter((card) => card.ownerId === selectedPlayer.id) : []

  function closeDialog() {
    setIsHolding(false)
    setMode(null)
  }

  return (
    <>
      <nav className="mb-3 rounded-2xl border border-[#b8894c]/50 bg-[#fff7e6]/92 p-2 shadow-[0_10px_20px_rgba(61,38,15,0.14)]" aria-label="ラウンド中の操作">
        <div className="grid grid-cols-3 gap-2">
          <button className="rounded-xl border border-[#d9ba82] bg-[#fffaf0] px-2 py-2 text-sm font-black text-[#352113]" onClick={onHome}>
            ホーム
          </button>
          <button className="rounded-xl border border-[#d9ba82] bg-[#fffaf0] px-2 py-2 text-sm font-black text-[#352113]" onClick={() => setMode('topic')}>
            お題
          </button>
          <button className="rounded-xl border border-[#d9ba82] bg-[#fffaf0] px-2 py-2 text-sm font-black text-[#352113]" onClick={() => setMode('cards')}>
            カード確認
          </button>
        </div>
      </nav>

      {mode ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-[#2c1b10]/55 p-4" role="presentation">
          <section
            className="paper-board max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[1.35rem] border border-[#a87842]/55 p-5"
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'topic' ? 'お題確認' : 'カード再確認'}
          >
            {mode === 'topic' ? (
              <div>
                <p className="text-sm font-black text-[#806344]">お題確認</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-[#2f2418]">{topic.text}</h2>
                <p className="mt-3 text-sm font-bold leading-relaxed text-[#5a4631]">数字は言わず、このお題に対する例えで相談します。</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <PrimaryButton variant="secondary" onClick={onRerollTopic}>
                    再抽選
                  </PrimaryButton>
                  <PrimaryButton onClick={closeDialog}>閉じる</PrimaryButton>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-black text-[#806344]">カード再確認</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-[#2f2418]">本人だけが長押し</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {players.map((player) => (
                    <button
                      key={player.id}
                      className={`rounded-xl border px-3 py-2 text-sm font-black ${player.id === selectedPlayer?.id ? 'border-[#2b6655] bg-[#2b6655] text-white' : 'border-[#d9ba82] bg-[#fffaf0] text-[#352113]'}`}
                      onClick={() => {
                        setIsHolding(false)
                        setSelectedPlayerId(player.id)
                      }}
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid gap-3">
                  {selectedCards.map((card) => (
                    <div key={card.id} className="rounded-2xl border border-[#e0c18a] bg-[#fffaf0] px-4 py-4 text-center shadow-[inset_0_0_0_2px_rgba(255,255,255,0.6)]">
                      <p className="text-sm font-bold text-[#806344]">{formatCardLabel(cards, players, card)}</p>
                      <p className="mt-2 text-5xl font-black">{isHolding ? card.value : '?'}</p>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-5 min-h-14 w-full rounded-2xl border border-[#d0a65c]/60 bg-[linear-gradient(180deg,#32705f_0%,#235747_100%)] px-4 text-base font-black text-white shadow-[0_7px_0_#173a31]"
                  onPointerDown={() => setIsHolding(true)}
                  onPointerUp={() => setIsHolding(false)}
                  onPointerCancel={() => setIsHolding(false)}
                  onPointerLeave={() => setIsHolding(false)}
                >
                  長押しで見る
                </button>
                <PrimaryButton className="mt-4 w-full" variant="secondary" onClick={closeDialog}>
                  閉じる
                </PrimaryButton>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  )
}
