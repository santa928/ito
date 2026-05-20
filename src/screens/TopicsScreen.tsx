import { useState } from 'react'
import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { builtInTopics } from '../domain/topics'
import type { Topic, TopicCategory } from '../domain/types'
import type { AppSettings } from '../storage/settings'

type TopicsScreenProps = {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
  onBack: () => void
}

const categoryLabels: Record<TopicCategory, string> = {
  everyone: '誰でも遊べる',
  friends: '友達向け',
  drinks: '飲み会向け',
}

const categories = Object.keys(categoryLabels) as TopicCategory[]

/** 内蔵カテゴリと自作お題の表示状態を編集する画面。 */
export function TopicsScreen({ settings, onSave, onBack }: TopicsScreenProps) {
  const [draft, setDraft] = useState(settings)
  const [text, setText] = useState('')
  const [category, setCategory] = useState<TopicCategory>('everyone')
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingCategory, setEditingCategory] = useState<TopicCategory>('everyone')

  const hiddenTopicIds = new Set(draft.hiddenTopicIds)

  function toggleCategory(nextCategory: TopicCategory) {
    setDraft({
      ...draft,
      categoryVisibility: {
        ...draft.categoryVisibility,
        [nextCategory]: !draft.categoryVisibility[nextCategory],
      },
    })
  }

  function toggleTopic(topicId: string) {
    const nextHidden = new Set(draft.hiddenTopicIds)
    if (nextHidden.has(topicId)) {
      nextHidden.delete(topicId)
    } else {
      nextHidden.add(topicId)
    }
    setDraft({ ...draft, hiddenTopicIds: [...nextHidden] })
  }

  function addTopic() {
    const trimmedText = text.trim()
    if (trimmedText.length === 0) {
      return
    }
    const topic: Topic = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmedText,
      category,
      isBuiltin: false,
    }
    setDraft({ ...draft, customTopics: [...draft.customTopics, topic] })
    setText('')
  }

  function startEdit(topic: Topic) {
    setEditingTopicId(topic.id)
    setEditingText(topic.text)
    setEditingCategory(topic.category)
  }

  function saveEdit() {
    const trimmedText = editingText.trim()
    if (!editingTopicId || trimmedText.length === 0) {
      return
    }
    setDraft({
      ...draft,
      customTopics: draft.customTopics.map((topic) =>
        topic.id === editingTopicId ? { ...topic, text: trimmedText, category: editingCategory } : topic,
      ),
    })
    setEditingTopicId(null)
    setEditingText('')
  }

  function removeTopic(topicId: string) {
    setDraft({
      ...draft,
      customTopics: draft.customTopics.filter((topic) => topic.id !== topicId),
      hiddenTopicIds: draft.hiddenTopicIds.filter((hiddenTopicId) => hiddenTopicId !== topicId),
    })
  }

  return (
    <CardSurface>
      <ScreenHeader eyebrow="お題管理" title="場に合うお題だけ使う" />

      <section className="grid gap-3">
        <h2 className="text-sm font-black text-[#806344]">カテゴリ</h2>
        {categories.map((topicCategory) => (
          <label key={topicCategory} className="flex items-center justify-between rounded-xl border border-[#d8c3a0] bg-white p-3 font-bold">
            {categoryLabels[topicCategory]}
            <input
              type="checkbox"
              checked={draft.categoryVisibility[topicCategory]}
              onChange={() => toggleCategory(topicCategory)}
            />
          </label>
        ))}
      </section>

      <section className="mt-6 grid gap-3">
        <h2 className="text-sm font-black text-[#806344]">自作お題</h2>
        <input
          className="min-h-12 rounded-xl border border-[#d8c3a0] bg-white px-3 text-base"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="自作お題"
        />
        <select
          className="min-h-12 rounded-xl border border-[#d8c3a0] bg-white px-3 text-base"
          value={category}
          onChange={(event) => setCategory(event.target.value as TopicCategory)}
        >
          {categories.map((topicCategory) => (
            <option key={topicCategory} value={topicCategory}>
              {categoryLabels[topicCategory]}
            </option>
          ))}
        </select>
        <PrimaryButton onClick={addTopic}>お題を追加</PrimaryButton>
      </section>

      <section className="mt-6 grid gap-2">
        {draft.customTopics.map((topic) => {
          const isEditing = editingTopicId === topic.id
          return (
            <div key={topic.id} className="grid gap-2 rounded-xl bg-white p-3">
              {isEditing ? (
                <>
                  <input
                    className="min-h-11 rounded-lg border border-[#d8c3a0] px-3"
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                  />
                  <select
                    className="min-h-11 rounded-lg border border-[#d8c3a0] px-3"
                    value={editingCategory}
                    onChange={(event) => setEditingCategory(event.target.value as TopicCategory)}
                  >
                    {categories.map((topicCategory) => (
                      <option key={topicCategory} value={topicCategory}>
                        {categoryLabels[topicCategory]}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <PrimaryButton variant="secondary" onClick={() => setEditingTopicId(null)}>
                      取消
                    </PrimaryButton>
                    <PrimaryButton onClick={saveEdit}>保存</PrimaryButton>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{topic.text}</p>
                      <p className="text-xs font-bold text-[#806344]">{categoryLabels[topic.category]}</p>
                    </div>
                    <label className="text-sm font-bold">
                      表示
                      <input className="ml-2" type="checkbox" checked={!hiddenTopicIds.has(topic.id)} onChange={() => toggleTopic(topic.id)} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <PrimaryButton variant="secondary" onClick={() => startEdit(topic)}>
                      編集
                    </PrimaryButton>
                    <PrimaryButton variant="danger" onClick={() => removeTopic(topic.id)}>
                      削除
                    </PrimaryButton>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </section>

      <section className="mt-6 grid gap-2">
        <h2 className="text-sm font-black text-[#806344]">内蔵お題</h2>
        <div className="max-h-72 overflow-auto rounded-xl border border-[#d8c3a0] bg-white">
          {builtInTopics.map((topic) => (
            <label key={topic.id} className="flex items-start justify-between gap-3 border-b border-[#f1dfc2] p-3 text-sm last:border-b-0">
              <span>
                <span className="block font-bold">{topic.text}</span>
                <span className="text-xs font-bold text-[#806344]">{categoryLabels[topic.category]}</span>
              </span>
              <input type="checkbox" checked={!hiddenTopicIds.has(topic.id)} onChange={() => toggleTopic(topic.id)} />
            </label>
          ))}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <PrimaryButton variant="secondary" onClick={onBack}>
          戻る
        </PrimaryButton>
        <PrimaryButton onClick={() => onSave(draft)}>保存</PrimaryButton>
      </div>
    </CardSurface>
  )
}
