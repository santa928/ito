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
        <div className="pointer-events-none absolute -left-4 -top-4 h-16 w-16 rounded-full border border-[#d7b875] bg-[radial-gradient(circle_at_35%_30%,#f1d28a,#a2662f_72%)] shadow-[0_8px_18px_rgba(48,27,10,0.28)]" />
        <div className="pointer-events-none absolute -right-3 top-4 h-12 w-12 rounded-full border border-[#c99056] bg-[radial-gradient(circle_at_35%_30%,#d9a36d,#8f4d2e_76%)] shadow-[0_8px_16px_rgba(48,27,10,0.22)]" />

        <header className="relative rounded-[1.15rem] border border-[#ad7b42]/55 bg-[#fff7e8]/80 px-4 py-3 text-center shadow-[inset_0_0_0_3px_rgba(173,123,66,0.08)]">
          <div className="mx-auto mb-2 flex h-7 w-10 items-end justify-center gap-1">
            <span className="h-6 w-4 -rotate-6 rounded-md bg-[#184635] shadow-[0_4px_0_rgba(25,24,19,0.18)]" />
            <span className="h-6 w-4 rotate-6 rounded-md bg-[#b8462f] shadow-[0_4px_0_rgba(25,24,19,0.18)]" />
          </div>
          <p className="text-xs font-black tracking-[0.18em] text-[#8b6037]">価値観パーティーゲーム</p>
          <h1 className="font-board-title mt-1 whitespace-nowrap text-[2.3rem] font-black leading-none text-[#24160d]">価値観カード</h1>
          <div className="mx-auto mt-2 flex max-w-[15rem] items-center gap-2 text-[#a36b2f]">
            <span className="h-px flex-1 border-t border-dashed border-[#a36b2f]" />
            <span className="h-2 w-2 rotate-45 bg-[#a36b2f]" />
            <span className="h-px flex-1 border-t border-dashed border-[#a36b2f]" />
          </div>
          <p className="mt-2 text-sm font-black tracking-[0.08em] text-[#285340]">数字を並べて、価値観をつなぐ。</p>
        </header>

        <div className="relative mt-3 grid grid-cols-[1fr_auto] gap-3">
          <div className="grid grid-cols-2 gap-3">
            {['1枚目', '2枚目'].map((label) => (
              <div
                key={label}
                className="card-back-pattern relative h-24 rounded-2xl border-[5px] border-[#f4e9d0] shadow-[0_9px_18px_rgba(45,26,11,0.22)]"
              >
                <div className="absolute inset-2 rounded-xl border border-[#d7b875]/80" />
                <span className="absolute left-1/2 top-1/2 min-w-16 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#c79b57] bg-[#fff4da] px-3 py-2 text-center text-sm font-black text-[#3d2818] shadow-[0_4px_10px_rgba(45,26,11,0.18)]">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex w-14 flex-col items-center justify-center gap-1 rounded-2xl border border-[#cda66b] bg-[#fff2d2] px-2 py-2 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.45)]">
            <p className="text-xs font-black text-[#7c5632]">ライフ</p>
            {[0, 1, 2].map((token) => (
              <span
                key={token}
                className="h-7 w-7 rounded-full border border-[#8d5826] bg-[radial-gradient(circle_at_35%_28%,#d9964b,#8a4d22_72%)] shadow-[0_3px_0_#6e3c1a]"
              />
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[#bd8c4c]/55 bg-[#fff7e8] px-3 py-2 shadow-[0_8px_18px_rgba(45,26,11,0.12)]">
          <div className="flex items-center justify-between gap-3 text-sm font-black text-[#4a321e]">
            <span>並べる順番</span>
            <span className="tracking-[0.45em]">1 2 3 4</span>
          </div>
          <div className="relative mt-2 h-5">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-[#8c6239]" />
            {[0, 1, 2, 3].map((mark) => (
              <span
                key={mark}
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border border-[#7f552c] bg-[#b4813d]"
                style={{ left: `${mark * 30 + 4}%` }}
              />
            ))}
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xl text-[#5e3d23]">›</span>
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          <PrimaryButton className="min-h-14 text-left text-2xl" onClick={onPlay}>
            <span className="grid gap-1">
              <span>すぐ遊ぶ</span>
              <span className="text-sm font-bold text-white/80">プレイヤーを集めて、すぐに始めます</span>
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
