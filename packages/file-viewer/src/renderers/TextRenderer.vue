<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { detectCodeLanguage } from '../core/code'
import { escapeHtml, formatBytes } from '../core/format'
import { formatJson } from '../core/json'
import { printHtml } from '../core/print'
import { formatXml } from '../core/text'
import { formatFileViewerMessage } from '../i18n'
import { defaultCapabilities } from '../core/capabilities'
import type { FileViewerRendererProps } from '../types'
import CodeBlock from './CodeBlock.vue'
import { useCopy } from '@wuhu-vue-ui/core'
import { useTextSource } from './useTextSource'

defineOptions({
  name: 'WFileViewerTextRenderer',
})

const props = defineProps<FileViewerRendererProps>()

const emit = defineEmits<{
  ready: [
    payload: {
      pageCount: number
      capabilities: { zoom: boolean; rotate: boolean; paged: boolean; print: boolean }
    },
  ]
  error: [error: Error]
}>()

const lineLimit = ref(5000)
const wrap = ref(props.options.text?.wrap ?? props.kind === 'text')
const lineNumbers = ref(props.options.text?.lineNumbers ?? props.kind !== 'text')
const { copied, copy } = useCopy()

const defaultMaxBytes = computed(() => props.options.text?.maxBytes ?? 4 * 1024 * 1024)
const {
  text: rawText,
  truncated: sizeTruncated,
  loaded,
  load: loadText,
  loadFull: loadFullText,
} = useTextSource(props, {
  maxBytes: () => defaultMaxBytes.value,
  errorMessage: () => props.messages.renderers.code.readError,
  onReady: () =>
    emit('ready', {
      pageCount: 0,
      capabilities: defaultCapabilities(props.kind),
    }),
  onError: (error) => emit('error', error),
})
const language = computed(() => {
  if (props.kind === 'json') return 'json'
  if (props.kind === 'xml') return 'xml'
  return detectCodeLanguage(props.source.name)
})

const jsonResult = computed(() => (props.kind === 'json' ? formatJson(rawText.value) : undefined))
const jsonFailed = computed(
  () => !sizeTruncated.value && Boolean(jsonResult.value && !jsonResult.value.ok),
)

const preparedText = computed(() => {
  if (props.kind === 'json' && jsonResult.value?.ok) return jsonResult.value.text
  if (props.kind === 'xml') {
    const formatted = formatXml(rawText.value)
    if (formatted) return formatted
  }
  return rawText.value
})

const allLines = computed(() => preparedText.value.split(/\r?\n/))
const lineTruncated = computed(() => allLines.value.length > lineLimit.value)
const visibleText = computed(() => {
  if (!lineTruncated.value) return preparedText.value
  return allLines.value.slice(0, lineLimit.value).join('\n')
})
const cannotPreview = computed(() => loaded.value && preparedText.value.length === 0)

const sizeNotice = computed(() => {
  if (!sizeTruncated.value) return ''
  return formatFileViewerMessage(props.messages.viewer.truncatedHint, {
    size: formatBytes(defaultMaxBytes.value, props.locale) ?? '',
  })
})

const limitNotice = computed(() => {
  if (!lineTruncated.value) return ''
  return formatFileViewerMessage(props.messages.renderers.code.lineLimit, {
    count: lineLimit.value,
  })
})

async function loadFull(): Promise<void> {
  if (sizeTruncated.value) await loadFullText()
  lineLimit.value = Number.POSITIVE_INFINITY
}

function print(): boolean {
  return printHtml(props.source.name, `<pre>${escapeHtml(preparedText.value)}</pre>`)
}

defineExpose({ print })

onMounted(loadText)
</script>

<template>
  <div class="w-file-viewer__text">
    <div class="w-file-viewer__renderer-toolbar">
      <span class="w-file-viewer__renderer-label">{{ source.name }}</span>
      <div class="w-file-viewer__renderer-actions">
        <button
          type="button"
          class="w-file-viewer__icon-button"
          :title="messages.renderers.code.wrap"
          :aria-label="messages.renderers.code.wrap"
          :class="{ 'is-active': wrap }"
          @click="wrap = !wrap"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 5h14M3 9h10a3 3 0 0 1 0 6h-2m1.5-2.5L11 15l1.5 1.5M3 13h5M3 17h5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="w-file-viewer__icon-button"
          :title="messages.renderers.code.lineNumbers"
          :aria-label="messages.renderers.code.lineNumbers"
          :class="{ 'is-active': lineNumbers }"
          @click="lineNumbers = !lineNumbers"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M6 4v12M3 6l1.5-1M3 10h1.5M3 14.5h1.5M9 5h8M9 10h8M9 15h8"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="w-file-viewer__icon-button"
          :title="copied ? messages.renderers.code.copied : messages.renderers.code.copy"
          :aria-label="copied ? messages.renderers.code.copied : messages.renderers.code.copy"
          @click="copy(preparedText)"
        >
          <svg v-if="copied" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="m4 10 4 4 8-8"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg v-else viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect
              x="7"
              y="7"
              width="9"
              height="9"
              rx="1.5"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-7A1.5 1.5 0 0 0 3 5.5v7A1.5 1.5 0 0 0 4.5 14H6"
              stroke="currentColor"
              stroke-width="1.5"
            />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="sizeNotice || limitNotice || jsonFailed" class="w-file-viewer__notices">
      <div v-if="sizeNotice || limitNotice" class="w-file-viewer__notice">
        <div>
          <strong>{{ messages.viewer.truncated }}</strong>
          <span>{{ sizeNotice || limitNotice }}</span>
        </div>
        <button type="button" class="w-file-viewer__link-button" @click="loadFull">
          {{ messages.viewer.loadFull }}
        </button>
      </div>
      <div v-if="jsonFailed" class="w-file-viewer__notice is-warning">
        <span>{{ messages.renderers.json.formatError }}</span>
      </div>
    </div>

    <div v-if="cannotPreview" class="w-file-viewer__placeholder is-compact">
      <p>{{ messages.renderers.code.empty }}</p>
    </div>
    <div v-else-if="language" class="w-file-viewer__code-shell" tabindex="0">
      <CodeBlock
        :code="visibleText"
        :language="language"
        :line-numbers="lineNumbers"
        :wrap="wrap"
      />
    </div>
  </div>
</template>
