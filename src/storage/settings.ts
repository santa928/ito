import type { Topic, TopicCategory } from '../domain/types'

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

  return value.filter((item): item is Topic => {
    return (
      isRecord(item) &&
      typeof item.id === 'string' &&
      typeof item.text === 'string' &&
      isTopicCategory(item.category) &&
      typeof item.isBuiltin === 'boolean'
    )
  })
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

/** localStorage から保存済み設定を読み込み、欠損や破損時は既定値に戻します。 */
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === null) {
      return createDefaultSettings()
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) {
      return createDefaultSettings()
    }

    return {
      categoryVisibility: loadCategoryVisibility(parsed.categoryVisibility),
      hiddenTopicIds: loadStringArray(parsed.hiddenTopicIds),
      customTopics: loadCustomTopics(parsed.customTopics),
      lastPlayerNames: loadStringArray(parsed.lastPlayerNames),
    }
  } catch {
    return createDefaultSettings()
  }
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
