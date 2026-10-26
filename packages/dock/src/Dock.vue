<script setup lang="ts">
import { usePrefersReducedMotion, useRaf } from '@wuhu-vue-ui/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { DockItem, DockProps, DockSlots } from './types'

defineOptions({
  name: 'WDock',
})

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

const itemRefs = ref<(HTMLElement | null)[]>([])
const scales = ref<number[]>([])
const activeIndex = ref(-1)
const reducedMotion = usePrefersReducedMotion()

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

function setItemRef(el: Element | ComponentPublicInstance | null, index: number): void {
  itemRefs.value[index] = el instanceof HTMLElement ? el : null
}

function resetScales(): void {
  scales.value = items.value.map(() => 1)
}

let pendingPointer: { x: number; y: number } | null = null

const pointerRaf = useRaf(() => {
  if (pendingPointer) applyPointer(pendingPointer.x, pendingPointer.y)
})

function onPointerMove(event: PointerEvent): void {
  if (!props.magnification || reducedMotion.value) return

  pendingPointer = { x: event.clientX, y: event.clientY }

  if (typeof requestAnimationFrame === 'undefined') {
    applyPointer(event.clientX, event.clientY)
    return
  }

  pointerRaf.schedule()
}

function applyPointer(clientX: number, clientY: number): void {
  const horizontal = isHorizontal.value
  const pointer = horizontal ? clientX : clientY
  // Influence radius: neighbouring items start growing before the pointer reaches them.
  const radius = Math.max(props.baseSize * 2.5, 1)
  const next = items.value.map(() => 1)

  items.value.forEach((item, index) => {
    if (item.separator || item.disabled) return
    const element = itemRefs.value[index]
    if (!element) return

    const rect = element.getBoundingClientRect()
    const center = horizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2
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

function onPointerLeave(): void {
  pointerRaf.cancel()
  pendingPointer = null
  resetScales()
  activeIndex.value = -1
}

function navigate(item: DockItem): void {
  if (!item.url || typeof window === 'undefined') return
  window.open(item.url, item.target ?? '_self', 'noopener,noreferrer')
}

function activate(item: DockItem | undefined, index: number, event: Event): void {
  if (!item || item.disabled || item.separator) return

  activeIndex.value = index

  if (typeof item.command === 'function') {
    item.command(item, event)
  } else if (item.url) {
    navigate(item)
  }

  emit('select', item, event)
}

watch(reducedMotion, (value) => {
  if (value) resetScales()
})

onMounted(() => {
  resetScales()
})

onBeforeUnmount(() => {
  pointerRaf.cancel()
  pendingPointer = null
})
</script>

<template>
  <ul
    class="w-dock"
    :class="`w-dock--${position}`"
    :aria-label="ariaLabel"
    :style="rootStyle"
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
