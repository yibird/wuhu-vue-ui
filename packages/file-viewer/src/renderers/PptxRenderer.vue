<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createObjectUrlPool } from '../core/format'
import { createZipMediaResolver } from '../core/zip-media'
import { parseOdp, type OdfPresentationSlide } from '../core/odf'
import { parsePptx, type PptxSlide } from '../core/pptx'
import { printHtml } from '../core/print'
import { ZipArchive } from '../core/zip'
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
}>()

const slides = ref<Array<PptxSlide | OdfPresentationSlide>>([])
const width = ref(1280)
const height = ref(720)
const loaded = ref(false)
const viewport = ref<HTMLElement>()
let disposed = false
const viewportSize = ref({ width: 0, height: 0 })
const objectUrls = createObjectUrlPool()
let observer: ResizeObserver | undefined

const currentSlide = computed(() => {
  if (slides.value.length === 0) return undefined
  return slides.value[Math.min(Math.max(0, props.page - 1), slides.value.length - 1)]
})

const fitScale = computed(() => {
  if (!viewportSize.value.width || !viewportSize.value.height) return 0.5
  const horizontal = (viewportSize.value.width - 40) / width.value
  const vertical = (viewportSize.value.height - 40) / height.value
  return Math.min(1, Math.max(0.05, Math.min(horizontal, vertical)))
})
const scale = computed(() => fitScale.value * props.zoom)
const stageStyle = computed(() => ({
  width: `${width.value * scale.value}px`,
  height: `${height.value * scale.value}px`,
}))
const slideStyle = computed(() => ({
  width: `${width.value}px`,
  height: `${height.value}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
}))

function measure() {
  const element = viewport.value
  if (!element) return
  viewportSize.value = { width: element.clientWidth, height: element.clientHeight }
}

async function parse(): Promise<void> {
  try {
    const zip = await ZipArchive.open(await props.source.getArrayBuffer())
    const resolveMedia = createZipMediaResolver(zip, objectUrls, () => disposed).resolve

    if (props.source.extension === 'odp') {
      const result = await parseOdp(zip, resolveMedia, {
        maxSlides: props.options.office?.maxPages,
        locale: props.locale,
      })
      slides.value = result.slides
      width.value = result.width
      height.value = result.height
    } else {
      const result = await parsePptx(
        zip,
        { maxSlides: props.options.office?.maxPages, locale: props.locale },
        resolveMedia,
      )
      slides.value = result.slides
      width.value = result.width
      height.value = result.height
    }

    if (disposed) return
    loaded.value = true
    emit('ready', {
      pageCount: slides.value.length,
      capabilities: defaultCapabilities(props.kind),
    })
    measure()
  } catch (cause) {
    if (disposed) return
    loaded.value = true
    emit('error', toRendererError(props.messages.renderers.pptx.parseError, cause))
  }
}

function print(): boolean {
  const body = slides.value
    .map(
      (slide) =>
        `<section class="w-file-viewer__pptx-slide" style="position:relative;width:${width.value}px;height:${height.value}px;overflow:hidden;">${slide.html}</section>`,
    )
    .join('')
  return printHtml(
    props.source.name,
    body,
    `@page { size: landscape; margin: 8mm; } .w-file-viewer__pptx-slide { zoom: .72; }`,
  )
}

defineExpose({ print })

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && viewport.value) {
    observer = new ResizeObserver(measure)
    observer.observe(viewport.value)
  }
  parse()
})

onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
  objectUrls.clear()
})
</script>

<template>
  <div v-if="loaded && slides.length === 0" class="w-file-viewer__placeholder">
    <p>{{ messages.renderers.pptx.empty }}</p>
  </div>
  <div v-else ref="viewport" class="w-file-viewer__pptx-viewport">
    <div v-if="currentSlide" class="w-file-viewer__pptx-stage" :style="stageStyle">
      <!--
        Controlled v-html exception: slide markup is assembled by core/pptx.ts
        and core/odf.ts only, with escapeHtml / escapeAttribute / sanitizeUrl
        applied to every text and URL. No authored markup is injected as-is.
      -->
      <div class="w-file-viewer__pptx-slide" :style="slideStyle" v-html="currentSlide.html" />
    </div>
  </div>
</template>
