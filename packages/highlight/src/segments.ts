import type { HighlightSegment } from './types'

export interface BuildSegmentsOptions {
  text?: string
  keywords?: string | string[]
  caseSensitive?: boolean
  wholeWord?: boolean
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

interface WholeWordMatcher {
  keyword: string
  matcher: RegExp
}

interface PlainMatcher {
  matcher: RegExp
  lookup: Map<string, string>
}

const MATCHER_CACHE_LIMIT = 256
const wholeWordMatcherCache = new Map<string, WholeWordMatcher[]>()
const plainMatcherCache = new Map<string, PlainMatcher>()

/**
 * Compiled matchers depend only on the normalized keywords and matching
 * options, not on the text, so lists sharing keywords reuse one compilation.
 */
function matcherCacheKey(keywords: string[], caseSensitive: boolean): string {
  return `${caseSensitive ? 's' : 'i'}:${JSON.stringify(keywords)}`
}

function getWholeWordMatchers(keywords: string[], caseSensitive: boolean): WholeWordMatcher[] {
  const key = matcherCacheKey(keywords, caseSensitive)
  const cached = wholeWordMatcherCache.get(key)
  if (cached) return cached

  const flags = `g${caseSensitive ? '' : 'i'}u`
  // Match each keyword independently so a boundary failure on a longer
  // candidate can still fall back to a shorter valid keyword at the same
  // position.
  const matchers = keywords.map((keyword) => ({
    keyword,
    matcher: new RegExp(escapeRegExp(keyword), flags),
  }))

  if (wholeWordMatcherCache.size >= MATCHER_CACHE_LIMIT) wholeWordMatcherCache.clear()
  wholeWordMatcherCache.set(key, matchers)
  return matchers
}

function getPlainMatcher(keywords: string[], caseSensitive: boolean): PlainMatcher {
  const key = matcherCacheKey(keywords, caseSensitive)
  const cached = plainMatcherCache.get(key)
  if (cached) return cached

  const lookup = new Map<string, string>()
  for (const keyword of keywords) {
    lookup.set(caseSensitive ? keyword : keyword.toLowerCase(), keyword)
  }

  const alternation = keywords.map(escapeRegExp).join('|')
  const matcher = new RegExp(`(?:${alternation})`, `g${caseSensitive ? '' : 'i'}u`)
  const entry = { matcher, lookup }

  if (plainMatcherCache.size >= MATCHER_CACHE_LIMIT) plainMatcherCache.clear()
  plainMatcherCache.set(key, entry)
  return entry
}

const wordCharacter = /[\p{L}\p{N}_]/u
const cjkCharacter = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u

/**
 * CJK text is not segmented by spaces, so an adjacent CJK character must not
 * break a whole-word match for a CJK keyword (e.g. "组件" inside "每个组件独立
 * 发布"). Latin/digit neighbours still act as boundaries.
 */
function blocksBoundary(character: string | undefined, keyword: string): boolean {
  if (!character || !wordCharacter.test(character)) return false
  return !(cjkCharacter.test(keyword) && cjkCharacter.test(character))
}

function codePointBefore(value: string, index: number): string | undefined {
  if (index <= 0) return undefined

  const previous = value.charCodeAt(index - 1)
  // Combine a low surrogate with its preceding high surrogate only when the
  // pair is actually valid. An unpaired low surrogate is a non-word character
  // on its own, and pairing it with an unrelated earlier letter would wrongly
  // treat that letter as the adjacent character.
  if (previous >= 0xdc00 && previous <= 0xdfff && index > 1) {
    const high = value.charCodeAt(index - 2)
    if (high >= 0xd800 && high <= 0xdbff) return value.slice(index - 2, index)
  }

  return value[index - 1]
}

function codePointAt(value: string, index: number): string | undefined {
  const codePoint = value.codePointAt(index)
  return codePoint === undefined ? undefined : String.fromCodePoint(codePoint)
}

/**
 * Normalizes the keyword input: strings only, non-blank, de-duplicated and
 * sorted longest-first so overlapping matches favour the longest keyword.
 */
export function normalizeKeywords(keywords: string | string[] | undefined): string[] {
  const values = Array.isArray(keywords) ? keywords : keywords === undefined ? [] : [keywords]
  const unique = new Set<string>()

  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) unique.add(value)
  }

  return [...unique].sort((a, b) => b.length - a.length)
}

function buildWholeWordSegments(
  sourceText: string,
  matchers: WholeWordMatcher[],
): HighlightSegment[] {
  const result: HighlightSegment[] = []
  let cursor = 0

  while (cursor < sourceText.length) {
    let bestIndex = Number.POSITIVE_INFINITY
    let bestText = ''
    let bestKeyword = ''

    for (const { keyword, matcher } of matchers) {
      matcher.lastIndex = cursor
      let match: RegExpExecArray | null
      while ((match = matcher.exec(sourceText)) !== null) {
        const text = match[0]
        const startsAtBoundary =
          match.index === 0 || !blocksBoundary(codePointBefore(sourceText, match.index), text)
        const endsAtBoundary =
          match.index + text.length >= sourceText.length ||
          !blocksBoundary(codePointAt(sourceText, match.index + text.length), text)

        if (startsAtBoundary && endsAtBoundary) {
          if (
            match.index < bestIndex ||
            (match.index === bestIndex && text.length > bestText.length)
          ) {
            bestIndex = match.index
            bestText = text
            bestKeyword = keyword
          }
          break
        }

        if (text.length === 0) matcher.lastIndex += 1
      }
    }

    if (!Number.isFinite(bestIndex)) break

    if (bestIndex > cursor) {
      result.push({ text: sourceText.slice(cursor, bestIndex), matched: false })
    }
    result.push({ text: bestText, matched: true, keyword: bestKeyword })
    cursor = bestIndex + bestText.length
  }

  if (cursor < sourceText.length) {
    result.push({ text: sourceText.slice(cursor), matched: false })
  }
  return result
}

/**
 * Splits `text` into plain and matched segments. Pure: no Vue reactivity and
 * no DOM access, which keeps the matching rules easy to unit test.
 */
export function buildSegments(options: BuildSegmentsOptions = {}): HighlightSegment[] {
  const sourceText = options.text ?? ''
  const keywords = normalizeKeywords(options.keywords)

  if (!sourceText || keywords.length === 0) {
    return sourceText ? [{ text: sourceText, matched: false }] : []
  }

  const caseSensitive = options.caseSensitive ?? false

  if (options.wholeWord) {
    return buildWholeWordSegments(sourceText, getWholeWordMatchers(keywords, caseSensitive))
  }

  const { matcher, lookup } = getPlainMatcher(keywords, caseSensitive)
  matcher.lastIndex = 0
  const result: HighlightSegment[] = []
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = matcher.exec(sourceText)) !== null) {
    const matchedText = match[0]

    if (match.index > cursor) {
      result.push({ text: sourceText.slice(cursor, match.index), matched: false })
    }

    result.push({
      text: matchedText,
      matched: true,
      keyword: lookup.get(caseSensitive ? matchedText : matchedText.toLowerCase()),
    })

    cursor = match.index + matchedText.length

    // Defensive: a zero-length match can never be produced because empty
    // keywords are filtered, but this keeps the loop safe for future changes.
    if (matchedText.length === 0) matcher.lastIndex += 1
  }

  if (cursor < sourceText.length) {
    result.push({ text: sourceText.slice(cursor), matched: false })
  }

  return result
}
