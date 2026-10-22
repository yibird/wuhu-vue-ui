<script setup lang="ts">
import { usePointerDrag, useTimeoutFn } from '@wuhu-ui/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import type {
  SliderCaptchaFailEvent,
  SliderCaptchaProps,
  SliderCaptchaSuccessEvent,
  SliderCaptchaTarget,
} from './types'

defineOptions({
  name: 'SliderCaptcha',
})

const props = withDefaults(defineProps<SliderCaptchaProps>(), {
  src: '',
  width: 320,
  height: 160,
  pieceSize: 48,
  tolerance: 6,
  disabled: false,
  crossOrigin: '',
  text: '向右拖动滑块完成拼图',
  successText: '验证通过',
  failText: '验证失败，请重试',
  loadingText: '拼图加载中…',
  refreshOnFail: true,
  ariaLabel: '滑块拼图验证',
  refreshLabel: '换一张验证码',
})

const emit = defineEmits<{
  success: [event: SliderCaptchaSuccessEvent]
  fail: [event: SliderCaptchaFailEvent]
  refresh: []
  error: [error: Error]
}>()

const HANDLE_SIZE = 44
const RESET_DELAY = 700

const canvasRef = ref<HTMLCanvasElement>()
const pieceRef = ref<HTMLCanvasElement>()

const loading = ref(true)
const ready = ref(false)
const dragging = ref(false)
const solved = ref(false)
const failed = ref(false)
const offset = ref(0)
const attempts = ref(0)
const target = ref<SliderCaptchaTarget>({ x: 0, y: 0 })

let mounted = false
let image: HTMLImageElement | null = null
let loadedSrc = ''
let loadToken = 0
let startedAt = 0
let dragStartX = 0
let dragStartOffset = 0

const actualPieceSize = computed(() => {
  const size = Math.min(
    props.pieceSize,
    Math.max(24, props.width * 0.4),
    Math.max(24, props.height * 0.55),
  )
  return Math.max(24, Math.round(size))
})

const knob = computed(() => Math.max(6, Math.round(actualPieceSize.value * 0.18)))
const pieceTotal = computed(() => actualPieceSize.value + knob.value * 2)
const maxOffset = computed(() => Math.max(0, props.width - HANDLE_SIZE))
// Keep the piece away from the image edges at rest while preserving alignment
// with the cutout when the offset matches the target.
const pieceInset = computed(() => Math.max(8, Math.round(knob.value * 1.4)))
const handleOffset = computed(() => (solved.value ? maxOffset.value : offset.value))
const rootStyle = computed<CSSProperties>(() => ({ width: `${props.width}px` }))
const imageStyle = computed<CSSProperties>(() => ({ height: `${props.height}px` }))
const pieceStyle = computed<CSSProperties>(() => ({
  transform: `translate3d(${offset.value - knob.value + pieceInset.value}px, ${target.value.y - knob.value}px, 0)`,
}))
const handleStyle = computed<CSSProperties>(() => ({
  transform: `translate3d(${handleOffset.value}px, 0, 0)`,
}))
const fillStyle = computed<CSSProperties>(() => ({
  width: `${handleOffset.value + HANDLE_SIZE / 2}px`,
}))
const statusText = computed(() => {
  if (loading.value) return props.loadingText
  if (solved.value) return props.successText
  if (failed.value) return props.failText
  return props.text
})

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const resetTimeout = useTimeoutFn(() => {
  if (!mounted) return
  if (props.refreshOnFail) {
    prepare(false)
  } else {
    offset.value = 0
    failed.value = false
    startedAt = 0
  }
}, RESET_DELAY)

function clearResetTimer() {
  resetTimeout.stop()
}

