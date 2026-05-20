import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'

type HomeScreenProps = {
  onPlay: () => void
  onTopics: () => void
  onHowToPlay: () => void
}

/** 最初に表示する、プレイ開始と管理画面への入口。 */
export function HomeScreen({ onPlay, onTopics, onHowToPlay }: HomeScreenProps) {
  return (
    <CardSurface className="my-auto">
      <ScreenHeader
        eyebrow="価値観カード"
        title="数字を言わずに、順番を当てる"
        description="スマホを回してカードを確認し、お題への例えを聞きながら小さい順にオープンします。"
      />
      <div className="grid gap-3">
        <PrimaryButton onClick={onPlay}>すぐ遊ぶ</PrimaryButton>
        <PrimaryButton variant="secondary" onClick={onTopics}>
          お題管理
        </PrimaryButton>
        <PrimaryButton variant="secondary" onClick={onHowToPlay}>
          遊び方
        </PrimaryButton>
      </div>
    </CardSurface>
  )
}
