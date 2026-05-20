import type { Topic, TopicCategory } from './types'

export type TopicVisibility = Record<TopicCategory, boolean>

export type EnabledTopicInput = {
  categoryVisibility: TopicVisibility
  hiddenTopicIds: Set<string>
  customTopics: Topic[]
}

const everyoneTexts = [
  '朝ごはんに出てきたらうれしいもの',
  '休日にできたらうれしいこと',
  '家にあると便利なもの',
  '旅行先でテンションが上がるもの',
  '雨の日にしたいこと',
  '待ち時間にあると助かるもの',
  '差し入れでもらうとうれしいもの',
  '部屋に置きたいもの',
  'コンビニでつい買いたくなるもの',
  '寝る前にしたいこと',
  '新生活で必要なもの',
  '公園にあるとうれしいもの',
  'お弁当に入っているとうれしいもの',
  '長旅に持っていきたいもの',
  '掃除で見つかるとうれしいもの',
  '家電としてほしいもの',
  '朝起きて最初にしたいこと',
  '帰宅後にしたいこと',
  '写真に撮りたくなるもの',
  'プレゼントでもらうとうれしい日用品',
  '駅にあると助かるもの',
  '夏に食べたいもの',
  '冬に食べたいもの',
  '散歩中に見つけるとうれしいもの',
  'カバンに入っていると安心するもの',
  '疲れた日にありがたいもの',
  '学校や職場にあると便利なもの',
  '週末に行きたい場所',
  '家族にすすめたいもの',
  '一日だけ増えた自由時間でやりたいこと',
]

const friendsTexts = [
  '友達にすすめたい映画や番組',
  '一緒に行くと楽しそうな場所',
  'グループ旅行で盛り上がること',
  '待ち合わせに遅れた理由として許せるもの',
  '友達の家にあると驚くもの',
  'カラオケで盛り上がる曲',
  '文化祭でやりたい出し物',
  '友達から急にもらうとうれしいもの',
  'みんなで食べると楽しいもの',
  '写真フォルダに残っているとうれしい写真',
  '友達に任せたい係',
  '遊びに行く前に決めておきたいこと',
  '久しぶりに会った友達と話したいこと',
  '友達の意外な一面としてうれしいもの',
  'グループチャットで送られるとうれしいもの',
  '一緒に始めたい趣味',
  '友達の誕生日に用意したいもの',
  '放課後や仕事終わりに寄りたい場所',
  '友達に借りたいもの',
  'みんなで作ると楽しそうな料理',
  '友達に褒められるとうれしいこと',
  '旅行の計画で大事にしたいこと',
  '盛り上がるミニゲーム',
  '友達に教えたい便利技',
  '一緒に挑戦したいこと',
  '友達の部屋で見つけたら話題になるもの',
  '懐かしい気持ちになるもの',
  '集合写真でやりたいポーズ',
  '友達と買いに行きたいもの',
  '次の集まりでやってみたいこと',
]

const drinksTexts = [
  '乾杯の一杯目に合うもの',
  '飲み会の席にあるとうれしい料理',
  '二次会で行きたい場所',
  '場が少し盛り上がる話題',
  '差し入れで持っていくと喜ばれるもの',
  'おつまみとして強いもの',
  '終電前に食べたいもの',
  '飲み会で流れると楽しい曲',
  '幹事が用意してくれるとうれしいもの',
  'ノンアルでも楽しめる飲み物',
  'お店選びで重視したいこと',
  '最初に頼むと安心する料理',
  'みんなで分けやすいメニュー',
  '会話のきっかけになるもの',
  '飲み会帰りに寄りたい場所',
  '席にあると助かるもの',
  '久しぶりの集まりで話したいこと',
  '軽く盛り上がる乾杯の言葉',
  'お祝いの席にあるとうれしいもの',
  'テーブルに置きたい小物',
  '飲み会で頼むと意外に人気なもの',
  'お店の雰囲気でうれしいもの',
  '早めに注文しておきたいもの',
  'シメに食べたいもの',
  '飲み会でありがたい気配り',
  '写真を撮りたくなる瞬間',
  '会計前にあるとうれしいこと',
  '次の日に残るとうれしい思い出',
  '少人数飲みでちょうどいい話題',
  '大人数飲みで助かるルール',
]

/** テキスト配列から安定 ID を持つ組み込みお題を生成します。 */
function toTopics(category: TopicCategory, prefix: string, texts: string[]): Topic[] {
  return texts.map((text, index) => ({
    id: `${prefix}-${String(index + 1).padStart(3, '0')}`,
    text,
    category,
    isBuiltin: true,
  }))
}

export const builtInTopics: Topic[] = [
  ...toTopics('everyone', 'everyone', everyoneTexts),
  ...toTopics('friends', 'friends', friendsTexts),
  ...toTopics('drinks', 'drinks', drinksTexts),
]

/** カテゴリ表示設定と非表示 ID をもとに、抽選対象のお題だけを返します。 */
export function getEnabledTopics(input: EnabledTopicInput): Topic[] {
  return [...builtInTopics, ...input.customTopics].filter((topic) => {
    return input.categoryVisibility[topic.category] && !input.hiddenTopicIds.has(topic.id)
  })
}

/** 与えられた乱数値からお題を 1 件選びます。 */
export function pickTopic(topics: Topic[], randomValue: number = Math.random()): Topic {
  if (topics.length === 0) {
    throw new Error('選択可能なお題がありません')
  }
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue > 1) {
    throw new Error('乱数値は0以上1以下で指定してください')
  }
  const index = Math.min(topics.length - 1, Math.floor(randomValue * topics.length))
  return topics[index]
}
