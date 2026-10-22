import './src/style/index.less'

export { default as Loading } from './src/Loading.vue'
export { createLoading, destroyAllLoadings, destroyLoading } from './src/hooks/createLoading'
export { useLoading } from './src/hooks/useLoading'
export type {
  LoadingAnimation,
  LoadingClasses,
  LoadingClassValue,
  LoadingGradient,
  LoadingInstance,
  LoadingOptions,
  LoadingProps,
  LoadingSlots,
  LoadingStyles,
  UseLoadingReturn,
} from './src/types'
