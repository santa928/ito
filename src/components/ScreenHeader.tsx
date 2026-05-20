type ScreenHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

/** 各画面の短い司会文と見出しを一貫した階層で表示する。 */
export function ScreenHeader({ eyebrow, title, description }: ScreenHeaderProps) {
  return (
    <header className="mb-5">
      {eyebrow ? <p className="text-sm font-bold text-[#806344]">{eyebrow}</p> : null}
      <h1 className="mt-1 text-3xl font-black leading-tight text-[#2f2418]">{title}</h1>
      {description ? <p className="mt-2 text-base leading-7 text-[#6e604f]">{description}</p> : null}
    </header>
  )
}
