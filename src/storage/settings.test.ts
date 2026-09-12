import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, loadSettings, loadSettingsWithNotice, saveSettings } from './settings'

const storageKey = 'ito-like-party-card-game/settings/v1'

describe('settings storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('loads defaults when storage is empty', () => {
    expect(loadSettings()).toEqual(defaultSettings)
  })

  it('loads defaults when stored JSON is malformed', () => {
    localStorage.setItem(storageKey, '{')

    expect(loadSettings()).toEqual(defaultSettings)
  })

  it('loads defaults when stored JSON is not an object', () => {
    localStorage.setItem(storageKey, 'null')
    expect(loadSettings()).toEqual(defaultSettings)

    localStorage.setItem(storageKey, '1')
    expect(loadSettings()).toEqual(defaultSettings)
  })

  it('saves and loads settings', () => {
    const settings = {
      ...defaultSettings,
      lastPlayerNames: ['みほ', 'ゆうと'],
      hiddenTopicIds: ['everyone-001'],
    }

    expect(saveSettings(settings)).toEqual({ ok: true })
    expect(loadSettings()).toEqual(settings)
  })

  it('filters invalid array items and invalid custom topics', () => {
    const validCustomTopic = {
      id: 'custom-001',
      text: '好きな休日の過ごし方',
      category: 'friends',
      isBuiltin: false,
    }
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        categoryVisibility: {
          everyone: false,
          friends: 'yes',
          drinks: true,
          unknown: false,
        },
        hiddenTopicIds: ['everyone-001', null, 100, 'drinks-001'],
        lastPlayerNames: ['みほ', undefined, 42, 'ゆうと'],
        customTopics: [
          null,
          validCustomTopic,
          { ...validCustomTopic, id: 1 },
          { ...validCustomTopic, text: null },
          { ...validCustomTopic, category: 'unknown' },
          { ...validCustomTopic, isBuiltin: 'false' },
        ],
      }),
    )

    expect(loadSettings()).toEqual({
      categoryVisibility: {
        everyone: false,
        friends: defaultSettings.categoryVisibility.friends,
        drinks: true,
      },
      hiddenTopicIds: ['everyone-001', 'drinks-001'],
      customTopics: [validCustomTopic],
      lastPlayerNames: ['みほ', 'ゆうと'],
    })
  })

  it('does not expose shared default settings references when storage is empty', () => {
    const loadedSettings = loadSettings()
    loadedSettings.categoryVisibility.everyone = false
    loadedSettings.hiddenTopicIds.push('everyone-001')
    loadedSettings.customTopics.push({
      id: 'custom-001',
      text: '好きな色',
      category: 'everyone',
      isBuiltin: false,
    })
    loadedSettings.lastPlayerNames.push('みほ')

    expect(loadSettings()).toEqual(defaultSettings)
    expect(defaultSettings).toEqual({
      categoryVisibility: {
        everyone: true,
        friends: true,
        drinks: true,
      },
      hiddenTopicIds: [],
      customTopics: [],
      lastPlayerNames: [],
    })
  })

  it('loads defaults when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(loadSettings()).toEqual(defaultSettings)
  })

  it.each([0, 1, 9, 101])('limits %i restored players to at most eight', (count) => {
    const names = Array.from({ length: count }, (_, i) => `P${i}`)
    localStorage.setItem(storageKey, JSON.stringify({ lastPlayerNames: names }))

    expect(loadSettings().lastPlayerNames).toEqual(names.slice(0, 8))
  })

  it('keeps valid custom topics while rejecting empty and conflicting identities', () => {
    const valid = { id: 'custom-valid', text: '好きな色', category: 'everyone', isBuiltin: false }
    localStorage.setItem(storageKey, JSON.stringify({ customTopics: [
      valid,
      { ...valid, text: '重複ID' },
      { ...valid, id: 'everyone-001' },
      { ...valid, id: 'custom-empty', text: '   ' },
      { ...valid, id: '' },
      { ...valid, id: 'custom-wrong', isBuiltin: true },
    ] }))

    expect(loadSettings().customTopics).toEqual([valid, { ...valid, id: 'custom-wrong' }])
    expect(loadSettingsWithNotice().notice).toContain('お題設定を調整')
  })

  it('normalizes long Unicode names without overwriting the stored original on load', () => {
    const raw = JSON.stringify({ lastPlayerNames: ['  あき  ', '😀'.repeat(25)] })
    localStorage.setItem(storageKey, raw)
    expect(loadSettings().lastPlayerNames).toEqual(['あき', '😀'.repeat(24)])
    expect(localStorage.getItem(storageKey)).toBe(raw)
    expect(loadSettingsWithNotice().notice).toContain('名前は24文字まで')
  })

  it('returns a failure result when saving throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    expect(saveSettings(defaultSettings)).toEqual({
      ok: false,
      message: '設定を保存できませんでした。この端末では今回のプレイ中だけ反映します。',
    })
  })
})
