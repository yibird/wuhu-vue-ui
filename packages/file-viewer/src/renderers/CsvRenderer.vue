<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { parseCsv } from '../core/csv'
import { escapeHtml, formatBytes } from '../core/format'
import { printHtml } from '../core/print'
import { formatFileViewerMessage } from '../i18n'
import { defaultCapabilities } from '../core/capabilities'
import type { FileViewerRendererProps } from '../types'
import { useTextSource } from './useTextSource'

defineOptions({
  name: 'WFileViewerCsvRenderer',
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

const rowLimitOverride = ref<number | null>(null)
const limit = computed(() => rowLimitOverride.value ?? props.options.csv?.maxRows ?? 5000)
const maxBytes = computed(() => props.options.csv?.maxBytes ?? 8 * 1024 * 1024)
const {
  text: raw,
  truncated: sizeTruncated,
  loaded,
  load,
  loadFull,
} = useTextSource(props, {
  maxBytes: () => maxBytes.value,
  errorMessage: () => props.messages.renderers.csv.readError,
  onReady: () =>
    emit('ready', {
      pageCount: 0,
      capabilities: defaultCapabilities(props.kind),
    }),
  onError: (error) => emit('error', error),
})

const delimiter = computed(() => {
  if (props.options.csv?.delimiter) return props.options.csv.delimiter
  return props.source.extension === 'tsv' ? '\t' : undefined
})

const maxColumns = computed(() => Math.max(1, props.options.csv?.maxColumns ?? 200))

const table = computed(() => {
  const parsed = parseCsv(raw.value, {
    delimiter: delimiter.value,
    maxRows: limit.value,
  })

  return {
    ...parsed,
    rows: parsed.rows.map((row) =>
      row.length > maxColumns.value ? row.slice(0, maxColumns.value) : row,
    ),
  }
})

const header = computed(() => table.value.rows[0] ?? [])
const body = computed(() => table.value.rows.slice(1))
const columnCount = computed(() =>
  table.value.rows.reduce((maximum, row) => Math.max(maximum, row.length), 0),
)
const rowsLabel = computed(() =>
  formatFileViewerMessage(props.messages.renderers.csv.rows, {
    count: body.value.length,
  }),
)
const sizeNotice = computed(() =>
  sizeTruncated.value
    ? formatFileViewerMessage(props.messages.viewer.truncatedHint, {
        size: formatBytes(maxBytes.value, props.locale) ?? '',
      })
    : '',
)

function isNumeric(value: string): boolean {
  return /^\s*-?[\d,.]+%?\s*$/.test(value)
}

function showMore(): void {
  rowLimitOverride.value = limit.value + 1000
}

function print(): boolean {
  const rowsHtml = table.value.rows
    .map(
      (row, index) =>
        `<tr>${row
          .map((cell) =>
            index === 0 ? `<th>${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('')
  return printHtml(props.source.name, `<table>${rowsHtml}</table>`)
}

defineExpose({ print })

onMounted(load)
</script>

<template>
  <div class="w-file-viewer__csv">
    <div class="w-file-viewer__renderer-toolbar">
      <span class="w-file-viewer__renderer-label">{{ rowsLabel }}</span>
      <span class="w-file-viewer__badge">{{ source.extension.toUpperCase() }}</span>
    </div>

    <div v-if="sizeNotice" class="w-file-viewer__notice">
      <div>
        <strong>{{ messages.viewer.truncated }}</strong>
        <span>{{ sizeNotice }}</span>
      </div>
      <button type="button" class="w-file-viewer__link-button" @click="loadFull">
        {{ messages.viewer.loadFull }}
      </button>
    </div>

    <div v-if="loaded && table.rows.length === 0" class="w-file-viewer__placeholder is-compact">
      <p>{{ messages.renderers.csv.empty }}</p>
    </div>
    <div v-else class="w-file-viewer__table-wrap">
      <table class="w-file-viewer__csv-table">
        <thead>
          <tr>
            <th class="w-file-viewer__row-number">#</th>
            <th v-for="(cell, index) in header" :key="index">{{ cell }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in body" :key="rowIndex">
            <td class="w-file-viewer__row-number">{{ rowIndex + 2 }}</td>
            <td
              v-for="columnIndex in columnCount"
              :key="columnIndex"
              :class="{ 'is-number': isNumeric(row[columnIndex - 1] ?? '') }"
            >
              {{ row[columnIndex - 1] ?? '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="table.truncated && !sizeTruncated" class="w-file-viewer__load-more">
      <button type="button" class="w-file-viewer__button" @click="showMore">
        {{ messages.renderers.csv.loadMore }}
      </button>
    </div>
  </div>
</template>
