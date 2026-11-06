<script setup lang="ts">
import { useRaf } from '@wuhu-vue-ui/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { DockItem, DockProps, DockSlots } from './types'

const props = withDefaults(defineProps<DockProps>(), {
  position: 'bottom',
  magnification: true,
  baseSize: 48,
  maxScale: 1.6,
  gap: 8,
  ariaLabel: undefined,
})

const emit = defineEmits<{
  select: [item: DockItem, event: Event]
}>()

defineSlots<DockSlots>()

const rootRef = ref<HTMLElement>()
const itemRefs = ref<(HTMLElement | null)[]>([])
const scales = ref<number[]>([])
const activeIndex = ref(-1)

/**
 * Item centers relative to the dock root. Cached because pointer frames only
 * need the root rect plus these numbers; items themselves are not re-measured.
 */
let itemCenters: number[] | null = null
let resizeObserver: ResizeObserver | undefined

const items = computed(() => props.model ?? [])
const isHorizontal = computed(() => props.position === 'bottom' || props.position === 'top')
const maxScale = computed(() => Math.max(1, props.maxScale))

const rootStyle = computed<Record<string, string>>(() => ({
  '--w-dock-size': `${props.baseSize}px`,
  '--w-dock-gap': `${props.gap}px`,
  '--w-dock-max-scale': `${maxScale.value}`,
}))

function isActive(index: number): boolean {
  return activeIndex.value === index
}

function scaleFor(index: number): number {
  return scales.value[index] ?? 1
}

function itemStyle(index: number): Record<string, string> {
  return {
    transform: `scale(${scaleFor(index)})`,
  }
}

function imageSource(item: DockItem): string | undefined {
  return typeof item.icon === 'string' ? item.icon : undefined
}

function componentIcon(item: DockItem): DockItem['icon'] {
  return typeof item.icon === 'string' ? undefined : item.icon
}

function setItemRef(el: Element | ComponentPublicInstance | null, index: number) {
  itemRefs.value[index] = el instanceof HTMLElement ? el : null
}

function resetScales() {
  scales.value = items.value.map(() => 1)
}

let pendingPointer: { x: number; y: number } | null = null

const pointerRaf = useRaf(() => {
  if (pendingPointer) applyPointer(pendingPointer.x, pendingPointer.y)
})

function onPointerMove(event: PointerEvent) {
  if (!props.magnification) return

  pendingPointer = { x: event.clientX, y: event.clientY }

  if (typeof requestAnimationFrame === 'undefined') {
    applyPointer(event.clientX, event.clientY)
    return
  }

  pointerRaf.schedule()
}

function invalidateItemCenters() {
  itemCenters = null
}

function measureItemCenters(): number[] | null {
  const root = rootRef.value
  if (!root) return null

  const rootRect = root.getBoundingClientRect()
  const horizontal = isHorizontal.value

  itemCenters = items.value.map((_, index) => {
    const element = itemRefs.value[index]
    if (!element) return Number.NaN
    const rect = element.getBoundingClientRect()
    return horizontal
      ? rect.left - rootRect.left + rect.width / 2
      : rect.top - rootRect.top + rect.height / 2
  })
  return itemCenters
}

function applyPointer(clientX: number, clientY: number) {
  const root = rootRef.value
  if (!root) return

  const centers = itemCenters ?? measureItemCenters()
  if (!centers) return

  const horizontal = isHorizontal.value
  const rootRect = root.getBoundingClientRect()
  const pointer = horizontal ? clientX - rootRect.left : clientY - rootRect.top
  // Influence radius: neighbouring items start growing before the pointer reaches them.
  const radius = Math.max(props.baseSize * 2.5, 1)
  const next = items.value.map(() => 1)

  items.value.forEach((item, index) => {
    if (item.separator || item.disabled) return
    const center = centers[index]
    if (!Number.isFinite(center)) return

    const distance = Math.abs(pointer - center)
    const ratio = Math.max(0, 1 - distance / radius)
    // Smoothstep keeps the falloff soft around the edges.
    const eased = ratio * ratio * (3 - 2 * ratio)
    next[index] = Math.round((1 + (maxScale.value - 1) * eased) * 1000) / 1000
  })

  if (next.some((value, index) => value !== scales.value[index])) {
    scales.value = next
  }
}

function onPointerLeave() {
  pointerRaf.cancel()
  pendingPointer = null
  resetScales()
  activeIndex.value = -1
}

function navigate(item: DockItem) {
  if (!item.url || typeof window === 'undefined') return
  window.open(item.url, item.target ?? '_self', 'noopener,noreferrer')
}

function activate(item: DockItem | undefined, index: number, event: Event) {
  if (!item || item.disabled || item.separator) return

  activeIndex.value = index

  if (typeof item.command === 'function') {
    item.command(item, event)
  } else if (item.url) {
    navigate(item)
  }

  emit('select', item, event)
}

watch(
  () => [props.model, props.position, props.baseSize, props.gap],
  () => invalidateItemCenters(),
)

onMounted(() => {
  resetScales()

  if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
    resizeObserver = new ResizeObserver(invalidateItemCenters)
    resizeObserver.observe(rootRef.value)
  } else if (typeof window !== 'undefined') {
    window.addEventListener('resize', invalidateItemCenters)
  }
})

onBeforeUnmount(() => {
  pointerRaf.cancel()
  pendingPointer = null
  resizeObserver?.disconnect()
  resizeObserver = undefined
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', invalidateItemCenters)
  }
})
</script>

<template>
  <ul
    ref="rootRef"
    class="w-dock"
    :class="`w-dock--${position}`"
    :aria-label="ariaLabel"
    :style="rootStyle"
    @pointerenter="invalidateItemCenters"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <template v-for="(item, index) in items" :key="item.id ?? index">
      <li v-if="item.separator" class="w-dock__separator" aria-hidden="true" />
      <li v-else class="w-dock__item-wrap">
        <button
          :ref="(el) => setItemRef(el, index)"
          type="button"
          class="w-dock__item"
          :class="{ 'is-active': isActive(index), 'is-disabled': item.disabled }"
          :disabled="item.disabled"
          :aria-label="item.label"
          @pointerenter="activeIndex = index"
          @focus="activeIndex = index"
          @click="activate(item, index, $event)"
        >
          <span class="w-dock__inner" :style="itemStyle(index)">
            <slot name="item" :item="item" :index="index" :active="isActive(index)">
              <span class="w-dock__icon">
                <slot name="icon" :item="item">
                  <img
                    v-if="imageSource(item)"
                    class="w-dock__image"
                    :src="imageSource(item)"
                    alt=""
                    draggable="false"
                  />
                  <component
                    :is="componentIcon(item)"
                    v-else-if="componentIcon(item)"
                    class="w-dock__svg"
                  />
                  <span v-else class="w-dock__fallback" aria-hidden="true">
                    {{ item.label.charAt(0) }}
                  </span>
                </slot>
              </span>
            </slot>
          </span>

          <slot v-if="isActive(index)" name="tooltip" :item="item">
            <span class="w-dock__tooltip" aria-hidden="true">{{ item.label }}</span>
          </slot>
        </button>
      </li>
    </template>
  </ul>
</template>
