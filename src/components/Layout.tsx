import type { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

/** スマホ1画面に収まる卓上背景のアプリ土台を提供する。 */
export function Layout({ children }: LayoutProps) {
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,#f9f0df_0,#f1dfc2_46%,#dfc49a_100%)] px-4 py-4 text-[#2f2418]">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-md flex-col">{children}</div>
    </main>
  )
}
