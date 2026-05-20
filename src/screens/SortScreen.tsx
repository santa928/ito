import { useState } from 'react'
import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { formatCardLabel } from '../domain/cardLabels'
import type { Card, Player } from '../domain/types'

type SortScreenProps = {
  cards: Card[]
  players: Player[]
  sortedCardIds: string[]
  onChange: (cardIds: string[]) => void
  onNext: () => void
}

/** 相談結果として、伏せカードを小さいと思う順に並べる画面。 */
export function SortScreen({ cards, players, sortedCardIds, onChange, onNext }: SortScreenProps) {
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)

  function move(cardId: string, direction: -1 | 1) {
    const index = sortedCardIds.indexOf(cardId)
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= sortedCardIds.length) {
      return
    }
    const next = [...sortedCardIds]
    next[index] = sortedCardIds[nextIndex]
    next[nextIndex] = cardId
    onChange(next)
  }

  function dropOn(targetCardId: string) {
    if (!draggingCardId || draggingCardId === targetCardId) {
      setDraggingCardId(null)
      return
    }
    const from = sortedCardIds.indexOf(draggingCardId)
    const to = sortedCardIds.indexOf(targetCardId)
    if (from < 0 || to < 0) {
      setDraggingCardId(null)
      return
    }
    const next = [...sortedCardIds]
    next.splice(from, 1)
    next.splice(to, 0, draggingCardId)
    onChange(next)
    setDraggingCardId(null)
  }

  return (
    <CardSurface>
      <ScreenHeader eyebrow="相談" title="低いと思う順に並べる" description="ドラッグが難しい時は上下ボタンで動かせます。" />
      <div className="grid gap-3">
        {sortedCardIds.map((cardId, index) => {
          const card = cards.find((candidate) => candidate.id === cardId)!
          return (
            <div
              key={cardId}
              draggable
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl border border-[#d8c3a0] bg-white p-3"
              onDragStart={() => setDraggingCardId(cardId)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOn(cardId)}
            >
              <div>
                <p className="text-xs font-bold text-[#806344]">{index + 1}番目</p>
                <p className="font-bold">{formatCardLabel(cards, players, card)}</p>
              </div>
              <button className="h-10 w-10 rounded-lg bg-[#fff4d9] font-black" onClick={() => move(cardId, -1)} aria-label="上へ">
                ↑
              </button>
              <button className="h-10 w-10 rounded-lg bg-[#fff4d9] font-black" onClick={() => move(cardId, 1)} aria-label="下へ">
                ↓
              </button>
            </div>
          )
        })}
      </div>
      <PrimaryButton className="mt-5" onClick={onNext}>
        この順でオープン
      </PrimaryButton>
    </CardSurface>
  )
}
