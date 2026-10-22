<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { parseDocx } from '../core/docx'
import { createObjectUrlPool } from '../core/format'
import { parseOdt } from '../core/odf'
import { printHtml } from '../core/print'
import { parseRtf } from '../core/rtf'
import { ZipArchive } from '../core/zip'
import { createZipMediaResolver } from '../core/zip-media'
import { toRendererError } from '../core/errors'
import { defaultCapabilities } from '../core/capabilities'
import type { FileViewerRendererProps } from '../types'

defineOptions({
  name: 'WFileViewerDocxRenderer',
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
  'page-change': [page: number]
}>()

const pages = ref<string[]>([])
let reportedPage = 1
const loaded = ref(false)
const scrollRef = ref<HTMLElement>()
const urls = createObjectUrlPool()
let disposed = false

const pageSize = computed(() => props.options.office?.pageSize ?? 'a4')
const pageWidth = computed(() => (pageSize.value === 'letter' ? 816 : 794))
const pageMinHeight = computed(() => (pageSize.value === 'letter' ? 1056 : 1123))

function decodeRtf(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1252', { fatal: false }).decode(buffer)
  }
}

async function parse(): Promise<void> {
  let parsed = false
  try {
    if (props.source.extension === 'rtf') {
      const buffer = await props.source.getArrayBuffer()
      if (disposed) return
      pages.value = [parseRtf(decodeRtf(buffer))]
      loaded.value = true
      emit('ready', {
        pageCount: 1,
        capabilities: defaultCapabilities(props.kind),
      })
      parsed = true
    } else {
      const zip = await ZipArchive.open(await props.source.getArrayBuffer())
      const resolveMedia = createZipMediaResolver(zip, urls, () => disposed).resolve

      const isOdt = props.source.extension === 'odt'
      const result = isOdt
        ? await parseOdt(zip, resolveMedia, props.locale)
        : await parseDocx(zip, { maxPages: props.options.office?.maxPages }, resolveMedia)
      if (disposed) return

      pages.value = result.pages
      loaded.value = true
      emit('ready', {
        pageCount: pages.value.length,
        capabilities: defaultCapabilities(props.kind),
      })
      parsed = true
    }
  } catch (cause) {
    if (disposed) return
    loaded.value = true
    emit('error', toRendererError(props.messages.renderers.docx.parseError, cause))
  }

  if (parsed) {
    await nextTick()
    scrollToPage(props.page)
  }
}

function scrollToPage(page: number): void {
  const container = scrollRef.value
  if (!container) return
  const target = container.querySelector<HTMLElement>(`[data-page="${page}"]`)
  if (!target) return

  // View updates are best-effort and must never turn a successful parse into
  // a renderer error (jsdom and some embedded browsers lack scrollTo).
  try {
    const offset =
      target.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      16
    const top = Math.max(0, offset)
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top, behavior: 'smooth' })
    } else {
      container.scrollTop = top
    }
  } catch {
    // Ignore environments without layout support.
  }
}

function print(): boolean {
  const body = pages.value
    .map(
      (page) =>
        `<article class="w-file-viewer__docx-page" style="width:${pageWidth.value}px;min-height:${pageMinHeight.value}px;">${page}</article>`,
    )
    .join('')
  return printHtml(
    props.source.name,
    body,
    `.w-file-viewer__docx-page { width:${pageWidth.value}px; min-height:${pageMinHeight.value}px; padding:62px 64px; background:#fff; margin:0 auto 18px; font-size:14px; line-height:1.5; }
     .w-file-viewer__docx-table { width:100%; border-collapse:collapse; margin:10px 0; }
     .w-file-viewer__docx-table td { border:1px solid #cbd5e1; padding:5px 7px; vertical-align:top; }
     .w-file-viewer__docx-image img { max-width:100%; height:auto; }
     .w-file-viewer__docx-heading { font-weight:700; margin:1em 0 .5em; }
     .w-file-viewer__docx-heading--1 { font-size:28px; } .w-file-viewer__docx-heading--2 { font-size:24px; }
     .w-file-viewer__docx-heading--3 { font-size:20px; } .w-file-viewer__docx-heading--4 { font-size:18px; }
     .w-file-viewer__docx-heading--5 { font-size:16px; } .w-file-viewer__docx-heading--6 { font-size:14px; }`,
  )
}

function handleScroll(): void {
  const container = scrollRef.value
  if (!container) return

  const pageElements = Array.from(
    container.querySelectorAll<HTMLElement>('.w-file-viewer__docx-page'),
  )
  if (pageElements.length === 0) return

  const containerTop = container.getBoundingClientRect().top
  let current = 1
  for (let index = 0; index < pageElements.length; index += 1) {
    if (pageElements[index]!.getBoundingClientRect().top - containerTop > 24) break
    current = index + 1
  }

  if (current === reportedPage) return
  reportedPage = current
  emit('page-change', current)
}

defineExpose({ print })

watch(
  () => props.page,
  (page) => scrollToPage(page),
)

onMounted(parse)
onBeforeUnmount(() => {
  disposed = true
  urls.clear()
})
</script>

<template>
  <div v-if="loaded && pages.length === 0" class="w-file-viewer__placeholder">
    <p>{{ messages.renderers.docx.empty }}</p>
  </div>
  <div
    v-else
    ref="scrollRef"
    class="w-file-viewer__docx-scroll"
    tabindex="0"
    @scroll.passive="handleScroll"
  >
    <div class="w-file-viewer__docx-pages" :style="{ zoom: String(zoom) }">
      <article
        v-for="(page, index) in pages"
        :key="index"
        class="w-file-viewer__docx-page"
        :data-page="index + 1"
        :style="{ width: `${pageWidth}px`, minHeight: `${pageMinHeight}px` }"
        v-html="page"
      />
    </div>
  </div>
</template>
