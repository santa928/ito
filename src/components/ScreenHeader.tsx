type ScreenHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

/** 各画面の短い司会文と見出しを一貫した階層で表示する。 */
export function ScreenHeader({ eyebrow, title, description }: ScreenHeaderProps) {
  return (
    <header className="mb-5">
      {eyebrow ? <p className="text-sm font-black tracking-[0.08em] text-[#8b6037]">{eyebrow}</p> : null}
      <h1 className="font-board-title mt-1 text-3xl font-black leading-tight text-[#26180f]">{title}</h1>
      {description ? <p className="mt-2 text-base font-medium leading-7 text-[#6a563d]">{description}</p> : null}
    </header>
  )
}
