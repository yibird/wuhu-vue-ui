<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { escapeHtml, formatBytes } from '../core/format'
import { printHtml } from '../core/print'
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
}>()

const family = `WuFileViewerFont${Math.random().toString(36).slice(2, 9)}`
const sample = ref(props.messages.renderers.font.sample)
const sizes = [12, 14, 16, 20, 24, 32, 48, 64]
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789'
let face: FontFace | undefined
let fontSrc = ''

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

function fontMime(extension: string): string {
  switch (extension) {
    case 'ttf':
      return 'font/ttf'
    case 'otf':
      return 'font/otf'
    case 'woff':
      return 'font/woff'
    case 'woff2':
      return 'font/woff2'
    default:
      return 'application/octet-stream'
  }
}

const size = computed(() => formatBytes(props.source.size, props.locale))

async function load(): Promise<void> {
  if (typeof FontFace === 'undefined') {
    emit('error', new Error(props.messages.renderers.font.loadError))
    return
  }
  try {
    const buffer = await props.source.getArrayBuffer()
    face = new FontFace(family, buffer)
    await face.load()
    document.fonts.add(face)
    fontSrc = `url(data:${fontMime(props.source.extension)};base64,${toBase64(buffer)})`
    emit('ready', {
      pageCount: 0,
      capabilities: defaultCapabilities(props.kind),
    })
  } catch {
    emit('error', new Error(props.messages.renderers.font.loadError))
  }
}

function print(): boolean {
  if (!fontSrc) return false

  const rows = sizes
    .map(
      (fontSize) =>
        `<p style="font-family:'${family}',sans-serif;font-size:${fontSize}px;margin:0 0 14px;"><span style="display:inline-block;width:64px;font-size:11px;color:#64748b;font-family:sans-serif;">${fontSize}px</span>${escapeHtml(
          sample.value,
        )}</p>`,
    )
    .join('')
  return printHtml(
    props.source.name,
    `<div style="padding:24px;">${rows}</div>`,
    `@font-face { font-family: '${family}'; src: ${fontSrc}; }`,
  )
}

defineExpose({ print })

onMounted(load)
onBeforeUnmount(() => {
  if (face && typeof document !== 'undefined') document.fonts.delete(face)
})
</script>

<template>
  <div class="w-file-viewer__font">
    <header class="w-file-viewer__font-header">
      <div>
        <strong>{{ source.name }}</strong>
        <span v-if="size">{{ source.extension.toUpperCase() }} · {{ size }}</span>
      </div>
      <input
        v-model="sample"
        class="w-file-viewer__field"
        :aria-label="messages.renderers.font.sample"
      />
    </header>
    <div class="w-file-viewer__font-specimen" :style="{ fontFamily: `'${family}', sans-serif` }">
      <div class="w-file-viewer__font-alphabet">{{ alphabet }}</div>
      <div v-for="fontSize in sizes" :key="fontSize" class="w-file-viewer__font-row">
        <span class="w-file-viewer__font-size">{{ fontSize }}px</span>
        <span :style="{ fontSize: `${fontSize}px` }">{{
          sample || messages.renderers.font.sample
        }}</span>
      </div>
      <div class="w-file-viewer__font-row">
        <span class="w-file-viewer__font-size">Bold</span>
        <span :style="{ fontSize: '28px', fontWeight: 700 }">{{
          sample || messages.renderers.font.sample
        }}</span>
      </div>
      <div class="w-file-viewer__font-row">
        <span class="w-file-viewer__font-size">Italic</span>
        <span :style="{ fontSize: '28px', fontStyle: 'italic' }">{{
          sample || messages.renderers.font.sample
        }}</span>
      </div>
    </div>
  </div>
</template>
