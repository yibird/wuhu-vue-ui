<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from './relative'
import { useRelativeTime } from './useRelativeTime'
import type { TimeProps, TimeSlotProps } from './types'

const props = withDefaults(defineProps<TimeProps>(), {
  locale: 'zh-CN',
  numeric: 'auto',
  formatStyle: 'long',
  refreshInterval: 30_000,
  showTitle: true,
  emptyText: '--',
})

const emit = defineEmits<{
  refresh: [now: Date]
}>()

defineSlots<{
  default?: (props: TimeSlotProps) => unknown
}>()

const {
  date,
  now: nowDate,
  relative,
  refresh,
} = useRelativeTime({
  time: () => props.time,
  now: () => props.now,
  locale: () => props.locale,
  numeric: () => props.numeric,
  style: () => props.formatStyle,
  refreshInterval: () => props.refreshInterval,
  emptyText: () => props.emptyText,
  formatter: computed(() => props.formatter),
  onRefresh: (value) => emit('refresh', value),
})

const title = computed(() => {
  if (!props.showTitle || !date.value) return undefined
  return formatDateTime(date.value, props.locale, props.titleFormat)
})

const datetime = computed(() => date.value?.toISOString())

const slotProps = computed<TimeSlotProps>(() => ({
  relative: relative.value,
  date: date.value,
  now: nowDate.value,
  title: title.value,
  datetime: datetime.value,
  refresh,
}))

defineExpose({
  date,
  relative,
  refresh,
})
</script>

<template>
  <time class="w-time" :class="{ 'is-empty': !date }" :datetime="datetime" :title="title">
    <slot v-bind="slotProps">{{ relative }}</slot>
  </time>
</template>
