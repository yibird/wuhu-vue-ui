import type { HighlightSegment } from './types'

export interface BuildSegmentsOptions {
  text?: string
  keywords?: string | string[]
  caseSensitive?: boolean
  wholeWord?: boolean
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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
  keywords: string[],
  caseSensitive: boolean,
): HighlightSegment[] {
  const flags = `g${caseSensitive ? '' : 'i'}u`
  // Match each keyword independently so a boundary failure on a longer
  // candidate can still fall back to a shorter valid keyword at the same
  // position.
  const matchers = keywords.map((keyword) => ({
    keyword,
    matcher: new RegExp(escapeRegExp(keyword), flags),
  }))
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
          match.index === 0 || !blocksBoundary(sourceText[match.index - 1], text)
        const endsAtBoundary =
          match.index + text.length >= sourceText.length ||
          !blocksBoundary(sourceText[match.index + text.length], text)

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

  if (options.wholeWord) {
    return buildWholeWordSegments(sourceText, keywords, options.caseSensitive ?? false)
  }

  const lookup = new Map<string, string>()
  for (const keyword of keywords) {
    lookup.set(options.caseSensitive ? keyword : keyword.toLowerCase(), keyword)
  }

  const alternation = keywords.map(escapeRegExp).join('|')
  const matcher = new RegExp(`(?:${alternation})`, `g${options.caseSensitive ? '' : 'i'}u`)
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
      keyword: lookup.get(options.caseSensitive ? matchedText : matchedText.toLowerCase()),
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
