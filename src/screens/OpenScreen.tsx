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
  lives: number
  onOpen: (cardId: string) => void
  onFinish: () => void
}

/** 並べた順にカードを1枚ずつ開き、ミスとライフを見せる画面。 */
export function OpenScreen({
  cards,
  players,
  sortedCardIds,
  openedCardIds,
  mistakeCardIds,
  lives,
  onOpen,
  onFinish,
}: OpenScreenProps) {
  const nextCardId = sortedCardIds.find((cardId) => !openedCardIds.includes(cardId))
  const isDone = !nextCardId

  return (
    <CardSurface>
      <ScreenHeader eyebrow={`ライフ ${lives}`} title="1枚ずつオープン" description="相談した順番でカードを開きます。" />
      <div className="grid gap-3">
        {sortedCardIds.map((cardId, index) => {
          const card = cards.find((candidate) => candidate.id === cardId)!
          const isOpened = openedCardIds.includes(cardId)
          const wasMistake = mistakeCardIds.includes(cardId)
          return (
            <div
              key={cardId}
              className={`rounded-xl border p-4 ${wasMistake ? 'border-[#b94a34] bg-[#fff0ea]' : 'border-[#d8c3a0] bg-white'}`}
            >
              <p className="text-xs font-bold text-[#806344]">
                {index + 1}番目 / {formatCardLabel(cards, players, card)}
              </p>
              <p className="mt-1 text-3xl font-black">{isOpened ? card.value : '?'}</p>
              {wasMistake ? <p className="mt-1 text-sm font-bold text-[#b94a34]">ミス</p> : null}
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
