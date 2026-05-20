import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
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

/** 相談結果として、伏せカードを高いと思う順に並べる画面。 */
export function SortScreen({ cards, players, sortedCardIds, onChange, onNext }: SortScreenProps) {
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())

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

  function moveNear(sourceCardId: string, targetCardId: string, placeAfterTarget: boolean) {
    const from = sortedCardIds.indexOf(sourceCardId)
    if (from < 0 || !sortedCardIds.includes(targetCardId) || sourceCardId === targetCardId) {
      return
    }
    const next = [...sortedCardIds]
    next.splice(from, 1)
    const targetIndex = next.indexOf(targetCardId)
    next.splice(placeAfterTarget ? targetIndex + 1 : targetIndex, 0, sourceCardId)
    onChange(next)
  }

  function setRowRef(cardId: string) {
    return (node: HTMLDivElement | null) => {
      if (node) {
        rowRefs.current.set(cardId, node)
        return
      }
      rowRefs.current.delete(cardId)
    }
  }

  function startDrag(event: PointerEvent<HTMLDivElement>, cardId: string) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }
    if ((event.target as HTMLElement).closest('button')) {
      return
    }
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraggingCardId(cardId)
  }

  function dragMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingCardId) {
      return
    }
    event.preventDefault()
    const target = sortedCardIds
      .map((cardId) => ({ cardId, rect: rowRefs.current.get(cardId)?.getBoundingClientRect() }))
      .find(({ rect }) => {
        return rect ? event.clientY >= rect.top && event.clientY <= rect.bottom : false
      })
    if (target?.rect && target.cardId !== draggingCardId) {
      moveNear(draggingCardId, target.cardId, event.clientY > target.rect.top + target.rect.height / 2)
    }
  }

  return (
    <CardSurface>
      <ScreenHeader eyebrow="相談" title="高い順に並べる" description="カードを押したまま動かせます。細かい調整は上下ボタンでもできます。" />
      <div className="grid gap-3">
        {sortedCardIds.map((cardId, index) => {
          const card = cards.find((candidate) => candidate.id === cardId)!
          return (
            <div
              key={cardId}
              ref={setRowRef(cardId)}
              data-testid="sort-card-row"
              className={`grid touch-none select-none grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded-2xl border border-[#c79b57] bg-[#fffaf0] p-3 shadow-[0_6px_14px_rgba(61,38,15,0.1)] ${draggingCardId === cardId ? 'scale-[0.99] opacity-80' : ''}`}
              onPointerDown={(event) => startDrag(event, cardId)}
              onPointerMove={dragMove}
              onPointerUp={() => setDraggingCardId(null)}
              onPointerCancel={() => setDraggingCardId(null)}
            >
              <div className="grid h-10 w-8 place-items-center rounded-xl bg-[#f3dfba] text-lg font-black text-[#806344]" aria-hidden="true">
                ↕
              </div>
              <div>
                <p className="text-xs font-bold text-[#806344]">{index + 1}番目に高い</p>
                <p className="font-bold">{formatCardLabel(cards, players, card)}</p>
              </div>
              <button className="h-10 w-10 rounded-xl border border-[#ead19d] bg-[#fff1cf] font-black shadow-[0_3px_0_#d4af70]" onClick={() => move(cardId, -1)} aria-label="上へ">
                ↑
              </button>
              <button className="h-10 w-10 rounded-xl border border-[#ead19d] bg-[#fff1cf] font-black shadow-[0_3px_0_#d4af70]" onClick={() => move(cardId, 1)} aria-label="下へ">
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
