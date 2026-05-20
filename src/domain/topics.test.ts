import { describe, expect, it } from 'vitest'
import type { Topic } from './types'
import { builtInTopics, getEnabledTopics, pickTopic } from './topics'

describe('builtInTopics', () => {
  it('contains 90 built-in topics split evenly across three categories', () => {
    expect(builtInTopics).toHaveLength(90)
    expect(builtInTopics.filter((topic) => topic.category === 'everyone')).toHaveLength(30)
    expect(builtInTopics.filter((topic) => topic.category === 'friends')).toHaveLength(30)
    expect(builtInTopics.filter((topic) => topic.category === 'drinks')).toHaveLength(30)
  })

  it('uses stable unique ids', () => {
    expect(new Set(builtInTopics.map((topic) => topic.id)).size).toBe(90)
  })
})

describe('getEnabledTopics', () => {
  it('filters by category and topic visibility', () => {
    const topics = getEnabledTopics({
      categoryVisibility: { everyone: true, friends: false, drinks: false },
      hiddenTopicIds: new Set(['everyone-001']),
      customTopics: [],
    })

    expect(topics.every((topic) => topic.category === 'everyone')).toBe(true)
    expect(topics.some((topic) => topic.id === 'everyone-001')).toBe(false)
  })

  it('includes a custom topic when its category is visible', () => {
    const customTopic: Topic = {
      id: 'custom-001',
      text: '追加したお題',
      category: 'friends',
      isBuiltin: false,
    }

    const topics = getEnabledTopics({
      categoryVisibility: { everyone: false, friends: true, drinks: false },
      hiddenTopicIds: new Set(),
      customTopics: [customTopic],
    })

    expect(topics).toContain(customTopic)
  })

  it('excludes a custom topic when its id is hidden', () => {
    const customTopic: Topic = {
      id: 'custom-001',
      text: '追加したお題',
      category: 'friends',
      isBuiltin: false,
    }

    const topics = getEnabledTopics({
      categoryVisibility: { everyone: false, friends: true, drinks: false },
      hiddenTopicIds: new Set([customTopic.id]),
      customTopics: [customTopic],
    })

    expect(topics).not.toContain(customTopic)
  })
})

describe('pickTopic', () => {
  it('picks a deterministic topic from the supplied random value', () => {
    const topics = builtInTopics.slice(0, 10)
    expect(pickTopic(topics, 0.21)).toBe(topics[2])
  })

  it('throws when no topics are supplied', () => {
    expect(() => pickTopic([])).toThrow('選択可能なお題がありません')
  })

  it('returns the last topic when the supplied random value is 1', () => {
    const topics = builtInTopics.slice(0, 10)
    expect(pickTopic(topics, 1)).toBe(topics[9])
  })

  it('throws when the supplied random value is invalid', () => {
    const topics = builtInTopics.slice(0, 10)
    const invalidRandomValues = [-0.01, 1.01, Number.NaN, Infinity]

    for (const randomValue of invalidRandomValues) {
      expect(() => pickTopic(topics, randomValue)).toThrow('乱数値は0以上1以下で指定してください')
    }
  })
})
