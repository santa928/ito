import { useEffect, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

type ModalProps = { label: string; children: ReactNode; onClose: () => void }

/** 背景を操作不可にし、Escapeと閉鎖後のフォーカス復帰を備えた紙のダイアログ。 */
export function Modal({ label, children, onClose }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  /** ブラウザの外へTabが抜ける差も吸収し、表示中の操作を循環させる。 */
  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')]
      .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0)
    if (controls.length === 0) return
    event.preventDefault()
    const current = controls.indexOf(document.activeElement as HTMLElement)
    const next = current < 0 ? (event.shiftKey ? controls.length - 1 : 0)
      : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length
    controls[next].focus()
  }

  return (
    <dialog
      ref={ref}
      className="paper-board game-dialog break-anywhere rounded-[1.35rem] border border-[#a87842]/55 p-5 text-[#2f2418]"
      aria-label={label}
      onKeyDown={keepFocus}
      onCancel={(event) => { event.preventDefault(); onClose() }}
    >
      {children}
    </dialog>
  )
}
