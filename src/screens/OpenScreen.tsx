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
  const lastOpenedCard = cards.find((card) => card.id === openedCardIds.at(-1))
  const isDone = !nextCardId

  return (
    <CardSurface>
      <ScreenHeader eyebrow={`オープン\u3000${openedCardIds.length} / ${cards.length}枚`} title="1枚ずつオープン" description="高い順（100→1）にできたか、答え合わせ。" />
      {isDone ? (
        <PrimaryButton className="w-full" onClick={onFinish}>ふりかえりへ</PrimaryButton>
      ) : (
        <PrimaryButton className="w-full" onClick={() => onOpen(nextCardId)}>次をオープン</PrimaryButton>
      )}
      <div role="status" aria-atomic="true" className="my-5 rounded-2xl border border-[#c79b57] bg-[#fffaf0] p-4 text-center">
        {lastOpenedCard ? (
          <>
            <p className="text-xs font-bold text-[#806344]">いま開いたカード（{openedCardIds.length}枚目）</p>
            <p className="break-anywhere mt-2 text-sm font-bold">{formatCardLabel(cards, players, lastOpenedCard)}</p>
            <p className="my-2 text-5xl font-black tabular-nums">{lastOpenedCard.value}</p>
            <p className={`text-sm font-bold ${mistakeCardIds.includes(lastOpenedCard.id) ? 'text-[#a03e2c]' : 'text-[#285b49]'}`}>
              {mistakeCardIds.includes(lastOpenedCard.id) ? '並べた位置が違いました' : '並べた位置は合っています'}
            </p>
          </>
        ) : <p className="text-sm leading-7 text-[#6a563d]">みんなの例えは伝わったかな？<br />ボタンを押して、最初の1枚を開きましょう。</p>}
      </div>
      <h2 className="mb-3 text-sm font-bold text-[#806344]">並べた順</h2>
      <ol aria-label="カードの公開結果" className="grid gap-3">
        {sortedCardIds.map((cardId, index) => {
          const card = cards.find((candidate) => candidate.id === cardId)!
          const isOpened = openedCardIds.includes(cardId)
          const wasMistake = mistakeCardIds.includes(cardId)
          return (
            <li
              key={cardId}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-2xl border p-3 shadow-[0_6px_14px_rgba(61,38,15,0.1)] ${wasMistake ? 'border-[#b94a34] bg-[#fff0ea]' : cardId === nextCardId ? 'border-[#285b49] bg-[#edf2e9]' : 'border-[#c79b57] bg-[#fffaf0]'}`}
            >
              <p className="break-anywhere text-sm font-bold text-[#6a563d]">
                {index + 1}番目に高い / {formatCardLabel(cards, players, card)}
              </p>
              <p className="text-3xl font-black tabular-nums">{isOpened ? card.value : '?'}</p>
              {wasMistake ? <p className="col-span-2 mt-1 text-sm font-bold text-[#a03e2c]">順番違い</p> : cardId === nextCardId ? <p className="col-span-2 mt-1 text-xs font-bold text-[#285b49]">次はこのカード</p> : null}
            </li>
          )
        })}
      </ol>
    </CardSurface>
  )
}
