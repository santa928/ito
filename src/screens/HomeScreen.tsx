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
    <CardSurface className="my-auto overflow-hidden p-0">
      <div className="relative px-4 pb-4 pt-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[13.25rem] w-14 -translate-x-1/2 rounded-b-[1.15rem] border-x border-[#17382d] bg-[linear-gradient(180deg,#295b49_0%,#17382d_100%)] shadow-[0_10px_18px_rgba(29,21,13,0.18)]"
        />

        <header className="relative overflow-hidden rounded-[1.2rem] border border-[#ad7b42]/65 bg-[#fff7e8]/92 px-4 pb-6 pt-7 text-center shadow-[inset_0_0_0_3px_rgba(173,123,66,0.08),0_14px_24px_rgba(45,26,11,0.18)]">
          <div aria-hidden="true" className="absolute left-2 top-2 h-8 w-8 rounded-br-2xl border-b-2 border-r-2 border-[#9b6d32]/65" />
          <div aria-hidden="true" className="absolute right-2 top-2 h-8 w-8 rounded-bl-2xl border-b-2 border-l-2 border-[#9b6d32]/65" />
          <div aria-hidden="true" className="absolute bottom-3 left-2 h-5 w-5 rounded-tr-xl border-r-2 border-t-2 border-[#9b6d32]/65" />
          <div aria-hidden="true" className="absolute bottom-3 right-2 h-5 w-5 rounded-tl-xl border-l-2 border-t-2 border-[#9b6d32]/65" />

          <div
            aria-hidden="true"
            className="mx-auto mb-4 flex h-8 w-8 rotate-45 items-center justify-center border border-[#9f3f2c]/45 bg-[#b8462f] text-[#f6d49d] shadow-[0_4px_0_rgba(96,42,28,0.18)]"
          >
            <span className="-rotate-45 text-base font-black">+</span>
          </div>
          <h1 className="font-board-title whitespace-nowrap text-[2.15rem] font-black leading-none text-[#24160d]">価値観カード</h1>
          <div aria-hidden="true" className="mx-auto mt-4 flex max-w-[16rem] items-center gap-2 text-[#a36b2f]">
            <span className="h-px flex-1 border-t border-dashed border-[#a36b2f]" />
            <span className="h-2 w-2 rotate-45 bg-[#a36b2f]" />
            <span className="h-px flex-1 border-t border-dashed border-[#a36b2f]" />
          </div>
          <p className="mx-auto mt-4 max-w-[15rem] text-base font-black leading-7 text-[#285340]">数字でたとえ、価値観をつなぐ。</p>
        </header>

        <div className="relative mt-5 grid gap-3">
          <PrimaryButton className="min-h-14 text-left text-2xl" onClick={onPlay}>
            <span className="grid gap-1">
              <span>すぐ遊ぶ</span>
              <span className="text-sm font-bold text-white/80">プレイヤーを集めて始めます</span>
            </span>
          </PrimaryButton>
          <PrimaryButton className="min-h-12 text-left text-xl" variant="secondary" onClick={onTopics}>
            お題管理
          </PrimaryButton>
          <PrimaryButton className="min-h-12 text-left text-xl" variant="secondary" onClick={onHowToPlay}>
            遊び方
          </PrimaryButton>
        </div>
      </div>
    </CardSurface>
  )
}
