import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { Modal } from '../components/Modal'
import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { formatCardLabel } from '../domain/cardLabels'
import type { Card, Player } from '../domain/types'

type SortScreenProps = {
  ascending?: boolean
  cards: Card[]
  players: Player[]
  sortedCardIds: string[]
  onChange: (cardIds: string[]) => void
  onNext: () => void
}

/** 相談結果として、伏せカードを高いと思う順に並べる画面。 */
export function SortScreen({ cards, players, ascending, sortedCardIds, onChange, onNext }: SortScreenProps) {
  const [confirming, setConfirming] = useState(false)
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())

  /** 指定カードだけを隣の順位へ移動する。境界では変更しない。 */
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

  /** 伏せたままのカードをドラッグ先の前後へ挿入する。 */
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

  /** カード行の実寸を、ドラッグ中の挿入位置判定用に保持する。 */
  function setRowRef(cardId: string) {
    return (node: HTMLDivElement | null) => {
      if (node) {
        rowRefs.current.set(cardId, node)
        return
      }
      rowRefs.current.delete(cardId)
    }
  }

  /** 専用ハンドルだけを捕捉し、本文からの縦スクロールを妨げない。 */
  function startDrag(event: PointerEvent<HTMLButtonElement>, cardId: string) {
    if (event.button !== 0 || event.isPrimary === false || event.ctrlKey) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraggingCardId(cardId)
  }

  /** カーソル下にある行の実測境界から、カードの挿入位置を決める。 */
  function dragMove(event: PointerEvent<HTMLButtonElement>) {
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
      <ScreenHeader eyebrow="相談" title={ascending ? '小さい順に並べる' : '高い順に並べる'} description={`${ascending ? '小さい順（1→100）' : '高い順（100→1）'}です。左の↕を押したまま動かすか、上下ボタンで並べます。名前の上ではスクロールできます。`} />
      <div className="grid gap-3">
        {sortedCardIds.map((cardId, index) => {
          const card = cards.find((candidate) => candidate.id === cardId)!
          const label = formatCardLabel(cards, players, card)
          return (
            <div
              key={cardId}
              ref={setRowRef(cardId)}
              data-testid="sort-card-row"
              className={`grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 rounded-2xl border border-[#c79b57] bg-[#fffaf0] p-3 shadow-[0_6px_14px_rgba(61,38,15,0.1)] ${draggingCardId === cardId ? 'opacity-80' : ''}`}
            >
              <button
                type="button"
                aria-label={`${label}をドラッグ`}
                className="h-11 w-11 touch-none select-none rounded-xl bg-[#f3dfba] text-lg font-black text-[#806344]"
                onPointerDown={(event) => startDrag(event, cardId)}
                onPointerMove={dragMove}
                onPointerUp={() => setDraggingCardId(null)}
                onPointerCancel={() => setDraggingCardId(null)}
                onLostPointerCapture={() => setDraggingCardId(null)}
              >
                ↕
              </button>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#806344]">{index + 1}番目に{ascending ? '小さい' : '高い'}</p>
                <p className="break-anywhere font-bold">{label}</p>
              </div>
              <div className="grid gap-2">
                <button disabled={index === 0} className="h-11 w-11 rounded-xl border border-[#ead19d] bg-[#fff1cf] font-black shadow-[0_3px_0_#d4af70] disabled:opacity-35" onClick={() => move(cardId, -1)} aria-label={`${label}を上へ`}>↑</button>
                <button disabled={index === sortedCardIds.length - 1} className="h-11 w-11 rounded-xl border border-[#ead19d] bg-[#fff1cf] font-black shadow-[0_3px_0_#d4af70] disabled:opacity-35" onClick={() => move(cardId, 1)} aria-label={`${label}を下へ`}>↓</button>
              </div>
            </div>
          )
        })}
      </div>
      <PrimaryButton className="mt-5 w-full" onClick={() => ascending ? setConfirming(true) : onNext()}>
        {ascending ? '並びを確定・数字公開' : 'この順でオープン'}
      </PrimaryButton>
      {confirming ? <Modal label="並びを確定しますか？" onClose={() => setConfirming(false)}>
        <h2 className="text-2xl font-black">並びを確定しますか？</h2>
        <p className="mt-3 leading-7">全員の数字を公開します。公開後は並びとお題を変更できません。役職は結果まで公開しません。</p>
        <div className="mt-5 grid gap-3">
          <PrimaryButton autoFocus variant="secondary" onClick={() => setConfirming(false)}>並べ替えに戻る</PrimaryButton>
          <PrimaryButton onClick={onNext}>確定して数字を公開</PrimaryButton>
        </div>
      </Modal> : null}
    </CardSurface>
  )
}
