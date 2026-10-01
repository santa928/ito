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
      <h2 className="mb-3 text-xl font-black">通常モード（100→1）</h2>
      <ol className="grid list-decimal gap-3 pl-5 leading-7 text-[#4c3a28]">
        <li>2〜8人で遊びます。2〜3人は1人2枚、4〜8人は1人1枚です。</li>
        <li>スマホを順番に回して、自分の数字だけ長押しで見ます。数字は1〜100です。</li>
        <li>お題に対して、数字の大きさを例えで伝えます。</li>
        <li>相談して、カードを高い順（100→1）だと思う並びにします。</li>
        <li>1枚ずつオープンします。全カードの正しい順位と違う位置のカードがミスです。ミスの後も最後まで開きます。</li>
        <li>最後に提出順と正解順を比べます。順位が合うカードは、前のカードがミスでも正解です。</li>
      </ol>
      <h2 className="mb-3 mt-6 text-xl font-black">人狼モード（100→1）</h2>
      <ol className="grid list-decimal gap-3 pl-5 leading-7 text-[#4c3a28]">
        <li>4〜8人・1人1枚。数字は重複しません。人狼1人、ほかは市民です。自分の数字と役職だけ長押しで見ます。</li>
        <li>数字は言わず、お題に沿った例えで相談して高い順（100→1）に並べます。市民は正解を、人狼は並びの妨害を目指します。</li>
        <li>全員で確認して並びを確定し、数字を公開します。公開後は並びとお題を変更できません。正解なら市民の勝利です。</li>
        <li>間違いなら「議論を始める」で60秒。数字と公開前の例え・誘導を比べて話し合います。役職は結果まで秘密です。</li>
        <li>期限後に秘密投票へ。スマホを順に渡し、本人だけが相手を選んで1票を確定します。自己投票・棄権・確定後の変更はできません。</li>
        <li>全員の投票後、最多票の1人が人狼なら市民勝利、それ以外は人狼勝利。同票は候補限定で1回再投票し、再び同票なら人狼勝利です。</li>
        <li>結果で数字・役職・勝敗理由をふりかえります。再戦では数字と役職を配り直します。</li>
      </ol>
      <PrimaryButton className="mt-6" onClick={onBack}>
        戻る
      </PrimaryButton>
    </CardSurface>
  )
}
