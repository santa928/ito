import type { ReactNode } from 'react'

type CardSurfaceProps = {
  children: ReactNode
  className?: string
}

/** 紙カードのような余白と影を持つコンテンツ面を提供する。 */
export function CardSurface({ children, className = '' }: CardSurfaceProps) {
  return (
    <section
      className={`paper-board rounded-[1.35rem] border border-[#a87842]/55 p-5 ${className}`}
    >
      {children}
    </section>
  )
}
