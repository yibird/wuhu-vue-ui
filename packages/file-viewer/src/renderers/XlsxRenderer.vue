<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { escapeHtml } from '../core/format'
import { parseOds, type OdfSheet } from '../core/odf'
import { printHtml } from '../core/print'
import { parseXlsx, type XlsxSheet } from '../core/xlsx'
import { ZipArchive } from '../core/zip'
import { formatFileViewerMessage } from '../i18n'
import { toRendererError } from '../core/errors'
import { defaultCapabilities } from '../core/capabilities'
import type { FileViewerRendererProps } from '../types'

const props = defineProps<FileViewerRendererProps>()

const emit = defineEmits<{
  ready: [
    payload: {
      pageCount: number
      capabilities: { zoom: boolean; rotate: boolean; paged: boolean; print: boolean }
    },
  ]
  error: [error: Error]
  'page-change': [page: number]
}>()

const sheets = ref<Array<XlsxSheet | OdfSheet>>([])
const loaded = ref(false)
let disposed = false
const showSheetTabs = computed(() => props.options.office?.showSheetTabs !== false)

const activeIndex = computed(() => {
  if (sheets.value.length === 0) return 0
  return Math.min(Math.max(0, props.page - 1), sheets.value.length - 1)
})
const activeSheet = computed(() => sheets.value[activeIndex.value])

async function parse(): Promise<void> {
  try {
    const zip = await ZipArchive.open(await props.source.getArrayBuffer())
    const isOds = props.source.extension === 'ods'
    const officeOptions = props.options.office
    const result = isOds
      ? await parseOds(zip, {
          maxRows: officeOptions?.maxRows,
          maxColumns: officeOptions?.maxColumns,
          showGrid: officeOptions?.showGrid,
          locale: props.locale,
        })
      : await parseXlsx(zip, {
          maxRows: officeOptions?.maxRows,
          maxColumns: officeOptions?.maxColumns,
          showGrid: officeOptions?.showGrid,
          locale: props.locale,
        })

    if (disposed) return
    const maxSheets = officeOptions?.maxPages ?? 300
    sheets.value = result.sheets.slice(0, Math.max(1, maxSheets))
    loaded.value = true
    emit('ready', {
      pageCount: sheets.value.length,
      capabilities: defaultCapabilities(props.kind),
    })
  } catch (cause) {
    if (disposed) return
    loaded.value = true
    emit('error', toRendererError(props.messages.renderers.xlsx.parseError, cause))
  }
}

function selectSheet(index: number) {
  if (index === activeIndex.value) return
  emit('page-change', index + 1)
}

function print(): boolean {
  const body = sheets.value
    .map(
      (sheet) =>
        `<section style="margin-bottom:24px;"><h2 style="font-size:16px;margin:0 0 8px;">${escapeHtml(
          sheet.name,
        )}</h2>${sheet.html}</section>`,
    )
    .join('')
  return printHtml(
    props.source.name,
    body,
    `.w-file-viewer__xlsx-table { width:auto; border-collapse:collapse; table-layout:auto; }
     .w-file-viewer__xlsx-table td { padding:4px 7px; border:1px solid #d8dee9; vertical-align:top; white-space:pre-wrap; }`,
  )
}

defineExpose({ print })

onMounted(parse)
onBeforeUnmount(() => {
  disposed = true
})
</script>

<template>
  <div class="w-file-viewer__xlsx">
    <div v-if="loaded && sheets.length === 0" class="w-file-viewer__placeholder">
      <p>{{ messages.renderers.xlsx.empty }}</p>
    </div>
    <template v-else>
      <div class="w-file-viewer__xlsx-meta">
        <strong>{{ activeSheet?.name ?? '' }}</strong>
        <span v-if="activeSheet">{{
          formatFileViewerMessage(messages.renderers.xlsx.rows, { count: activeSheet.rowCount })
        }}</span>
        <span v-if="activeSheet?.truncated" class="w-file-viewer__badge">{{
          messages.viewer.truncated
        }}</span>
      </div>
      <div class="w-file-viewer__sheet-scroll">
        <!--
          Controlled v-html exception: sheet markup is assembled by
          core/xlsx.ts and core/odf.ts only, with escapeHtml / escapeAttribute /
          sanitizeUrl applied to every text and URL. No authored markup is
          injected as-is.
        -->
        <div
          v-if="activeSheet"
          class="w-file-viewer__sheet-content"
          :style="{ zoom: String(zoom) }"
          v-html="activeSheet.html"
        />
      </div>
      <div
        v-if="showSheetTabs && sheets.length > 1"
        class="w-file-viewer__sheet-tabs"
        role="tablist"
      >
        <button
          v-for="(sheet, index) in sheets"
          :key="`${sheet.name}-${index}`"
          type="button"
          role="tab"
          class="w-file-viewer__sheet-tab"
          :class="{ 'is-active': index === activeIndex }"
          :aria-selected="index === activeIndex"
          @click="selectSheet(index)"
        >
          {{ sheet.name }}
        </button>
      </div>
    </template>
  </div>
</template>
