<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type Cropper from 'cropperjs'
import type { CropperCanvas, CropperImage, CropperSelection } from 'cropperjs'
import type {
  CropperData,
  CropperExpose,
  CropperFileOptions,
  CropperLabels,
  CropperOutputOptions,
  CropperProps,
  CropperReadyEvent,
  CropperSlotProps,
} from './types'

const defaultLabels: CropperLabels = {
  actionBar: '图片裁剪操作',
  zoomIn: '放大',
  zoomOut: '缩小',
  rotateLeft: '向左旋转',
  rotateRight: '向右旋转',
  reset: '重置',
  image: '待裁剪图片',
}

const props = withDefaults(defineProps<CropperProps>(), {
  labels: () => ({}),
  height: 360,
  initialCoverage: 0.5,
  toolbar: true,
  crossOrigin: '',
})

const emit = defineEmits<{
  ready: [event: CropperReadyEvent]
  crop: [data: CropperData]
  cropend: [data: CropperData]
  actionstart: [event: Event]
  actionmove: [event: Event]
  actionend: [event: Event]
  error: [error: Error]
}>()

defineSlots<{
  default?: (props: CropperSlotProps) => unknown
}>()

const rootRef = ref<HTMLElement>()
const sourceRef = ref<HTMLImageElement>()
const ready = ref(false)
const keyboardActive = ref(false)
const instanceRef = shallowRef<Cropper | null>(null)
const imageRef = shallowRef<CropperImage | null>(null)
const selectionRef = shallowRef<CropperSelection | null>(null)
const canvasRef = shallowRef<CropperCanvas | null>(null)

const labels = computed<CropperLabels>(() => ({ ...defaultLabels, ...props.labels }))

const toolbarEnabled = computed(() => props.toolbar !== false)
const interactions = computed(() => {
  const options = typeof props.toolbar === 'object' ? props.toolbar : {}
  return {
    rotatable: options.rotatable ?? true,
    scalable: options.scalable ?? true,
    translatable: options.translatable ?? true,
    movable: options.movable ?? true,
    resizable: options.resizable ?? true,
    zoomable: options.zoomable ?? true,
    keyboard: options.keyboard ?? true,
  }
})

let initialized = false
let initToken = 0
let srcToken = 0

// Cropper.js touches `HTMLElement` at module scope, so it must not be imported
// during SSR. Load it lazily in the browser only.
type CropperConstructor = typeof import('cropperjs').default
let CropperClass: CropperConstructor | undefined
let defaultTemplate = ''

async function loadCropper(): Promise<CropperConstructor> {
  if (!CropperClass) {
    const module = await import('cropperjs')
    CropperClass = module.default
    defaultTemplate = module.DEFAULT_TEMPLATE
  }
  return CropperClass
}

const rootStyle = computed(() => ({
  '--w-cropper-height': typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

const rootClasses = computed(() => ({
  'is-ready': ready.value,
}))

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause))
}

/** Minimum / maximum absolute image scale reachable through `zoom()`. */
const MIN_ZOOM = 0.1
const MAX_ZOOM = 10

function readData(): CropperData | null {
  const selection = selectionRef.value
  if (!selection) return null
  return {
    x: selection.x,
    y: selection.y,
    width: selection.width,
    height: selection.height,
  }
}

function emitCrop() {
  const data = readData()
  if (data) emit('crop', data)
}

function handleSelectionChange(event: Event) {
  const detail = (event as CustomEvent<Partial<CropperData>>).detail
  if (
    detail &&
    typeof detail.x === 'number' &&
    typeof detail.y === 'number' &&
    typeof detail.width === 'number' &&
    typeof detail.height === 'number'
  ) {
    emit('crop', {
      x: detail.x,
      y: detail.y,
      width: detail.width,
      height: detail.height,
    })
    return
  }

  emitCrop()
}

function handleActionStart(event: Event) {
  emit('actionstart', event)
}

function handleActionMove(event: Event) {
  emit('actionmove', event)
}

function handleActionEnd(event: Event) {
  emit('actionend', event)
  const data = readData()
  if (data) emit('cropend', data)
}

function bindEvents() {
  selectionRef.value?.addEventListener('change', handleSelectionChange)
  canvasRef.value?.addEventListener('actionstart', handleActionStart)
  canvasRef.value?.addEventListener('actionmove', handleActionMove)
  canvasRef.value?.addEventListener('actionend', handleActionEnd)
}

function unbindEvents() {
  selectionRef.value?.removeEventListener('change', handleSelectionChange)
  canvasRef.value?.removeEventListener('actionstart', handleActionStart)
  canvasRef.value?.removeEventListener('actionmove', handleActionMove)
  canvasRef.value?.removeEventListener('actionend', handleActionEnd)
}

function applyKeyboardState() {
  const selection = selectionRef.value
  if (selection) {
    selection.keyboard = interactions.value.keyboard && keyboardActive.value
  }
}

