import { useState } from 'react'
import { CardSurface } from '../components/CardSurface'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenHeader } from '../components/ScreenHeader'
import { Modal } from '../components/Modal'
import { builtInTopics, getEnabledTopics } from '../domain/topics'
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

type RemovedTopic = { topic: Topic; index: number; wasHidden: boolean }

/** 内蔵カテゴリと自作お題の表示状態を編集する画面。 */
export function TopicsScreen({ settings, onSave, onBack }: TopicsScreenProps) {
  const [draft, setDraft] = useState(settings)
  const [text, setText] = useState('')
  const [category, setCategory] = useState<TopicCategory>('everyone')
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingCategory, setEditingCategory] = useState<TopicCategory>('everyone')
  const [query, setQuery] = useState('')
  const [removedTopic, setRemovedTopic] = useState<RemovedTopic | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const hiddenTopicIds = new Set(draft.hiddenTopicIds)
  const enabledCount = getEnabledTopics({ ...draft, hiddenTopicIds }).length
  const normalizedQuery = query.trim().normalize('NFKC').toLocaleLowerCase('ja')
  const matchingTopics = builtInTopics.filter((topic) => `${topic.text} ${categoryLabels[topic.category]}`.normalize('NFKC').toLocaleLowerCase('ja').includes(normalizedQuery))
  const hasPendingInput = text.trim().length > 0 || editingTopicId !== null
  const hasChanges = hasPendingInput || JSON.stringify(draft) !== JSON.stringify(settings)

  /** カテゴリの抽選対象を切り替え、個別のお題設定は保持する。 */
  function toggleCategory(nextCategory: TopicCategory) {
    setDraft({
      ...draft,
      categoryVisibility: {
        ...draft.categoryVisibility,
        [nextCategory]: !draft.categoryVisibility[nextCategory],
      },
    })
  }

  /** 個別のON/OFFだけを変更する。検索条件は抽選に影響しない。 */
  function toggleTopic(topicId: string) {
    const nextHidden = new Set(draft.hiddenTopicIds)
    if (nextHidden.has(topicId)) {
      nextHidden.delete(topicId)
    } else {
      nextHidden.add(topicId)
    }
    setDraft({ ...draft, hiddenTopicIds: [...nextHidden] })
  }

  /** 空でない入力を自作お題へ追加し、入力欄を次の追加に戻す。 */
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

  /** 元のお題を保持したまま、編集用の入力欄を開く。 */
  function startEdit(topic: Topic) {
    if (editingTopicId !== null) return
    setEditingTopicId(topic.id)
    setEditingText(topic.text)
    setEditingCategory(topic.category)
  }

  /** 編集中のお題だけを更新し、設定全体の保存は利用者に委ねる。 */
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

  /** 直前の削除を戻せるように、内容・位置・ON/OFFを保存して取り除く。 */
  function removeTopic(topicId: string) {
    const index = draft.customTopics.findIndex((topic) => topic.id === topicId)
    if (index < 0) return
    setRemovedTopic({ topic: draft.customTopics[index], index, wasHidden: hiddenTopicIds.has(topicId) })
    setDraft({
      ...draft,
      customTopics: draft.customTopics.filter((topic) => topic.id !== topicId),
      hiddenTopicIds: draft.hiddenTopicIds.filter((hiddenTopicId) => hiddenTopicId !== topicId),
    })
  }

  /** 直前に削除したお題を元の位置・設定へ復帰する。 */
  function undoRemove() {
    if (!removedTopic) return
    const customTopics = [...draft.customTopics]
    customTopics.splice(Math.min(removedTopic.index, customTopics.length), 0, removedTopic.topic)
    setDraft({ ...draft, customTopics, hiddenTopicIds: removedTopic.wasHidden ? [...draft.hiddenTopicIds, removedTopic.topic.id] : draft.hiddenTopicIds })
    setRemovedTopic(null)
  }

  /** 編集した内容があるときだけ、破棄を確認する。 */
  function requestBack() {
    if (hasChanges) setConfirmDiscard(true)
    else onBack()
  }

  return (
    <CardSurface>
      <ScreenHeader eyebrow="お題管理" title="場に合うお題だけ使う" description="カテゴリとお題を選び、最後に「保存」で反映します。" />
      <p role="status" className="mb-4 rounded-xl border border-[#d8c3a0] bg-[#fffaf0] p-3 text-sm font-bold leading-6">
        抽選対象{enabledCount}件
        {enabledCount === 0 ? '。この設定は保存できますが、遊ぶにはカテゴリとお題を1件以上ONにしてください。' : ''}
      </p>

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
          aria-label="自作お題"
          className="min-h-12 rounded-xl border border-[#d8c3a0] bg-white px-3 text-base"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="自作お題"
        />
        <select
          aria-label="自作お題のカテゴリ"
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
        <PrimaryButton disabled={!text.trim()} onClick={addTopic}>お題を追加</PrimaryButton>
      </section>

      <section className="mt-6 grid gap-2">
        {editingTopicId !== null ? <p className="text-sm leading-6 text-[#6a563d]">別のお題を編集するには、いまのお題を保存・取消してください。</p> : null}
        {draft.customTopics.length === 0 && !removedTopic ? <p className="rounded-xl border border-dashed border-[#c79b57] p-4 text-sm leading-6 text-[#6a563d]">自作お題はまだありません。みんなの共通の趣味や、思い出をお題にしてみましょう。</p> : null}
        {removedTopic ? (
          <div role="status" className="grid gap-2 rounded-xl border border-[#c79b57] bg-[#fffaf0] p-3 text-sm">
            <p>お題を削除しました。直前の削除は元に戻せます。</p>
            <PrimaryButton size="compact" variant="secondary" onClick={undoRemove}>元に戻す</PrimaryButton>
          </div>
        ) : null}
        {draft.customTopics.map((topic) => {
          const isEditing = editingTopicId === topic.id
          return (
            <div key={topic.id} className="grid gap-2 rounded-xl bg-white p-3">
              {isEditing ? (
                <>
                  <input
                    aria-label="お題の本文を編集"
                    className="min-h-11 rounded-lg border border-[#d8c3a0] px-3"
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                  />
                  <select
                    aria-label="お題のカテゴリを編集"
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
                    <PrimaryButton disabled={!editingText.trim()} onClick={saveEdit}>保存</PrimaryButton>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-anywhere font-bold">{topic.text}</p>
                      <p className="text-xs font-bold text-[#806344]">{categoryLabels[topic.category]}</p>
                    </div>
                    <label className="flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold">
                      表示
                      <input className="ml-2" type="checkbox" checked={!hiddenTopicIds.has(topic.id)} onChange={() => toggleTopic(topic.id)} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <PrimaryButton variant="secondary" disabled={editingTopicId !== null} onClick={() => startEdit(topic)}>
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
        <input type="search" aria-label="内蔵お題を検索" placeholder="お題やカテゴリで探す" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-12 min-w-0 rounded-xl border border-[#d8c3a0] bg-[#fffaf0] px-3" />
        <p className="text-xs leading-6 text-[#6a563d]">{builtInTopics.length}件中 {matchingTopics.length}件を表示。検索してもON/OFFは変わりません。</p>
        {matchingTopics.length === 0 ? <p role="status" className="rounded-xl bg-[#fffaf0] p-4 text-sm leading-6">見つかりませんでした。別の言葉で検索してみてください。</p> : null}
        <div className="max-h-80 overflow-auto overscroll-contain rounded-xl border border-[#d8c3a0] bg-white">
          {matchingTopics.map((topic) => (
            <label key={topic.id} className="flex min-h-14 items-center justify-between gap-3 border-b border-[#f1dfc2] p-3 text-sm last:border-b-0">
              <span className="break-anywhere">
                <span className="block font-bold">{topic.text}</span>
                <span className="text-xs font-bold text-[#806344]">{categoryLabels[topic.category]}</span>
              </span>
              <input type="checkbox" checked={!hiddenTopicIds.has(topic.id)} onChange={() => toggleTopic(topic.id)} />
            </label>
          ))}
        </div>
      </section>

      {hasPendingInput ? <p role="status" className="mt-5 text-sm leading-6 text-[#6a563d]">入力中のお題を追加するか、編集中のお題を保存・取消してから、設定全体を保存してください。</p> : null}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <PrimaryButton variant="secondary" onClick={requestBack}>
          戻る
        </PrimaryButton>
        <PrimaryButton disabled={hasPendingInput} onClick={() => onSave(draft)}>保存</PrimaryButton>
      </div>
      {confirmDiscard ? (
        <Modal label="変更を保存せず戻りますか？" onClose={() => setConfirmDiscard(false)}>
          <h2 className="text-xl font-bold">変更を保存せず戻りますか？</h2>
          <p className="mt-3 text-sm leading-7">この画面で変更した設定と、入力中のお題は失われます。</p>
          <div className="mt-5 grid gap-3">
            <PrimaryButton autoFocus onClick={() => setConfirmDiscard(false)}>編集を続ける</PrimaryButton>
            <PrimaryButton variant="secondary" onClick={onBack}>保存せず戻る</PrimaryButton>
          </div>
        </Modal>
      ) : null}
    </CardSurface>
  )
}
