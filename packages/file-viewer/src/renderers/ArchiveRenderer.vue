<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { detectFormat, detectMimeType } from '../core/detect'
import { triggerDownload } from '../core/download'
import { formatBytes, formatDateTime } from '../core/format'
import { openArchive, type ArchiveEntry, type ArchiveReader } from '../core/zip'
import { defaultCapabilities } from '../core/capabilities'
import { toRendererError } from '../core/errors'
import { formatFileViewerMessage } from '../i18n'
import type { FileViewerRendererProps, FileViewerKind } from '../types'

defineOptions({
  name: 'WFileViewerArchiveRenderer',
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

const archive = ref<ArchiveReader>()
const entries = ref<ArchiveEntry[]>([])
const loaded = ref(false)
const query = ref('')
const selected = ref<ArchiveEntry>()
const previewKind = ref<'image' | 'text' | 'message' | 'none'>('none')
const previewText = ref('')
const previewUrl = ref('')
const previewMessage = ref('')
const previewLoading = ref(false)
const previewToken = ref(0)
let disposed = false

const maxEntries = computed(() => props.options.archive?.maxEntries ?? 2000)
const maxPreviewBytes = computed(() => props.options.archive?.maxPreviewBytes ?? 1024 * 1024)

const filteredEntries = computed(() => {
  const search = query.value.trim().toLowerCase()
  const filtered = search
    ? entries.value.filter((entry) => entry.name.toLowerCase().includes(search))
    : entries.value
  return filtered.slice(0, maxEntries.value)
})

const truncated = computed(
  () =>
    entries.value.length > maxEntries.value ||
    (query.value.trim().length > 0 && filteredEntries.value.length >= maxEntries.value),
)

const entriesLabel = computed(() =>
  formatFileViewerMessage(props.messages.renderers.archive.entries, {
    count: entries.value.length,
  }),
)

const TEXT_KINDS = new Set<FileViewerKind>([
  'text',
  'code',
  'json',
  'xml',
  'markdown',
  'csv',
  'html',
  'subtitle',
])

async function parse(): Promise<void> {
  try {
    const reader = await openArchive(await props.source.getArrayBuffer(), props.source.name)
    if (disposed) return
    archive.value = reader
    entries.value = [...reader.entries].sort((a, b) => {
      if (a.directory !== b.directory) return a.directory ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    loaded.value = true
    emit('ready', {
      pageCount: 0,
      capabilities: defaultCapabilities(props.kind),
    })
    const firstFile = entries.value.find((entry) => !entry.directory)
    if (firstFile) void selectEntry(firstFile)
  } catch (cause) {
    if (disposed) return
    loaded.value = true
    emit('error', toRendererError(props.messages.renderers.archive.parseError, cause))
  }
}

function clearPreviewUrl(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

async function selectEntry(entry: ArchiveEntry): Promise<void> {
  if (disposed || !archive.value || entry.directory) return
  const token = ++previewToken.value
  selected.value = entry
  previewKind.value = 'none'
  previewText.value = ''
  previewMessage.value = ''
  previewLoading.value = true
  clearPreviewUrl()

  try {
    if (entry.encrypted) {
      previewKind.value = 'message'
      previewMessage.value = props.messages.renderers.archive.binary
      return
    }
    if (entry.size > maxPreviewBytes.value) {
      previewKind.value = 'message'
      previewMessage.value = props.messages.renderers.archive.tooLarge
      return
    }

    const format = detectFormat(entry.name)
    if (format.kind === 'image') {
      const mime = detectMimeType(entry.name) ?? 'application/octet-stream'
      const url = URL.createObjectURL(await archive.value.blob(entry.name, mime))
      if (token !== previewToken.value) {
        URL.revokeObjectURL(url)
        return
      }
      previewUrl.value = url
      previewKind.value = 'image'
      return
    }

    if (TEXT_KINDS.has(format.kind)) {
      let text = await archive.value.text(entry.name)
      if (text.length > maxPreviewBytes.value) text = text.slice(0, maxPreviewBytes.value)
      if (token !== previewToken.value) return
      previewText.value = text
      previewKind.value = 'text'
      return
    }

    previewKind.value = 'message'
    previewMessage.value = props.messages.renderers.archive.binary
  } catch (cause) {
    if (token !== previewToken.value) return
    previewKind.value = 'message'
    previewMessage.value =
      cause instanceof Error ? cause.message : props.messages.renderers.archive.binary
  } finally {
    if (token === previewToken.value) previewLoading.value = false
  }
}

async function downloadEntry(entry: ArchiveEntry): Promise<void> {
  if (!archive.value || entry.directory) return
  try {
    const blob = await archive.value.blob(
      entry.name,
      detectMimeType(entry.name) ?? 'application/octet-stream',
    )
    triggerDownload(blob, entry.name.split('/').pop() ?? entry.name)
  } catch {
    previewKind.value = 'message'
    previewMessage.value = props.messages.renderers.archive.binary
  }
}

onMounted(parse)
onBeforeUnmount(() => {
  disposed = true
  clearPreviewUrl()
})
</script>

<template>
  <div class="w-file-viewer__archive">
    <div v-if="loaded && entries.length === 0" class="w-file-viewer__placeholder">
      <p>{{ messages.renderers.archive.empty }}</p>
    </div>
    <template v-else>
      <div class="w-file-viewer__archive-toolbar">
        <input
          v-model="query"
          type="search"
          class="w-file-viewer__field"
          :placeholder="entriesLabel"
          :aria-label="entriesLabel"
        />
        <span class="w-file-viewer__badge">{{ entriesLabel }}</span>
      </div>

      <div class="w-file-viewer__archive-layout">
        <div class="w-file-viewer__archive-list">
          <div
            v-for="(entry, index) in filteredEntries"
            :key="`${entry.name}-${index}`"
            class="w-file-viewer__archive-row"
            :class="{
              'is-active': selected?.name === entry.name,
              'is-directory': entry.directory,
            }"
            role="button"
            :tabindex="entry.directory ? -1 : 0"
            @click="selectEntry(entry)"
            @keydown.enter="selectEntry(entry)"
          >
            <span class="w-file-viewer__archive-name">
              <svg v-if="entry.directory" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M2.5 5.5A1.5 1.5 0 0 1 4 4h4l1.5 2H16a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Z"
                  stroke="currentColor"
                  stroke-width="1.4"
                />
              </svg>
              <svg v-else viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5 2.5h6l4 4v11H5v-15Z"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linejoin="round"
                />
                <path
                  d="M11 2.5v4h4"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linejoin="round"
                />
              </svg>
              <span>{{ entry.name }}</span>
            </span>
            <span class="w-file-viewer__archive-meta">
              <span>{{
                entry.directory
                  ? messages.renderers.archive.folder
                  : formatBytes(entry.size, locale)
              }}</span>
              <span v-if="entry.date">{{ formatDateTime(entry.date, locale) }}</span>
            </span>
            <button
              v-if="!entry.directory"
              type="button"
              class="w-file-viewer__icon-button is-small"
              :title="messages.renderers.archive.downloadEntry"
              :aria-label="messages.renderers.archive.downloadEntry"
              @click.stop="downloadEntry(entry)"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15.5h12"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
          <p v-if="filteredEntries.length === 0" class="w-file-viewer__hint">
            {{ messages.renderers.archive.empty }}
          </p>
          <p v-if="truncated" class="w-file-viewer__hint">
            {{
              formatFileViewerMessage(messages.renderers.archive.truncated, { count: maxEntries })
            }}
          </p>
        </div>

        <div class="w-file-viewer__archive-preview">
          <div v-if="!selected" class="w-file-viewer__archive-empty">
            {{ messages.renderers.archive.preview }}
          </div>
          <div v-else-if="previewLoading" class="w-file-viewer__archive-empty">
            {{ messages.viewer.loading }}
          </div>
          <template v-else>
            <div class="w-file-viewer__archive-preview-head">
              <strong>{{ selected.name }}</strong>
              <span>{{ formatBytes(selected.size, locale) }}</span>
            </div>
            <img
              v-if="previewKind === 'image'"
              class="w-file-viewer__archive-image"
              :src="previewUrl"
              :alt="selected.name"
            />
            <pre v-else-if="previewKind === 'text'" class="w-file-viewer__archive-text">{{
              previewText
            }}</pre>
            <p v-else-if="previewKind === 'message'" class="w-file-viewer__archive-empty">
              {{ previewMessage }}
            </p>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
