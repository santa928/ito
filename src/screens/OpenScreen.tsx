import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { formatCardLabel } from '../domain/cardLabels'
import type { Card, Player } from '../domain/types'

type OpenScreenProps = {
  cards: Card[]
  players: Player[]
  sortedCardIds: string[]
  openedCardIds: string[]
  mistakeCardIds: string[]
  onOpen: (cardId: string) => void
  onFinish: () => void
}

/** 並べた順にカードを1枚ずつ開き、順番違いのミスを見せる画面。 */
export function OpenScreen({
  cards,
  players,
  sortedCardIds,
  openedCardIds,
  mistakeCardIds,
  onOpen,
  onFinish,
}: OpenScreenProps) {
  const nextCardId = sortedCardIds.find((cardId) => !openedCardIds.includes(cardId))
  const isDone = !nextCardId

  return (
    <CardSurface>
      <ScreenHeader eyebrow="オープン" title="1枚ずつオープン" description="高い順だと思う並びでカードを開きます。" />
      <div className="grid gap-3">
        {sortedCardIds.map((cardId, index) => {
          const card = cards.find((candidate) => candidate.id === cardId)!
          const isOpened = openedCardIds.includes(cardId)
          const wasMistake = mistakeCardIds.includes(cardId)
          return (
            <div
              key={cardId}
              className={`rounded-2xl border p-4 shadow-[0_6px_14px_rgba(61,38,15,0.1)] ${wasMistake ? 'border-[#b94a34] bg-[#fff0ea]' : 'border-[#c79b57] bg-[#fffaf0]'}`}
            >
              <p className="text-xs font-bold text-[#806344]">
                {index + 1}番目に高い / {formatCardLabel(cards, players, card)}
              </p>
              <p className="mt-1 text-3xl font-black">{isOpened ? card.value : '?'}</p>
              {wasMistake ? <p className="mt-1 text-sm font-bold text-[#b94a34]">順番違い</p> : null}
            </div>
          )
        })}
      </div>
      {isDone ? (
        <PrimaryButton className="mt-5" onClick={onFinish}>
          ふりかえりへ
        </PrimaryButton>
      ) : (
        <PrimaryButton className="mt-5" onClick={() => onOpen(nextCardId)}>
          次をオープン
        </PrimaryButton>
      )}
    </CardSurface>
  )
}
