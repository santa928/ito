import { useCallback, useEffect, useRef, useState } from 'react'
import { formatCardLabel } from '../domain/cardLabels'
import type { Card, Player } from '../domain/types'

type SecretCardsProps = {
  cards: Card[]
  players: Player[]
  ownerId: string
}

/** 本人の数字を押下中だけDOMに置く。所有者が変わるときはkeyで再生成する。 */
export function SecretCards({ cards, players, ownerId }: SecretCardsProps) {
  const [visible, setVisible] = useState(false)
  const input = useRef<'pointer' | ' ' | 'Enter' | null>(null)
  const hide = useCallback(() => {
    input.current = null
    setVisible(false)
  }, [])

  useEffect(() => {
    // 解放をボタンが受け取れないケースでも、画面全体で表示を解除する。
    window.addEventListener('blur', hide)
    window.addEventListener('pagehide', hide)
    window.addEventListener('pointerup', hide)
    window.addEventListener('pointercancel', hide)
    window.addEventListener('keyup', hide)
    document.addEventListener('visibilitychange', hide)
    return () => {
      window.removeEventListener('blur', hide)
      window.removeEventListener('pagehide', hide)
      window.removeEventListener('pointerup', hide)
      window.removeEventListener('pointercancel', hide)
      window.removeEventListener('keyup', hide)
      document.removeEventListener('visibilitychange', hide)
    }
  }, [hide])

  return (
    <div>
      <div className="grid gap-3">
        {cards.filter((card) => card.ownerId === ownerId).map((card) => (
          <div key={card.id} className="min-w-0 rounded-2xl border border-[#e0c18a] bg-[#fffaf0] px-3 py-3 text-center shadow-[inset_0_0_0_2px_rgba(255,255,255,0.6)]">
            <p className="break-anywhere text-sm font-bold text-[#806344]">{formatCardLabel(cards, players, card)}</p>
            <p className="mt-2 text-5xl font-black tabular-nums">{visible ? card.value : '?'}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="secret-hold mt-5 min-h-14 w-full touch-none select-none rounded-2xl border border-[#d0a65c]/60 bg-[linear-gradient(180deg,#32705f_0%,#235747_100%)] px-4 text-base font-black text-white shadow-[0_7px_0_#173a31]"
        onPointerDown={(event) => {
          if (event.button !== 0 || event.ctrlKey || event.isPrimary === false || input.current !== null) return
          event.preventDefault()
          event.currentTarget.focus()
          input.current = 'pointer'
          setVisible(true)
        }}
        onPointerUp={hide}
        onPointerMove={(event) => {
          if (input.current !== 'pointer') return
          const box = event.currentTarget.getBoundingClientRect()
          if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) hide()
        }}
        onPointerCancel={hide}
        onPointerLeave={hide}
        onLostPointerCapture={hide}
        onBlur={hide}
        onContextMenu={(event) => { event.preventDefault(); hide() }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { hide(); return }
          if (event.key !== ' ' && event.key !== 'Enter') return
          event.preventDefault()
          if (event.repeat || input.current !== null) return
          input.current = event.key
          setVisible(true)
        }}
        onKeyUp={hide}
      >
        長押しで見る
      </button>
      <p className="mt-3 text-center text-sm leading-6 text-[#5a4631]">指を離すと数字が隠れます。<br /><span className="text-xs">キーボードはSpace / Enterを押して確認。</span></p>
    </div>
  )
}
