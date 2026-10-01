import { useEffect, useState } from 'react'
import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { SecretCards } from '../components/SecretCards'
import { formatPlayerLabel } from '../domain/cardLabels'
import type { Card, Player } from '../domain/types'

import type { Role } from '../domain/werewolf'

type RevealScreenProps = {
  roles?: Record<string, Role>
  players: Player[]
  cards: Card[]
  onComplete: () => void
}

/** スマホを渡し、自分の数字だけを押している間だけ表示する画面。 */
export function RevealScreen({ players, cards, roles, onComplete }: RevealScreenProps) {
  const [index, setIndex] = useState(0)
  const currentPlayer = players[index]
  const isLast = index === players.length - 1
  useEffect(() => {
    if (index === 0) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [index])

  /** 次の本人確認へ進め、最後の人なら相談に移る。 */
  function next() {
    if (isLast) {
      onComplete()
      return
    }
    setIndex(index + 1)
  }

  return (
    <CardSurface>
      <ScreenHeader
        eyebrow={`カード確認\u3000${index + 1} / ${players.length}人目`}
        title={`次は ${formatPlayerLabel(players, currentPlayer)} さんへ`}
        description="本人だけが見てください。"
      />
      <div className="rounded-2xl border border-dashed border-[#b9843f] bg-[#fff1cf] p-5 text-center shadow-[inset_0_0_0_3px_rgba(255,255,255,0.36)]">
        <p className="text-sm font-bold text-[#806344]">押している間だけ表示</p>
        <div className="mt-4">
          <SecretCards key={currentPlayer.id} cards={cards} players={players} ownerId={currentPlayer.id} role={roles?.[currentPlayer.id]} />
        </div>
      </div>
      <PrimaryButton className="mt-4 w-full" onClick={next}>
        {isLast ? '相談へ進む' : '見終わった'}
      </PrimaryButton>
    </CardSurface>
  )
}
