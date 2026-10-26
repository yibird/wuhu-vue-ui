<script setup lang="ts">
import { computed } from 'vue'
import { buildSegments } from './segments'
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

const segments = computed<HighlightSegment[]>(() =>
  buildSegments({
    text: props.text,
    keywords: props.keywords,
    caseSensitive: props.caseSensitive,
    wholeWord: props.wholeWord,
  }),
)

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
