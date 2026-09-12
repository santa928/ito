import type { Topic, TopicCategory } from '../domain/types'
import { limitPlayerName, MAX_PLAYERS } from '../domain/game'
import { builtInTopics } from '../domain/topics'

const storageKey = 'ito-like-party-card-game/settings/v1'

export type AppSettings = {
  categoryVisibility: Record<TopicCategory, boolean>
  hiddenTopicIds: string[]
  customTopics: Topic[]
  lastPlayerNames: string[]
}

export type SaveResult =
  | { ok: true }
  | { ok: false; message: string }

export type SettingsLoadResult = { settings: AppSettings; notice: string | null }

export const defaultSettings: AppSettings = {
  categoryVisibility: {
    everyone: true,
    friends: true,
    drinks: true,
  },
  hiddenTopicIds: [],
  customTopics: [],
  lastPlayerNames: [],
}

const topicCategories = ['everyone', 'friends', 'drinks'] as const satisfies readonly TopicCategory[]

/** 既定設定の共有参照を返さないよう、読み込み用の新しい設定オブジェクトを作ります。 */
function createDefaultSettings(): AppSettings {
  return {
    categoryVisibility: { ...defaultSettings.categoryVisibility },
    hiddenTopicIds: [...defaultSettings.hiddenTopicIds],
    customTopics: [...defaultSettings.customTopics],
    lastPlayerNames: [...defaultSettings.lastPlayerNames],
  }
}

/** localStorage 由来の値を安全にプロパティ参照できる object に限定します。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 保存値の category がアプリで扱う既知カテゴリかどうかを判定します。 */
function isTopicCategory(value: unknown): value is TopicCategory {
  return topicCategories.includes(value as TopicCategory)
}

/** 保存済みの配列から文字列要素だけを復元します。 */
function loadStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

/** 保存済みの customTopics から Topic として安全な要素だけを復元します。 */
function loadCustomTopics(value: unknown): Topic[] {
  if (!Array.isArray(value)) {
    return []
  }

  const usedIds = new Set(builtInTopics.map((topic) => topic.id))
  const topics: Topic[] = []
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.text !== 'string'
      || !isTopicCategory(item.category) || typeof item.isBuiltin !== 'boolean') continue
    const id = item.id.trim()
    const text = item.text.trim()
    if (!id || !text || usedIds.has(id)) continue
    usedIds.add(id)
    topics.push({ id, text, category: item.category, isBuiltin: false })
  }
  return topics
}

/** 保存済みのカテゴリ表示設定から、既知カテゴリの boolean 値だけを復元します。 */
function loadCategoryVisibility(value: unknown): AppSettings['categoryVisibility'] {
  const categoryVisibility = { ...defaultSettings.categoryVisibility }
  if (!isRecord(value)) {
    return categoryVisibility
  }

  for (const category of topicCategories) {
    if (typeof value[category] === 'boolean') {
      categoryVisibility[category] = value[category]
    }
  }

  return categoryVisibility
}

/** 従来の呼出元向けに、修復された設定だけを読み込む。保存は行わない。 */
export function loadSettings(): AppSettings {
  return loadSettingsWithNotice().settings
}

/** 読み込み時に修復した場合は案内を返す。元の保存値は明示保存まで書き換えない。 */
export function loadSettingsWithNotice(): SettingsLoadResult {
  const fallback = (): SettingsLoadResult => ({ settings: createDefaultSettings(), notice: '保存した設定を読み込めなかったため、今回は初期設定で始めます。' })
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === null) {
      return { settings: createDefaultSettings(), notice: null }
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) {
      return fallback()
    }

    const settings: AppSettings = {
      categoryVisibility: loadCategoryVisibility(parsed.categoryVisibility),
      hiddenTopicIds: loadStringArray(parsed.hiddenTopicIds),
      customTopics: loadCustomTopics(parsed.customTopics),
      lastPlayerNames: loadStringArray(parsed.lastPlayerNames).slice(0, MAX_PLAYERS).map((name) => limitPlayerName(name.trim())),
    }
    const namesChanged = parsed.lastPlayerNames !== undefined && !sameStrings(parsed.lastPlayerNames, settings.lastPlayerNames)
    const hiddenChanged = parsed.hiddenTopicIds !== undefined && !sameStrings(parsed.hiddenTopicIds, settings.hiddenTopicIds)
    const topicsChanged = parsed.customTopics !== undefined && (!Array.isArray(parsed.customTopics)
      || parsed.customTopics.length !== settings.customTopics.length
      || parsed.customTopics.some((item, index) => {
        const normalized = settings.customTopics[index]
        return !isRecord(item) || item.id !== normalized.id || item.text !== normalized.text
          || item.category !== normalized.category || item.isBuiltin !== normalized.isBuiltin
      }))
    const visibility = parsed.categoryVisibility
    const categoriesChanged = visibility !== undefined && (!isRecord(visibility)
      || topicCategories.some((category) => visibility[category] !== undefined && typeof visibility[category] !== 'boolean'))
    const changes = [
      namesChanged ? '人数は8人まで・名前は24文字までに調整しました' : '',
      topicsChanged || hiddenChanged || categoriesChanged ? '読み込めないお題設定を調整しました' : '',
    ].filter(Boolean)
    return { settings, notice: changes.length > 0 ? `${changes.join('。')}。端末の保存内容はまだ変更していません。` : null }
  } catch {
    return fallback()
  }
}

/** 保存値が文字列配列としてそのまま復元できたか、並びも含めて比較する。 */
function sameStrings(value: unknown, strings: string[]): boolean {
  return Array.isArray(value) && value.length === strings.length && value.every((item, index) => item === strings[index])
}

/** localStorage へ設定を保存し、保存失敗時は UI 表示用メッセージを返します。 */
export function saveSettings(settings: AppSettings): SaveResult {
  try {
    localStorage.setItem(storageKey, JSON.stringify(settings))
    return { ok: true }
  } catch {
    return {
      ok: false,
      message: '設定を保存できませんでした。この端末では今回のプレイ中だけ反映します。',
    }
  }
}