function applyOptions() {
  const options = interactions.value
  const image = imageRef.value
  if (image) {
    image.rotatable = options.rotatable
    image.scalable = options.scalable
    image.translatable = options.translatable
  }

  const selection = selectionRef.value
  if (selection) {
    selection.initialCoverage = props.initialCoverage
    selection.aspectRatio = props.aspectRatio ?? Number.NaN
    selection.movable = options.movable
    selection.resizable = options.resizable
    selection.zoomable = options.zoomable
    applyKeyboardState()
  }
}

function handleFocusIn() {
  keyboardActive.value = true
  applyKeyboardState()
}

function handleFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (next && rootRef.value?.contains(next)) return
  keyboardActive.value = false
  applyKeyboardState()
}

async function initialize(): Promise<void> {
  const source = sourceRef.value
  if (!source || !props.src || initialized) return

  const token = ++initToken
  const initialSrc = props.src
  initialized = true

  try {
    const CropperImpl = await loadCropper()
    if (token !== initToken) return

    const instance = new CropperImpl(source, {
      template: defaultTemplate,
    })
    if (token !== initToken) {
      instance.destroy()
      return
    }

    instanceRef.value = instance
    imageRef.value = instance.getCropperImage()
    selectionRef.value = instance.getCropperSelection()
    canvasRef.value = instance.getCropperCanvas()

    applyOptions()
    bindEvents()

    const image = imageRef.value
    if (!image) return

    await image.$ready()
    if (token !== initToken) return

    // A newer `src` may have arrived while the image was loading.
    if (props.src !== initialSrc) {
      if (!props.src) return
      const nextSrc = props.src
      image.src = nextSrc
      await image.$ready()
      if (token !== initToken || props.src !== nextSrc) return
    }

    ready.value = true
    emit('ready', { cropper: instance, image })
    emitCrop()
  } catch (cause) {
    if (token !== initToken) return
    initialized = false
    emit('error', toError(cause))
  }
}

function destroy() {
  initToken += 1
  srcToken += 1
  // CropperSelection registers a document-level keydown listener while enabled.
  if (selectionRef.value) selectionRef.value.keyboard = false
  unbindEvents()
  instanceRef.value?.destroy()
  instanceRef.value = null
  imageRef.value = null
  selectionRef.value = null
  canvasRef.value = null
  ready.value = false
  initialized = false
}

function getInstance(): Cropper | null {
  return instanceRef.value
}

function getSelection(): CropperSelection | null {
  return selectionRef.value
}

function getImage(): CropperImage | null {
  return imageRef.value
}

function getCanvas(): CropperCanvas | null {
  return canvasRef.value
}

function getData(): CropperData | null {
  return readData()
}

function setData(data: Partial<CropperData>) {
  const selection = selectionRef.value
  if (!selection) return

  selection.$change(
    data.x ?? selection.x,
    data.y ?? selection.y,
    data.width ?? selection.width,
    data.height ?? selection.height,
  )
}

function setAspectRatio(ratio: number) {
  if (selectionRef.value) {
    selectionRef.value.aspectRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : Number.NaN
  }
}

async function getCroppedCanvas(
  options: CropperOutputOptions = {},
): Promise<HTMLCanvasElement | null> {
  const selection = selectionRef.value
  if (!selection) return null
  return selection.$toCanvas(options)
}

