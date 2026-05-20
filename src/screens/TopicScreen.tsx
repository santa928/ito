import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import type { Topic } from '../domain/types'

type TopicScreenProps = {
  topic: Topic
  onReroll: () => void
  onNext: () => void
}

/** 今回のお題と、数字を言わない相談ルールを表示する画面。 */
export function TopicScreen({ topic, onReroll, onNext }: TopicScreenProps) {
  return (
    <CardSurface>
      <ScreenHeader
        eyebrow="お題"
        title={topic.text}
        description="数字は言わず、このお題に対する例えを順番に宣言してください。"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <PrimaryButton variant="secondary" onClick={onReroll}>
          お題を再抽選
        </PrimaryButton>
        <PrimaryButton onClick={onNext}>相談して並べ替える</PrimaryButton>
      </div>
    </CardSurface>
  )
}
