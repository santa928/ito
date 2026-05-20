import type { ReactNode } from 'react'

type CardSurfaceProps = {
  children: ReactNode
  className?: string
}

/** 紙カードのような余白と影を持つコンテンツ面を提供する。 */
export function CardSurface({ children, className = '' }: CardSurfaceProps) {
  return (
    <section
      className={`rounded-[1.25rem] border border-[#d8c3a0] bg-[#fffaf0] p-5 shadow-[0_18px_40px_rgba(57,38,12,0.16)] ${className}`}
    >
      {children}
    </section>
  )
}
