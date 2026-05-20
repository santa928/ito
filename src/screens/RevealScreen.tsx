import { useState } from 'react'
import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { formatCardLabel } from '../domain/cardLabels'
import type { Card, Player } from '../domain/types'

type RevealScreenProps = {
  players: Player[]
  cards: Card[]
  onComplete: () => void
}

/** スマホを渡し、自分の数字だけを押している間だけ表示する画面。 */
export function RevealScreen({ players, cards, onComplete }: RevealScreenProps) {
  const [index, setIndex] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const currentPlayer = players[index]
  const playerCards = cards.filter((card) => card.ownerId === currentPlayer.id)
  const isLast = index === players.length - 1

  function next() {
    setIsHolding(false)
    if (isLast) {
      onComplete()
      return
    }
    setIndex(index + 1)
  }

  return (
    <CardSurface>
      <ScreenHeader
        eyebrow="カード確認"
        title={`次は ${currentPlayer.name} さんへ`}
        description="本人だけが画面を持ってください。"
      />
      <div className="rounded-2xl border border-dashed border-[#d8b77a] bg-[#fff4d9] p-6 text-center">
        <p className="text-sm font-bold text-[#806344]">押している間だけ表示</p>
        <div className="mt-5 grid gap-3">
          {playerCards.map((card) => (
            <div
              key={card.id}
              className="rounded-xl bg-white px-4 py-5 text-[#2f2418] shadow-inner"
            >
              <p className="text-sm font-bold text-[#806344]">{formatCardLabel(cards, players, card)}</p>
              <p className="mt-2 text-5xl font-black">{isHolding ? card.value : '?'}</p>
            </div>
          ))}
        </div>
      </div>
      <button
        className="mt-5 min-h-16 w-full rounded-2xl bg-[#2f5d50] px-4 text-lg font-black text-white"
        onPointerDown={() => setIsHolding(true)}
        onPointerUp={() => setIsHolding(false)}
        onPointerCancel={() => setIsHolding(false)}
        onPointerLeave={() => setIsHolding(false)}
      >
        長押しで見る
      </button>
      <PrimaryButton className="mt-4 w-full" onClick={next}>
        {isLast ? '相談へ進む' : '見終わった'}
      </PrimaryButton>
    </CardSurface>
  )
}
