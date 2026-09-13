import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'

type HowToPlayScreenProps = {
  onBack: () => void
}

/** 数字を言わずに例える基本ルールを説明する画面。 */
export function HowToPlayScreen({ onBack }: HowToPlayScreenProps) {
  return (
    <CardSurface>
      <ScreenHeader eyebrow="遊び方" title="数字は言わずに例える" />
      <aside className="mb-5 rounded-xl border border-[#c79b57] bg-[#fffaf0] p-4 text-sm leading-7 text-[#4c3a28]">
        <h2 className="font-bold text-[#285b49]">たとえば「大きい動物」なら</h2>
        <p className="mt-2">小さい数字なら「ねずみ」、大きい数字なら「ぞう」。自分の数字に近いと感じるものを例えにして、みんなで順番を考えます。</p>
        <p className="mt-2 font-bold">数字そのものは、最後に開くまで内緒です。</p>
      </aside>
      <ol className="grid list-decimal gap-3 pl-5 leading-7 text-[#4c3a28]">
        <li>2〜8人で遊びます。2〜3人は1人2枚、4〜8人は1人1枚です。</li>
        <li>スマホを順番に回して、自分の数字だけ長押しで見ます。数字は1〜100です。</li>
        <li>お題に対して、数字の大きさを例えで伝えます。</li>
        <li>相談して、カードを高い順（100→1）だと思う並びにします。</li>
        <li>1枚ずつオープンします。全カードの正しい順位と違う位置のカードがミスです。ミスの後も最後まで開きます。</li>
        <li>最後に提出順と正解順を比べます。順位が合うカードは、前のカードがミスでも正解です。</li>
      </ol>
      <PrimaryButton className="mt-6" onClick={onBack}>
        戻る
      </PrimaryButton>
    </CardSurface>
  )
}
