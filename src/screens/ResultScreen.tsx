import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { formatCardLabel } from '../domain/cardLabels'
import type { Card, Player } from '../domain/types'

type ResultScreenProps = {
  cards: Card[]
  players: Player[]
  openedCardIds: string[]
  mistakeCardIds: string[]
  playCount: number
  onAgain: () => void
  onHome: () => void
}

/** 開いた順、実際の数字、ミス箇所、セッション成績を振り返る画面。 */
export function ResultScreen({
  cards,
  players,
  openedCardIds,
  mistakeCardIds,
  playCount,
  onAgain,
  onHome,
}: ResultScreenProps) {
  return (
    <CardSurface>
      <ScreenHeader eyebrow="ふりかえり" title="数字とミスを確認" description={`高い順の正解位置と違うカードがミスです。今回までのプレイ回数: ${playCount}`} />
      <div className="grid gap-3">
        {openedCardIds.map((cardId, index) => {
          const card = cards.find((candidate) => candidate.id === cardId)!
          const wasMistake = mistakeCardIds.includes(cardId)
          return (
            <div key={cardId} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-[#c79b57] bg-[#fffaf0] p-3 shadow-[0_6px_14px_rgba(61,38,15,0.1)]">
              <span className="font-black">{index + 1}</span>
              <span>{formatCardLabel(cards, players, card)}</span>
              <span className={wasMistake ? 'font-black text-[#b94a34]' : 'font-black'}>{card.value}{wasMistake ? ' ミス' : ''}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <PrimaryButton variant="secondary" onClick={onHome}>
          ホーム
        </PrimaryButton>
        <PrimaryButton onClick={onAgain}>もう一度</PrimaryButton>
      </div>
    </CardSurface>
  )
}
