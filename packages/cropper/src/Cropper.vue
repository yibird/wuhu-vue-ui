<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type Cropper from 'cropperjs'
import type { CropperCanvas, CropperImage, CropperSelection } from 'cropperjs'
import type {
  CropperData,
  CropperExpose,
  CropperFileOptions,
  CropperOutputOptions,
  CropperProps,
  CropperReadyEvent,
  CropperSlotProps,
} from './types'

defineOptions({
  name: 'WCropper',
})

const props = withDefaults(defineProps<CropperProps>(), {
  alt: 'Image to crop',
  height: 360,
  initialCoverage: 0.5,
  rotatable: true,
  scalable: true,
  translatable: true,
  movable: true,
  resizable: true,
  zoomable: true,
  keyboard: true,
  disabled: false,
  crossOrigin: '',
  template: '',
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
  'is-disabled': props.disabled,
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

function emitCrop(): void {
  const data = readData()
  if (data) emit('crop', data)
}

function handleSelectionChange(event: Event): void {
  // Cropper.js emits the new geometry in the event detail *before* writing it
  // back to the selection properties, so reading `selection.x` here would emit
  // the previous frame during drags. Prefer the detail and fall back to the
  // (already updated) properties for synthetic events without a detail.
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

function handleActionStart(event: Event): void {
  emit('actionstart', event)
}

function handleActionMove(event: Event): void {
  emit('actionmove', event)
}

function handleActionEnd(event: Event): void {
  emit('actionend', event)
  const data = readData()
  if (data) emit('cropend', data)
}

function bindEvents(): void {
  selectionRef.value?.addEventListener('change', handleSelectionChange)
  canvasRef.value?.addEventListener('actionstart', handleActionStart)
  canvasRef.value?.addEventListener('actionmove', handleActionMove)
  canvasRef.value?.addEventListener('actionend', handleActionEnd)
}

function unbindEvents(): void {
  selectionRef.value?.removeEventListener('change', handleSelectionChange)
  canvasRef.value?.removeEventListener('actionstart', handleActionStart)
  canvasRef.value?.removeEventListener('actionmove', handleActionMove)
  canvasRef.value?.removeEventListener('actionend', handleActionEnd)
}

function applyKeyboardState(): void {
  const selection = selectionRef.value
  if (selection) {
    selection.keyboard = props.keyboard && keyboardActive.value && !props.disabled
  }
}

function applyOptions(): void {
  const image = imageRef.value
  if (image) {
    image.rotatable = props.rotatable
    image.scalable = props.scalable
    image.translatable = props.translatable
  }

  const selection = selectionRef.value
  if (selection) {
    selection.initialCoverage = props.initialCoverage
    selection.aspectRatio = props.aspectRatio ?? Number.NaN
    selection.movable = props.movable
    selection.resizable = props.resizable
    selection.zoomable = props.zoomable
    applyKeyboardState()
  }

  if (canvasRef.value) {
    canvasRef.value.disabled = props.disabled
  }
}

function handleFocusIn(): void {
  keyboardActive.value = true
  applyKeyboardState()
}

function handleFocusOut(event: FocusEvent): void {
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

    const instance = new CropperImpl(source, { template: props.template || defaultTemplate })
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

function destroy(): void {
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

function setData(data: Partial<CropperData>): void {
  const selection = selectionRef.value
  if (!selection) return

  selection.$change(
    data.x ?? selection.x,
    data.y ?? selection.y,
    data.width ?? selection.width,
    data.height ?? selection.height,
  )
}

function setAspectRatio(ratio: number): void {
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

function zoom(scale: number): void {
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

function rotate(degrees: number): void {
  if (!Number.isFinite(degrees)) return
  imageRef.value?.$rotate((degrees * Math.PI) / 180)
}

function reset(): void {
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
  () => applyOptions(),
)

watch(
  () => props.disabled,
  (disabled) => {
    if (canvasRef.value) canvasRef.value.disabled = disabled
    applyKeyboardState()
  },
)

watch(
  () => [props.rotatable, props.scalable, props.translatable] as const,
  ([rotatable, scalable, translatable]) => {
    const image = imageRef.value
    if (!image) return
    image.rotatable = rotatable
    image.scalable = scalable
    image.translatable = translatable
  },
)

watch(
  () => [props.movable, props.resizable, props.zoomable, props.keyboard] as const,
  ([movable, resizable, zoomable]) => {
    const selection = selectionRef.value
    if (!selection) return
    selection.movable = movable
    selection.resizable = resizable
    selection.zoomable = zoomable
    applyKeyboardState()
  },
)

onMounted(() => {
  void initialize()
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
})
</script>

<template>
  <div
    ref="rootRef"
    class="w-cropper"
    :class="rootClasses"
    :style="rootStyle"
    role="group"
    :aria-label="alt"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? -1 : 0"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <img
      ref="sourceRef"
      class="w-cropper__source"
      :src="src"
      :alt="alt"
      :crossorigin="crossOrigin || undefined"
    />
    <slot v-bind="slotProps" />
  </div>
</template>
