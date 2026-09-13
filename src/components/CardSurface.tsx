import type { ReactNode } from 'react'

type CardSurfaceProps = {
  children: ReactNode
  className?: string
  padded?: boolean
}

/** 紙カードのような余白と影を持つコンテンツ面を提供する。 */
export function CardSurface({ children, className = '', padded = true }: CardSurfaceProps) {
  return (
    <section
      className={`paper-board min-w-0 rounded-[1.35rem] border border-[#a87842]/55 ${padded ? 'p-4 sm:p-5' : ''} ${className}`}
    >
      {children}
    </section>
  )
}