function createPuzzlePath(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const radius = Math.max(3, size * 0.12)
  const bump = Math.max(5, size * 0.18)
  const right = x + size
  const centerY = y + size / 2

  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(right - radius, y)
  ctx.quadraticCurveTo(right, y, right, y + radius)
  ctx.lineTo(right, centerY - bump)
  ctx.arc(right, centerY, bump, -Math.PI / 2, Math.PI / 2, false)
  ctx.lineTo(right, y + size - radius)
  ctx.quadraticCurveTo(right, y + size, right - radius, y + size)
  ctx.lineTo(x + radius, y + size)
  ctx.quadraticCurveTo(x, y + size, x, y + size - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  return ctx
}

function drawArtwork(ctx: CanvasRenderingContext2D) {
  const width = props.width
  const height = props.height

  if (image) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
    const drawWidth = image.naturalWidth * scale
    const drawHeight = image.naturalHeight * scale
    ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
    return
  }

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#312e81')
  gradient.addColorStop(0.48, '#4f46e5')
  gradient.addColorStop(1, '#0ea5e9')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  for (let index = 0; index < 26; index += 1) {
    const radius = 8 + Math.random() * Math.max(12, width * 0.09)
    const x = Math.random() * width
    const y = Math.random() * height
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = index % 3 === 0 ? 'rgba(255, 255, 255, 0.14)' : 'rgba(14, 165, 233, 0.18)'
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1
  for (let index = -height; index < width; index += 28) {
    ctx.beginPath()
    ctx.moveTo(index, height)
    ctx.lineTo(index + height, 0)
    ctx.stroke()
  }
}

function render() {
  if (!mounted || typeof document === 'undefined') return

  const canvas = canvasRef.value
  const piece = pieceRef.value
  if (!canvas || !piece) return

  const width = props.width
  const height = props.height
  const size = actualPieceSize.value
  const pad = knob.value

  const background = document.createElement('canvas')
  const backgroundCtx = setupCanvas(background, width, height)
  if (!backgroundCtx) return
  drawArtwork(backgroundCtx)

  const ctx = setupCanvas(canvas, width, height)
  if (!ctx) return
  ctx.drawImage(background, 0, 0, width, height)

  const cutoutX = target.value.x + pieceInset.value
  createPuzzlePath(ctx, cutoutX, target.value.y, size)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.48)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  const pieceCtx = setupCanvas(piece, pieceTotal.value, pieceTotal.value)
  if (!pieceCtx) return

  pieceCtx.save()
  createPuzzlePath(pieceCtx, pad, pad, size)
  pieceCtx.clip()
  pieceCtx.drawImage(background, pad - cutoutX, pad - target.value.y, width, height)
  pieceCtx.restore()

  createPuzzlePath(pieceCtx, pad, pad, size)
  pieceCtx.strokeStyle = 'rgba(255, 255, 255, 0.82)'
  pieceCtx.lineWidth = 1.5
  pieceCtx.stroke()

  ready.value = true
}

function pickTarget() {
  const pad = knob.value
  const size = actualPieceSize.value
  const minX = Math.round(props.width * 0.42)
  const maxX = Math.max(minX, props.width - size - pad - 8 - pieceInset.value)
  // Keep the cutout below the top-right refresh button.
  const minY = Math.min(44, Math.max(8, props.height - size - 8))
  const maxY = Math.max(minY, props.height - size - 8)

  target.value = {
    x: Math.round(minX + Math.random() * (maxX - minX)),
    y: Math.round(minY + Math.random() * (maxY - minY)),
  }
}

function loadImage(src: string, token: number) {
  const img = new Image()
  if (props.crossOrigin) img.crossOrigin = props.crossOrigin

  img.addEventListener(
    'load',
    () => {
      if (!mounted || token !== loadToken) return
      image = img
      loadedSrc = src
      loading.value = false
      pickTarget()
      nextTick(render)
    },
    { once: true },
  )

  img.addEventListener(
    'error',
    () => {
      if (!mounted || token !== loadToken) return
      image = null
      loadedSrc = ''
      loading.value = false
      emit('error', new Error(`Failed to load captcha image: ${src}`))
      pickTarget()
      nextTick(render)
    },
    { once: true },
  )

  img.src = src
}

function prepare(notify: boolean) {
  clearResetTimer()
  offset.value = 0
  solved.value = false
  failed.value = false
  attempts.value = 0
  startedAt = 0

  if (!props.src) {
    loadToken += 1
    image = null
    loadedSrc = ''
    loading.value = false
    ready.value = false
    pickTarget()
    nextTick(render)
  } else if (image && loadedSrc === props.src) {
    loading.value = false
    ready.value = false
    pickTarget()
    nextTick(render)
  } else {
    loading.value = true
    ready.value = false
    loadToken += 1
    loadImage(props.src, loadToken)
  }

  if (notify) emit('refresh')
}

function markStarted() {
  if (!startedAt) startedAt = performance.now()
}

function verify(): boolean {
  if (props.disabled || loading.value || !ready.value || solved.value || failed.value) {
    return false
  }

  const duration = startedAt ? Math.round(performance.now() - startedAt) : 0
  attempts.value += 1
  const passed = Math.abs(offset.value - target.value.x) <= Math.max(0, props.tolerance)

  if (passed) {
    solved.value = true
    failed.value = false
    clearResetTimer()
    emit('success', {
      offset: offset.value,
      target: { ...target.value },
      duration,
      attempts: attempts.value,
    })
  } else {
    failed.value = true
    emit('fail', {
      offset: offset.value,
      target: { ...target.value },
      duration,
      attempts: attempts.value,
    })
    resetTimeout.start()
  }

  return passed
}

function handlePointerDown(event: PointerEvent) {
  if (
    dragging.value ||
    props.disabled ||
    loading.value ||
    !ready.value ||
    solved.value ||
    failed.value
  ) {
    return
  }

  event.preventDefault()
  dragging.value = true
  dragStartX = event.clientX
  dragStartOffset = offset.value
  markStarted()

  drag.start(event)
}

