import './src/style/index.less'

export { default as Time } from './src/Time.vue'
export { formatDateTime, formatRelativeTime, toDate } from './src/relative'
export type { RelativeTimeOptions, TimeInput } from './src/relative'
export { useRelativeTime } from './src/useRelativeTime'
export type { UseRelativeTimeOptions, UseRelativeTimeReturn } from './src/useRelativeTime'
export type { TimeProps, TimeSlotProps } from './src/types'
