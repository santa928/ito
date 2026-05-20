import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import type { Topic } from '../domain/types'

type TopicScreenProps = {
  topic: Topic
  onNext: () => void
}

/** 今回のお題と、数字を言わない相談ルールを表示する画面。 */
export function TopicScreen({ topic, onNext }: TopicScreenProps) {
  return (
    <CardSurface>
      <ScreenHeader
        eyebrow="お題"
        title={topic.text}
        description="数字は言わず、このお題に対する例えを順番に宣言してください。"
      />
      <PrimaryButton onClick={onNext}>相談して並べ替える</PrimaryButton>
    </CardSurface>
  )
}