function handlePointerMove(event: PointerEvent) {
  if (!dragging.value) return
  offset.value = clamp(dragStartOffset + event.clientX - dragStartX, 0, maxOffset.value)
}

function handlePointerEnd() {
  if (!dragging.value) return
  dragging.value = false
  verify()
}

const drag = usePointerDrag({
  onMove: handlePointerMove,
  onEnd: handlePointerEnd,
  onCancel: handlePointerEnd,
})

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled || loading.value || !ready.value || solved.value || failed.value) return

  const step = event.shiftKey ? 10 : 2
  let next = offset.value

  switch (event.key) {
    case 'ArrowLeft':
      next -= step
      break
    case 'ArrowRight':
      next += step
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = maxOffset.value
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      markStarted()
      verify()
      return
    default:
      return
  }

  event.preventDefault()
  markStarted()
  offset.value = clamp(next, 0, maxOffset.value)
}

function refresh() {
  prepare(true)
}

function reset() {
  clearResetTimer()
  offset.value = 0
  solved.value = false
  failed.value = false
  attempts.value = 0
  startedAt = 0
}

watch(
  () => props.src,
  () => {
    if (mounted) prepare(false)
  },
)

watch(
  () => [props.width, props.height, props.pieceSize],
  () => {
    if (mounted) prepare(false)
  },
)

onMounted(() => {
  mounted = true
  prepare(false)
})

onBeforeUnmount(() => {
  mounted = false
  loadToken += 1
  clearResetTimer()
  drag.stop()
})

defineExpose({
  /** Generate a new challenge and reset the slider. */
  refresh,
  /** Reset the slider and status without changing the target. */
  reset,
  /** Validate the current slider offset. */
  verify,
  offset,
  target,
})
</script>

<template>
  <div
    class="w-slider-captcha"
    :class="[
      {
        'is-loading': loading,
        'is-dragging': dragging,
        'is-success': solved,
        'is-error': failed,
        'is-disabled': disabled,
      },
      props.classes?.root,
    ]"
    :style="[rootStyle, props.styles?.root]"
    role="group"
    :aria-label="ariaLabel"
  >
    <div
      class="w-slider-captcha__image"
      :class="props.classes?.image"
      :style="[imageStyle, props.styles?.image]"
    >
      <canvas
        ref="canvasRef"
        class="w-slider-captcha__canvas"
        :class="props.classes?.canvas"
        :style="props.styles?.canvas"
        role="img"
        :aria-label="ariaLabel"
      />

      <canvas
        ref="pieceRef"
        class="w-slider-captcha__piece"
        :class="props.classes?.piece"
        :style="[pieceStyle, props.styles?.piece]"
        aria-hidden="true"
      />

      <button
        v-if="!disabled"
        type="button"
        class="w-slider-captcha__refresh"
        :class="props.classes?.refresh"
        :style="props.styles?.refresh"
        :aria-label="refreshLabel"
        @click="refresh"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M16 6.5A6.5 6.5 0 1 0 16.2 12" />
          <path d="M16 3v4h-4" />
        </svg>
      </button>

      <div
        v-if="loading"
        class="w-slider-captcha__loading"
        :class="props.classes?.loading"
        :style="props.styles?.loading"
        aria-hidden="true"
      >
        {{ loadingText }}
      </div>
    </div>

    <div
      class="w-slider-captcha__slider"
      :class="props.classes?.slider"
      :style="props.styles?.slider"
    >
      <div
        class="w-slider-captcha__fill"
        :class="props.classes?.fill"
        :style="[fillStyle, props.styles?.fill]"
        aria-hidden="true"
      />
      <span
        class="w-slider-captcha__tip"
        :class="props.classes?.tip"
        :style="props.styles?.tip"
        aria-hidden="true"
        >{{ statusText }}</span
      >

      <button
        type="button"
        class="w-slider-captcha__handle"
        :class="props.classes?.handle"
        role="slider"
        :style="[handleStyle, props.styles?.handle]"
        :tabindex="disabled ? -1 : 0"
        :disabled="disabled"
        :aria-label="ariaLabel"
        aria-valuemin="0"
        :aria-valuemax="maxOffset"
        :aria-valuenow="offset"
        :aria-valuetext="statusText"
        :aria-disabled="disabled || loading || solved || failed || undefined"
        @pointerdown="handlePointerDown"
        @keydown="handleKeydown"
      >
        <svg
          v-if="solved"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m4.5 10.5 3.5 3.5 7.5-8" />
        </svg>
        <svg
          v-else-if="failed"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="m5 5 10 10M15 5 5 15" />
        </svg>
        <svg
          v-else
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 10h11M11 6l4 4-4 4" />
        </svg>
      </button>
    </div>

    <span
      class="w-slider-captcha__live"
      :class="props.classes?.live"
      :style="props.styles?.live"
      role="status"
      aria-live="polite"
      >{{ statusText }}</span
    >
  </div>
</template>
