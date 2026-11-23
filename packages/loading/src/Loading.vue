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
  zIndex: 2000,
  teleport: 'body',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'after-leave': []
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

const resolvedAnimation = computed<LoadingAnimation>(() =>
  Object.prototype.hasOwnProperty.call(animations, props.animation) ? props.animation : 'ring',
)
const currentAnimation = computed(() => animations[resolvedAnimation.value] ?? Ring)

const gradientValue = computed<string | undefined>(() => {
  const value = props.gradient

  if (!value) return undefined

  if (value === true) {
    // A soft radial highlight in the top-left corner plus a subtle 158deg
    // linear wash. Relative gradient sizes keep it responsive, and mixing the
    // primary color into the theme surface keeps it subtle in both themes.
    return [
      'radial-gradient(120% 90% at 0% 0%,',
      'color-mix(in srgb, var(--w-loading-color-primary) 8%, transparent),',
      'transparent 72%),',
      'linear-gradient(158deg,',
      'var(--w-loading-color-surface) 0%,',
      'var(--w-loading-color-surface) 48%,',
      'color-mix(in srgb, var(--w-loading-color-primary) 7%, var(--w-loading-color-surface)) 100%)',
    ].join(' ')
  }

  if (typeof value === 'string') return value

  const colors = value.filter(Boolean)
  if (colors.length === 0) return undefined
  // A single stop is duplicated so the value stays a real gradient instead
  // of silently degrading into a solid background color.
  if (colors.length === 1) return `linear-gradient(135deg, ${colors[0]}, ${colors[0]})`
  return `linear-gradient(135deg, ${colors.join(', ')})`
})

const strokeColor = computed(() => props.color ?? 'var(--w-loading-color-primary)')

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

function syncScrollLock() {
  const shouldLock = props.full && props.open

  if (shouldLock && !scrollLocked) {
    lockBodyScroll()
    scrollLocked = true
  } else if (!shouldLock && scrollLocked) {
    unlockBodyScroll()
    scrollLocked = false
  }
}

watch(() => [props.full, props.open], syncScrollLock, { immediate: true })

onBeforeUnmount(() => {
  if (!scrollLocked) return
  unlockBodyScroll()
  scrollLocked = false
})

function close() {
  emit('update:open', false)
}

defineExpose({
  close,
})
</script>

<template>
  <Teleport :to="teleportTarget" :disabled="!full">
    <Transition name="w-loading-fade" @after-leave="emit('after-leave')">
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
            [`w-loading--${resolvedAnimation}`]: true,
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
