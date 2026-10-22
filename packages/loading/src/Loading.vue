<script setup lang="ts">
import { computed, onBeforeUnmount, useAttrs, watch, type Component, type CSSProperties } from 'vue'
import Bars from './components/Bars.vue'
import Beat from './components/Beat.vue'
import Pulse from './components/Pulse.vue'
import Ring from './components/Ring.vue'
import Spinner from './components/Spinner.vue'
import { lockBodyScroll, unlockBodyScroll } from './hooks/scrollLock'
import type { LoadingAnimation, LoadingProps, LoadingSlots } from './types'

defineOptions({
  name: 'WLoading',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<LoadingProps>(), {
  animation: 'ring',
  full: false,
  open: true,
  size: 40,
  color: undefined,
  gradient: false,
  title: undefined,
  description: undefined,
  mask: true,
  lockScroll: true,
  zIndex: 2000,
  teleport: 'body',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

defineSlots<LoadingSlots>()

const attrs = useAttrs()

const animations: Record<LoadingAnimation, Component> = {
  bars: Bars,
  beat: Beat,
  pulse: Pulse,
  ring: Ring,
  spinner: Spinner,
}

const currentAnimation = computed(() => animations[props.animation] ?? Ring)

const gradientValue = computed(() => {
  const value = props.gradient

  if (!value) return undefined

  if (value === true) {
    // A soft radial highlight in the top-left corner plus a subtle 158deg
    // linear wash. Relative gradient sizes keep it responsive, and mixing the
    // primary color into the theme surface keeps it subtle in both themes.
    return [
      'radial-gradient(120% 90% at 0% 0%,',
      'color-mix(in srgb, var(--w-color-primary, #4f46e5) 8%, transparent),',
      'transparent 72%),',
      'linear-gradient(158deg,',
      'var(--w-color-surface, #fff) 0%,',
      'var(--w-color-surface, #fff) 48%,',
      'color-mix(in srgb, var(--w-color-primary, #4f46e5) 7%, var(--w-color-surface, #fff)) 100%)',
    ].join(' ')
  }

  if (Array.isArray(value)) {
    const colors = value.filter(Boolean)
    if (colors.length === 0) return undefined
    if (colors.length === 1) return colors[0]
    return `linear-gradient(135deg, ${colors.join(', ')})`
  }

  return value
})

const strokeColor = computed(() => props.color ?? 'var(--w-color-primary, #4f46e5)')

const rootStyle = computed<CSSProperties>(() => ({
  zIndex: props.full ? props.zIndex : undefined,
  '--w-loading-primary': strokeColor.value,
  '--w-loading-size': toCssUnit(props.size),
  ...(gradientValue.value ? { '--w-loading-gradient': gradientValue.value } : {}),
}))

const restAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const teleportTarget = computed(() => props.teleport ?? 'body')

function toCssUnit(value: string | number | undefined): string | undefined {
  return typeof value === 'number' ? `${value}px` : value
}

let scrollLocked = false

function syncScrollLock(): void {
  const shouldLock = props.full && props.open && props.lockScroll

  if (shouldLock && !scrollLocked) {
    lockBodyScroll()
    scrollLocked = true
  } else if (!shouldLock && scrollLocked) {
    unlockBodyScroll()
    scrollLocked = false
  }
}

watch(() => [props.full, props.open, props.lockScroll], syncScrollLock, { immediate: true })

onBeforeUnmount(() => {
  if (!scrollLocked) return
  unlockBodyScroll()
  scrollLocked = false
})

function close(): void {
  emit('update:open', false)
}

defineExpose({
  close,
})
</script>

<template>
  <Teleport :to="teleportTarget" :disabled="!full">
    <Transition name="w-loading-fade">
      <div
        v-if="open"
        v-bind="restAttrs"
        class="w-loading"
        :class="[
          attrs.class,
          props.classes?.root,
          {
            'w-loading--full': full,
            'w-loading--masked': full && mask,
            [`w-loading--${animation}`]: true,
          },
        ]"
        :style="[rootStyle, attrs.style, props.styles?.root]"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          class="w-loading__content"
          :class="props.classes?.content"
          :style="props.styles?.content"
        >
          <div
            class="w-loading__indicator"
            :class="props.classes?.indicator"
            :style="props.styles?.indicator"
          >
            <slot>
              <component :is="currentAnimation" />
            </slot>
          </div>

          <div
            v-if="title || $slots.title"
            class="w-loading__title"
            :class="props.classes?.title"
            :style="props.styles?.title"
          >
            <slot name="title">{{ title }}</slot>
          </div>
          <div
            v-if="description || $slots.description"
            class="w-loading__description"
            :class="props.classes?.description"
            :style="props.styles?.description"
          >
            <slot name="description">{{ description }}</slot>
          </div>

          <span
            v-if="!title && !$slots.title && !description && !$slots.description"
            class="w-loading__sr-only"
          >
            加载中
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
