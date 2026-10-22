<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { parseEpub, renderEpubChapter, type EpubBook } from '../core/epub'
import { createObjectUrlPool } from '../core/format'
import { printHtml } from '../core/print'
import { ZipArchive } from '../core/zip'
import { createZipMediaResolver } from '../core/zip-media'
import { formatFileViewerMessage } from '../i18n'
import { toRendererError } from '../core/errors'
import { defaultCapabilities } from '../core/capabilities'
import type { FileViewerRendererProps } from '../types'

defineOptions({
  name: 'WFileViewerEpubRenderer',
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

const book = ref<EpubBook>()
const chapterHtml = ref('')
const loaded = ref(false)
const chapterLoading = ref(false)
const chapterError = ref('')
const showContents = ref(false)
const scroller = ref<HTMLElement>()
const urls = createObjectUrlPool()
let chapterUrls: string[] = []
let zip: ZipArchive | undefined
let loadToken = 0
let disposed = false

const chapters = computed(() => book.value?.chapters ?? [])
const currentIndex = computed(() =>
  chapters.value.length === 0
    ? 0
    : Math.min(Math.max(0, props.page - 1), chapters.value.length - 1),
)
const currentTitle = computed(() => {
  const chapter = chapters.value[currentIndex.value]
  return (
    chapter?.title ??
    formatFileViewerMessage(props.messages.renderers.epub.chapter, {
      index: currentIndex.value + 1,
    })
  )
})

async function parse(): Promise<void> {
  try {
    zip = await ZipArchive.open(await props.source.getArrayBuffer())
    book.value = await parseEpub(zip)
    if (disposed) return
    loaded.value = true
    emit('ready', {
      pageCount: chapters.value.length,
      capabilities: defaultCapabilities(props.kind),
    })
    if (chapters.value.length > 0) await loadChapter(currentIndex.value)
  } catch (cause) {
    if (disposed) return
    loaded.value = true
    emit('error', toRendererError(props.messages.renderers.epub.parseError, cause))
  }
}

async function loadChapter(index: number): Promise<void> {
  if (!zip || !book.value || !chapters.value[index]) return
  const token = ++loadToken
  chapterLoading.value = true
  chapterError.value = ''
  try {
    const media = createZipMediaResolver(zip, urls, () => disposed || token !== loadToken)
    const html = await renderEpubChapter(zip, book.value, index, media.resolve)
    if (token !== loadToken) {
      for (const url of media.created) urls.revoke(url)
      return
    }
    for (const url of chapterUrls) urls.revoke(url)
    chapterUrls = media.created
    chapterHtml.value = html
    await nextTick()
    if (scroller.value) scroller.value.scrollTop = 0
  } catch (cause) {
    if (token !== loadToken) return
    chapterError.value =
      cause instanceof Error ? cause.message : props.messages.renderers.epub.parseError
    chapterHtml.value = ''
  } finally {
    if (token === loadToken) chapterLoading.value = false
  }
}

function goToChapter(index: number): void {
  const page = index + 1
  if (page === currentIndex.value + 1) {
    showContents.value = false
    return
  }
  showContents.value = false
  emit('page-change', page)
}

function handleContentClick(event: MouseEvent): void {
  const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-epub-page]')
  if (!target) return
  const page = Number.parseInt(target.dataset.epubPage ?? '', 10)
  if (Number.isFinite(page) && page > 0) {
    event.preventDefault()
    emit('page-change', page)
  }
}

function print(): boolean {
  if (!chapterHtml.value) return false
  return printHtml(
    `${props.source.name} — ${currentTitle.value}`,
    `<article class="w-file-viewer__epub-content">${chapterHtml.value}</article>`,
    `.w-file-viewer__epub-content { max-width: 760px; margin: 0 auto; padding: 24px; font-size: 15px; line-height: 1.75; }
     .w-file-viewer__epub-content img { max-width: 100%; height: auto; }`,
  )
}

defineExpose({ print })

watch(
  () => props.page,
  (page) => {
    if (!loaded.value) return
    void loadChapter(Math.min(Math.max(0, page - 1), Math.max(0, chapters.value.length - 1)))
  },
)

onMounted(parse)
onBeforeUnmount(() => {
  disposed = true
  urls.clear()
})
</script>

<template>
  <div class="w-file-viewer__epub">
    <div v-if="loaded && chapters.length === 0" class="w-file-viewer__placeholder">
      <p>{{ messages.renderers.epub.empty }}</p>
    </div>
    <template v-else>
      <header class="w-file-viewer__epub-header">
        <div class="w-file-viewer__epub-title">
          <strong>{{ book?.title || messages.renderers.epub.untitled }}</strong>
          <span v-if="book?.author">{{ book.author }}</span>
        </div>
        <div class="w-file-viewer__epub-actions">
          <span class="w-file-viewer__epub-chapter">{{ currentTitle }}</span>
          <button
            type="button"
            class="w-file-viewer__button is-small"
            :aria-expanded="showContents"
            @click="showContents = !showContents"
          >
            {{ messages.renderers.epub.contents }}
          </button>
        </div>
      </header>

      <div v-if="showContents" class="w-file-viewer__epub-toc">
        <button
          v-for="(chapter, index) in chapters"
          :key="`${chapter.path}-${index}`"
          type="button"
          class="w-file-viewer__epub-toc-item"
          :class="{ 'is-active': index === currentIndex }"
          @click="goToChapter(index)"
        >
          <span>{{ index + 1 }}</span>
          <span>{{
            chapter.title ||
            formatFileViewerMessage(messages.renderers.epub.chapter, { index: index + 1 })
          }}</span>
        </button>
      </div>

      <div ref="scroller" class="w-file-viewer__epub-scroll" @click="handleContentClick">
        <div v-if="chapterLoading" class="w-file-viewer__chapter-loading">
          {{ messages.viewer.loading }}
        </div>
        <div v-else-if="chapterError" class="w-file-viewer__placeholder is-compact">
          <p>{{ chapterError }}</p>
          <button type="button" class="w-file-viewer__button" @click="loadChapter(currentIndex)">
            {{ messages.viewer.retry }}
          </button>
        </div>
        <div v-else class="w-file-viewer__epub-content" v-html="chapterHtml" />
      </div>
    </template>
  </div>
</template>
