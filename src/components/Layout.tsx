import type { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

/** スマホ1画面に収まる卓上背景のアプリ土台を提供する。 */
export function Layout({ children }: LayoutProps) {
  return (
    <main className="tabletop-bg min-h-dvh px-4 py-4 text-[#2f2418]">
      <div className="linen-mat mx-auto flex min-h-[calc(100dvh-2rem)] max-w-md flex-col rounded-[1.75rem] border border-[#d8bd86]/70 p-3 shadow-[inset_0_0_34px_rgba(93,58,25,0.16),0_16px_40px_rgba(25,15,8,0.28)]">
        {children}
      </div>
    </main>
  )
}
