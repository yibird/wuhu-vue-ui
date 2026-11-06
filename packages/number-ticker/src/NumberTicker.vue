<script setup lang="ts">
import { useRaf } from '@wuhu-vue-ui/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { NumberTickerCharacter, NumberTickerProps } from './types'

const props = withDefaults(defineProps<NumberTickerProps>(), {
  startValue: 0,
  duration: 800,
  decimals: 0,
  locale: 'zh-CN',
  useGrouping: true,
  prefix: '',
  suffix: '',
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  animateOnMount: true,
})

const displayValue = ref(props.animateOnMount ? props.startValue : props.value)
/**
 * Two frames: the first paints `startValue`, the second switches to the target
 * value so the CSS wheel transition has a real starting position to animate from.
 */
const MOUNT_ANIMATION_FRAMES = 2
let mountedFrames = 0

const mountRaf = useRaf(() => {
  if (unmounted) return
  mountedFrames += 1
  if (mountedFrames >= MOUNT_ANIMATION_FRAMES) {
    displayValue.value = props.value
    return
  }
  mountRaf.schedule()
})

const normalizedDecimals = computed(() => {
  const value = Number.isFinite(props.decimals) ? Math.trunc(props.decimals) : 0
  return Math.min(20, Math.max(0, value))
})

const numberFormatter = computed<Intl.NumberFormat | null>(() => {
  try {
    return new Intl.NumberFormat(props.locale, {
      minimumFractionDigits: normalizedDecimals.value,
      maximumFractionDigits: normalizedDecimals.value,
      useGrouping: props.useGrouping,
    })
  } catch {
    return null
  }
})

const digitGlyphs = computed(() => {
  const fallback = Array.from({ length: 10 }, (_, index) => String(index))
  if (!numberFormatter.value) return fallback

  try {
    const formatter = new Intl.NumberFormat(props.locale, {
      useGrouping: false,
      maximumFractionDigits: 0,
    })
    return Array.from({ length: 10 }, (_, index) => formatter.format(index))
  } catch {
    return fallback
  }
})

const digitLookup = computed(() => {
  const lookup = new Map<string, number>()
  digitGlyphs.value.forEach((glyph, index) => {
    if (Array.from(glyph).length === 1) lookup.set(glyph, index)
  })
  return lookup
})

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return (0).toFixed(normalizedDecimals.value)
  if (numberFormatter.value) return numberFormatter.value.format(value)
  return value.toFixed(normalizedDecimals.value)
}

const characters = computed<NumberTickerCharacter[]>(() =>
  Array.from(formatNumber(displayValue.value)).map((char) => ({
    char,
    digit: digitLookup.value.get(char) ?? null,
  })),
)

const accessibleLabel = computed(() => `${props.prefix}${formatNumber(props.value)}${props.suffix}`)

const style = computed(() => ({
  '--w-number-ticker-duration': `${Math.max(0, props.duration)}ms`,
  '--w-number-ticker-easing': props.easing,
}))

watch(
  () => props.value,
  (value) => {
    displayValue.value = value
  },
)

watch(
  () => [props.locale, props.decimals, props.useGrouping],
  () => {
    displayValue.value = props.value
  },
)

let unmounted = false

onMounted(() => {
  if (!props.animateOnMount || displayValue.value === props.value) return

  nextTick(() => {
    if (unmounted) return
    mountedFrames = 0
    mountRaf.schedule()
  })
})

onBeforeUnmount(() => {
  unmounted = true
  mountRaf.cancel()
})

defineExpose({
  formatted: accessibleLabel,
})
</script>

<template>
  <span
    class="w-number-ticker"
    role="img"
    :aria-label="accessibleLabel"
    :aria-live="ariaLive"
    :aria-atomic="ariaAtomic"
    :style="style"
  >
    <span class="w-number-ticker__visual" aria-hidden="true">
      <span v-if="prefix" class="w-number-ticker__affix">{{ prefix }}</span>
      <!--
        Key from the right so adding/removing a leading digit (e.g. 99 -> 100)
        keeps existing digit wheels mounted and the right-aligned roll stable.
      -->
      <template v-for="(character, index) in characters" :key="characters.length - index">
        <span v-if="character.digit !== null" class="w-number-ticker__digit">
          <span
            class="w-number-ticker__strip"
            :style="{ transform: `translateY(calc(-${character.digit} * 1.2em))` }"
          >
            <span v-for="(digit, digitIndex) in digitGlyphs" :key="digitIndex">{{ digit }}</span>
          </span>
        </span>
        <span v-else class="w-number-ticker__char">{{ character.char }}</span>
      </template>
      <span v-if="suffix" class="w-number-ticker__affix">{{ suffix }}</span>
    </span>
  </span>
</template>
