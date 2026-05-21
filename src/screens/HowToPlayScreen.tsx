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
      <ol className="grid list-decimal gap-3 pl-5 leading-7 text-[#4c3a28]">
        <li>スマホを順番に回して、自分の数字だけ見ます。</li>
        <li>お題に対して、数字の大きさを例えで伝えます。</li>
        <li>相談して、カードを小さいと思う順に並べます。</li>
        <li>1枚ずつオープンして、順番違いのミスをふりかえります。</li>
      </ol>
      <PrimaryButton className="mt-6" onClick={onBack}>
        戻る
      </PrimaryButton>
    </CardSurface>
  )
}
