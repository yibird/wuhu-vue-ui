import { describe, expect, it } from 'vite-plus/test'
import { buildSegments, normalizeKeywords } from '../segments'

describe('normalizeKeywords', () => {
  it('filters blanks, de-duplicates and sorts longest first', () => {
    expect(normalizeKeywords(['Vue', ' ', 'Vue UI', 'Vue', ''])).toEqual(['Vue UI', 'Vue'])
  })

  it('accepts a single keyword and an omitted value', () => {
    expect(normalizeKeywords('Vue')).toEqual(['Vue'])
    expect(normalizeKeywords(undefined)).toEqual([])
  })
})

describe('buildSegments', () => {
  it('returns an empty list for empty input', () => {
    expect(buildSegments()).toEqual([])
    expect(buildSegments({ text: '', keywords: ['Vue'] })).toEqual([])
  })

  it('returns the whole text as unmatched without keywords', () => {
    expect(buildSegments({ text: 'hello' })).toEqual([{ text: 'hello', matched: false }])
  })

  it('splits multiple keywords and keeps the source order', () => {
    expect(
      buildSegments({
        text: 'Vue makes interfaces fun',
        keywords: ['interfaces', 'Vue'],
      }),
    ).toEqual([
      { text: 'Vue', matched: true, keyword: 'Vue' },
      { text: ' makes ', matched: false },
      { text: 'interfaces', matched: true, keyword: 'interfaces' },
      { text: ' fun', matched: false },
    ])
  })

  it('prefers the longest matching keyword', () => {
    expect(buildSegments({ text: 'Use Vue UI now', keywords: ['Vue', 'Vue UI'] })).toEqual([
      { text: 'Use ', matched: false },
      { text: 'Vue UI', matched: true, keyword: 'Vue UI' },
      { text: ' now', matched: false },
    ])
  })

  it('matches case-insensitively by default', () => {
    expect(buildSegments({ text: 'VUE vue', keywords: ['Vue'] })).toEqual([
      { text: 'VUE', matched: true, keyword: 'Vue' },
      { text: ' ', matched: false },
      { text: 'vue', matched: true, keyword: 'Vue' },
    ])
  })

  it('respects case sensitivity', () => {
    expect(buildSegments({ text: 'vue Vue', keywords: ['Vue'], caseSensitive: true })).toEqual([
      { text: 'vue ', matched: false },
      { text: 'Vue', matched: true, keyword: 'Vue' },
    ])
  })

  it('supports Unicode-aware whole-word matching', () => {
    expect(buildSegments({ text: 'Vue Vuex revue', keywords: ['Vue'], wholeWord: true })).toEqual([
      { text: 'Vue', matched: true, keyword: 'Vue' },
      { text: ' Vuex revue', matched: false },
    ])
  })

  it('matches CJK keywords in whole-word mode without space boundaries', () => {
    expect(
      buildSegments({ text: '每个组件独立发布', keywords: ['组件'], wholeWord: true }),
    ).toEqual([
      { text: '每个', matched: false },
      { text: '组件', matched: true, keyword: '组件' },
      { text: '独立发布', matched: false },
    ])
  })

  it('treats supplementary Unicode letters as word-boundary characters', () => {
    expect(buildSegments({ text: '𐐀Vue Vue𐐀', keywords: ['Vue'], wholeWord: true })).toEqual([
      { text: '𐐀Vue Vue𐐀', matched: false },
    ])
  })

  it('does not pair an unpaired low surrogate with a preceding letter', () => {
    // The character left of `Vue` is the lone low surrogate, not the `a`.
    expect(buildSegments({ text: 'a\uDC00Vue', keywords: ['Vue'], wholeWord: true })).toEqual([
      { text: 'a\uDC00', matched: false },
      { text: 'Vue', matched: true, keyword: 'Vue' },
    ])
  })

  it('falls back to a shorter keyword when a longer candidate fails the boundary', () => {
    expect(buildSegments({ text: 'ab cx', keywords: ['ab c', 'ab'], wholeWord: true })).toEqual([
      { text: 'ab', matched: true, keyword: 'ab' },
      { text: ' cx', matched: false },
    ])
  })

  it('does not highlight whitespace-only keywords', () => {
    expect(buildSegments({ text: 'hello world', keywords: [' ', 'world'] })).toEqual([
      { text: 'hello ', matched: false },
      { text: 'world', matched: true, keyword: 'world' },
    ])
  })

  it('treats regex metacharacters as literal text', () => {
    expect(buildSegments({ text: 'a+b a*b', keywords: ['a+b'] })).toEqual([
      { text: 'a+b', matched: true, keyword: 'a+b' },
      { text: ' a*b', matched: false },
    ])
  })

  it('reuses cached matchers without leaking lastIndex between calls', () => {
    const options = { text: 'Vue and Vue', keywords: ['Vue'] }

    expect(buildSegments(options)).toEqual(buildSegments(options))
    expect(buildSegments(options).filter((segment) => segment.matched)).toHaveLength(2)
  })

  it('reuses cached whole-word matchers between calls', () => {
    const options = { text: 'Vue Vuex Vue', keywords: ['Vue'], wholeWord: true }

    expect(buildSegments(options)).toEqual(buildSegments(options))
    expect(buildSegments(options).filter((segment) => segment.matched)).toHaveLength(2)
  })
})
