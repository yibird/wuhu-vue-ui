<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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

const viewport = ref<HTMLElement>()
const natural = ref({ width: 0, height: 0 })
const container = ref({ width: 0, height: 0 })
let observer: ResizeObserver | undefined
let readySource = ''

const backgroundClass = computed(() => {
  const background = props.options.image?.background ?? 'checkerboard'
  return `is-${background}`
})

const fitMode = computed(() => props.options.image?.fit ?? 'contain')

const baseScale = computed(() => {
  if (fitMode.value === 'actual') return 1
  if (!natural.value.width || !natural.value.height) return 1
  if (!container.value.width || !container.value.height) return 1
  return Math.max(
    0.01,
    Math.min(
      (container.value.width - 40) / natural.value.width,
      (container.value.height - 40) / natural.value.height,
    ),
  )
})

const scale = computed(() => Math.max(0.01, baseScale.value * props.zoom))
const rotated = computed(() => Math.abs(props.rotation % 180) === 90)
const frameStyle = computed(() => {
  const width = natural.value.width * scale.value
  const height = natural.value.height * scale.value
  return {
    width: `${rotated.value ? height : width}px`,
    height: `${rotated.value ? width : height}px`,
  }
})
const imageStyle = computed(() => ({
  width: `${natural.value.width * scale.value}px`,
  height: `${natural.value.height * scale.value}px`,
  transform: `translate(-50%, -50%) rotate(${props.rotation}deg)`,
}))

function measure() {
  const element = viewport.value
  if (!element) return
  container.value = {
    width: element.clientWidth,
    height: element.clientHeight,
  }
}

function emitReady() {
  if (readySource === props.source.url) return
  readySource = props.source.url
  emit('ready', {
    pageCount: 0,
    capabilities: defaultCapabilities(props.kind),
  })
}

function handleLoad(event: Event) {
  const target = event.target as HTMLImageElement
  natural.value = {
    width: target.naturalWidth || target.width || 1,
    height: target.naturalHeight || target.height || 1,
  }
  measure()
  emitReady()
}

function handleError() {
  emit('error', new Error(props.messages.renderers.image.loadError))
}

const dragging = ref(false)
let dragStart = { x: 0, y: 0, left: 0, top: 0 }

function handlePointerDown(event: PointerEvent) {
  if (event.button !== 0 || !viewport.value) return
  dragging.value = true
  dragStart = {
    x: event.clientX,
    y: event.clientY,
    left: viewport.value.scrollLeft,
    top: viewport.value.scrollTop,
  }
  viewport.value.setPointerCapture?.(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  if (!dragging || !viewport.value) return
  viewport.value.scrollLeft = dragStart.left - (event.clientX - dragStart.x)
  viewport.value.scrollTop = dragStart.top - (event.clientY - dragStart.y)
}

function handlePointerUp(event: PointerEvent) {
  dragging.value = false
  viewport.value?.releasePointerCapture?.(event.pointerId)
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && viewport.value) {
    observer = new ResizeObserver(measure)
    observer.observe(viewport.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div
    ref="viewport"
    class="w-file-viewer__image-viewport"
    :class="[backgroundClass, { 'is-dragging': dragging }]"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
  >
    <div class="w-file-viewer__image-stage">
      <div class="w-file-viewer__image-frame" :style="frameStyle">
        <img
          :src="source.url"
          :alt="source.name"
          :style="imageStyle"
          draggable="false"
          @load="handleLoad"
          @error="handleError"
        />
      </div>
    </div>
  </div>
</template>
