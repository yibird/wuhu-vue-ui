<script setup lang="ts">
import { computed } from 'vue'
import type { HighlightProps, HighlightSegment, HighlightSlotProps } from './types'

defineOptions({
  name: 'WHighlight',
})

const props = withDefaults(defineProps<HighlightProps>(), {
  text: '',
  keywords: () => [],
  caseSensitive: false,
  wholeWord: false,
  tag: 'mark',
})

defineSlots<{
  highlight?: (props: HighlightSlotProps) => unknown
}>()

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

const keywords = computed(() => {
  const values = Array.isArray(props.keywords) ? props.keywords : [props.keywords]
  const unique = new Set<string>()

  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) unique.add(value)
  }

  return [...unique].sort((a, b) => b.length - a.length)
})

const segments = computed<HighlightSegment[]>(() => {
  const sourceText = props.text ?? ''
  if (!sourceText || keywords.value.length === 0) {
    return sourceText ? [{ text: sourceText, matched: false }] : []
  }

  const lookup = new Map<string, string>()
  for (const keyword of keywords.value) {
    lookup.set(props.caseSensitive ? keyword : keyword.toLowerCase(), keyword)
  }

  const flags = `g${props.caseSensitive ? '' : 'i'}u`

  if (props.wholeWord) {
    // Match each keyword independently so a boundary failure on a longer
    // candidate can still fall back to a shorter valid keyword at the same
    // position.
    const matchers = keywords.value.map((keyword) => ({
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

  const alternation = keywords.value.map(escapeRegExp).join('|')
  let matcher: RegExp

  try {
    matcher = new RegExp(`(?:${alternation})`, flags)
  } catch {
    return [{ text: sourceText, matched: false }]
  }

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
      keyword: lookup.get(props.caseSensitive ? matchedText : matchedText.toLowerCase()),
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
})

defineExpose({ segments })
</script>

<template>
  <span class="w-highlight">
    <template v-for="(segment, index) in segments" :key="`${index}-${segment.text}`">
      <slot
        v-if="segment.matched"
        name="highlight"
        :text="segment.text"
        :keyword="segment.keyword"
        :index="index"
        :segment="segment"
      >
        <component
          :is="tag"
          class="w-highlight__mark"
          :class="highlightClass"
          :style="highlightStyle"
        >
          {{ segment.text }}
        </component>
      </slot>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>