async function getCroppedBlob(options: CropperFileOptions = {}): Promise<Blob | null> {
  const { type = 'image/png', quality, ...canvasOptions } = options
  const canvas = await getCroppedCanvas(canvasOptions)
  if (!canvas) return null

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

async function getCroppedDataUrl(options: CropperFileOptions = {}): Promise<string | null> {
  const { type = 'image/png', quality, ...canvasOptions } = options
  const canvas = await getCroppedCanvas(canvasOptions)
  return canvas ? canvas.toDataURL(type, quality) : null
}

function getScale(image: CropperImage): number {
  const [a, b, c, d] = image.$getTransform()
  return Math.sqrt(Math.abs(a * d - b * c)) || 1
}

function zoom(scale: number) {
  if (!Number.isFinite(scale)) return

  const image = imageRef.value
  if (!image) return

  const current = getScale(image)
  // Cropper.js treats positive values as "scale up by 1 + n" and negative
  // values as "scale down by 1 / (1 - n)", mirror that to bound the result.
  const factor = scale < 0 ? 1 / (1 - scale) : scale + 1

  // Clamp only in the direction of the gesture: this keeps the initial
  // contain-fit scale working even when it is already outside [MIN, MAX].
  if (factor > 1) {
    if (current >= MAX_ZOOM) return
  } else if (factor < 1) {
    if (current <= MIN_ZOOM) return
  } else {
    return
  }

  const rawTarget = current * factor
  const target = factor > 1 ? Math.min(MAX_ZOOM, rawTarget) : Math.max(MIN_ZOOM, rawTarget)

  // Inside the range, forward the original value so behaviour stays identical.
  if (target === rawTarget) {
    image.$zoom(scale)
    return
  }

  const ratio = target / current
  if (ratio === 1) return

  // Convert the bounded absolute ratio back into a relative zoom factor.
  image.$zoom(ratio > 1 ? ratio - 1 : 1 - 1 / ratio)
}

function rotate(degrees: number) {
  if (!Number.isFinite(degrees)) return
  imageRef.value?.$rotate((degrees * Math.PI) / 180)
}

function reset() {
  const image = imageRef.value
  if (image) {
    // `$resetTransform()` restores the identity matrix, which leaves the image
    // at its natural size in the top-left corner. Re-apply the initial fit and
    // centering (what Cropper.js does while the image loads) so the reset state
    // matches the first rendered frame. Both calls are gated by the interaction
    // flags, so temporarily enable them and restore the props afterwards.
    const { translatable, scalable } = image
    image.translatable = true
    image.scalable = true
    try {
      image.$resetTransform()
      image.$center(image.initialCenterSize || image.initialFit)
    } finally {
      image.translatable = translatable
      image.scalable = scalable
    }
  }

  // Emits a single `change` event, which is forwarded as `crop`. Do not emit
  // again on the next tick: duplicate events make the preview flicker.
  selectionRef.value?.$reset()
}

/** Retries initialization after a load error when the source stays the same. */
function retry() {
  if (ready.value) return
  destroy()
  void initialize()
}

const slotProps = computed<CropperSlotProps>(() => ({
  ready: ready.value,
  cropper: instanceRef.value,
  image: imageRef.value,
  selection: selectionRef.value,
  canvas: canvasRef.value,
  zoomIn: () => zoom(0.1),
  zoomOut: () => zoom(-0.1),
  rotateLeft: () => rotate(-90),
  rotateRight: () => rotate(90),
  reset,
  crop: getCroppedCanvas,
}))

watch(
  () => props.src,
  async (src) => {
    const instance = instanceRef.value
    const image = imageRef.value
    if (!src) {
      destroy()
      return
    }
    if (!instance || !image) {
      if (!initialized) void initialize()
      return
    }

    const token = ++srcToken
    ready.value = false

    try {
      image.src = src
      await image.$ready()
      if (token !== srcToken) return
      ready.value = true
      emit('ready', { cropper: instance, image })
      emitCrop()
    } catch (cause) {
      if (token === srcToken) emit('error', toError(cause))
    }
  },
)

watch(
  () => props.aspectRatio,
  (ratio) => setAspectRatio(ratio ?? Number.NaN),
)

watch(
  () => props.initialCoverage,
  (coverage) => {
    const selection = selectionRef.value
    if (!selection) return

    // `initialCoverage` only applies when Cropper.js (re)initialises the
    // selection, so reset it to make runtime changes take effect.
    selection.initialCoverage = coverage
    selection.$reset()
  },
)

watch(interactions, (options) => {
  const image = imageRef.value
  if (image) {
    image.rotatable = options.rotatable
    image.scalable = options.scalable
    image.translatable = options.translatable
  }

  const selection = selectionRef.value
  if (selection) {
    selection.movable = options.movable
    selection.resizable = options.resizable
    selection.zoomable = options.zoomable
  }

  applyKeyboardState()
})

onMounted(() => {
  initialize()
})

onBeforeUnmount(() => {
  initToken += 1
  srcToken += 1
  destroy()
})

defineExpose<CropperExpose>({
  getInstance,
  getSelection,
  getImage,
  getCanvas,
  getData,
  setData,
  setAspectRatio,
  getCroppedCanvas,
  getCroppedBlob,
  getCroppedDataUrl,
  zoom,
  rotate,
  reset,
  retry,
})
</script>

<template>
  <div
    ref="rootRef"
    class="w-cropper"
    :class="rootClasses"
    :style="rootStyle"
    role="group"
    :aria-label="labels.image"
    tabindex="0"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <img
      ref="sourceRef"
      class="w-cropper__source"
      :src="src"
      :alt="labels.image"
      :crossorigin="crossOrigin || undefined"
      aria-hidden="true"
    />

    <div
      v-if="toolbarEnabled"
      class="w-cropper__action-bar"
      role="toolbar"
      :aria-label="labels.actionBar"
    >
      <button
        type="button"
        class="w-cropper__action"
        :disabled="!ready || !interactions.scalable"
        :aria-label="labels.zoomOut"
        :title="labels.zoomOut"
        @click="zoom(-0.1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        class="w-cropper__action"
        :disabled="!ready || !interactions.scalable"
        :aria-label="labels.zoomIn"
        :title="labels.zoomIn"
        @click="zoom(0.1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        class="w-cropper__action"
        :disabled="!ready || !interactions.rotatable"
        :aria-label="labels.rotateLeft"
        :title="labels.rotateLeft"
        @click="rotate(-90)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      <button
        type="button"
        class="w-cropper__action"
        :disabled="!ready || !interactions.rotatable"
        :aria-label="labels.rotateRight"
        :title="labels.rotateRight"
        @click="rotate(90)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
      <button
        type="button"
        class="w-cropper__action"
        :disabled="!ready"
        :aria-label="labels.reset"
        :title="labels.reset"
        @click="reset"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
        </svg>
      </button>
    </div>

    <slot v-bind="slotProps" />
  </div>
</template>
