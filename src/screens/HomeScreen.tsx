import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'

type HomeScreenProps = {
  onPlay: () => void
  onTopics: () => void
  onHowToPlay: () => void
}

/** 最初に表示する、プレイ開始と管理画面への入口。 */
export function HomeScreen({ onPlay, onTopics, onHowToPlay }: HomeScreenProps) {
  return (
    <CardSurface padded={false} className="my-auto overflow-hidden">
      <div className="relative px-4 pb-4 pt-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[13.25rem] w-14 -translate-x-1/2 rounded-b-[1.15rem] border-x border-[#17382d] bg-[linear-gradient(180deg,#295b49_0%,#17382d_100%)] shadow-[0_10px_18px_rgba(29,21,13,0.18)]"
        />

        <header className="relative overflow-hidden rounded-[1.2rem] border border-[#ad7b42]/65 bg-[#fff7e8]/92 px-4 pb-8 pt-7 text-center shadow-[inset_0_0_0_3px_rgba(173,123,66,0.08),0_14px_24px_rgba(45,26,11,0.18)]">
          <div aria-hidden="true" className="absolute left-2 top-2 h-8 w-8 rounded-br-2xl border-b-2 border-r-2 border-[#9b6d32]/65" />
          <div aria-hidden="true" className="absolute right-2 top-2 h-8 w-8 rounded-bl-2xl border-b-2 border-l-2 border-[#9b6d32]/65" />
          <div aria-hidden="true" className="absolute bottom-2 left-2 h-4 w-4 rounded-tr-xl border-r-2 border-t-2 border-[#9b6d32]/65" />
          <div aria-hidden="true" className="absolute bottom-2 right-2 h-4 w-4 rounded-tl-xl border-l-2 border-t-2 border-[#9b6d32]/65" />

          <div
            aria-hidden="true"
            className="mx-auto mb-4 flex h-8 w-8 rotate-45 items-center justify-center border border-[#9f3f2c]/45 bg-[#b8462f] text-[#f6d49d] shadow-[0_4px_0_rgba(96,42,28,0.18)]"
          >
            <span className="-rotate-45 text-base font-black">+</span>
          </div>
          <h1 tabIndex={-1} className="font-board-title whitespace-nowrap text-[clamp(1.75rem,8vw,2.25rem)] font-black leading-tight text-[#24160d]">価値観カード</h1>
          <div aria-hidden="true" className="mx-auto mt-4 flex max-w-[16rem] items-center gap-2 text-[#a36b2f]">
            <span className="h-px flex-1 border-t border-dashed border-[#a36b2f]" />
            <span className="h-2 w-2 rotate-45 bg-[#a36b2f]" />
            <span className="h-px flex-1 border-t border-dashed border-[#a36b2f]" />
          </div>
          <p className="mx-auto mt-4 text-base font-bold leading-7 text-[#285340]">
            <span className="block">数字でたとえ、</span>
            <span className="block">価値観をつなぐ。</span>
          </p>
          <p className="mt-4 text-sm font-medium text-[#6a563d]">2〜8人 · スマホ1台で遊べます</p>
        </header>

        <div className="relative mt-5 grid gap-3">
          <PrimaryButton size="large" className="text-center" onClick={onPlay}>
            <span className="grid gap-1.5">
              <span>すぐ遊ぶ</span>
              <span className="text-sm font-medium text-white/90">人数を選んでスタート</span>
            </span>
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={onTopics}>
            お題管理
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={onHowToPlay}>
            遊び方
          </PrimaryButton>
        </div>
        <p className="relative mt-6 text-center text-xs leading-5 text-[#6a563d]">登録不要。名前とお題設定はこの端末に保存します。</p>
      </div>
    </CardSurface>
  )
}
