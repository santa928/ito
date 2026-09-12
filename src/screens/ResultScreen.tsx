import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { formatCardLabel } from '../domain/cardLabels'
import { sortCardIdsByValue } from '../domain/game'
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
      <ScreenHeader eyebrow="ふりかえり" title={mistakeCardIds.length === 0 ? '全員の順番がそろった！' : '数字とミスを確認'} description={`高い順（100→1）の正解位置と違うカードがミスです。${cards.length - mistakeCardIds.length} / ${cards.length}枚が正しい位置。今回までのプレイ回数: ${playCount}`} />
      <h2 className="mb-3 font-black">みんなで並べた順</h2>
      <div className="grid gap-3">
        {openedCardIds.map((cardId, index) => {
          const card = cards.find((candidate) => candidate.id === cardId)!
          const wasMistake = mistakeCardIds.includes(cardId)
          return (
            <div key={cardId} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[#c79b57] bg-[#fffaf0] p-3 shadow-[0_6px_14px_rgba(61,38,15,0.1)]">
              <span className="font-black">{index + 1}</span>
              <span className="break-anywhere">{formatCardLabel(cards, players, card)}</span>
              <span className={wasMistake ? 'font-black text-[#b94a34]' : 'font-black'}>{card.value}{wasMistake ? ' ミス' : ''}</span>
            </div>
          )
        })}
      </div>
      <details className="mt-5 rounded-xl border border-[#c79b57] bg-[#fffaf0] p-3">
        <summary className="min-h-11 cursor-pointer py-2 font-black">正解の順を見る</summary>
        <ol className="mt-3 grid gap-3">
          {sortCardIdsByValue(cards, 'descending').map((cardId, index) => {
            const card = cards.find((candidate) => candidate.id === cardId)!
            return <li key={cardId} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2"><span>{index + 1}</span><span className="break-anywhere">{formatCardLabel(cards, players, card)}</span><strong>{card.value}</strong></li>
          })}
        </ol>
      </details>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <PrimaryButton variant="secondary" onClick={onHome}>
          ホーム
        </PrimaryButton>
        <PrimaryButton onClick={onAgain}>もう一度</PrimaryButton>
      </div>
    </CardSurface>
  )
}
