<script setup lang="ts">
import { computed, useId } from 'vue'
import Illustration from './Illustration.vue'
import type { ExceptionProps, ExceptionSlotProps, ExceptionType } from './types'

defineOptions({
  name: 'WException',
})

const props = withDefaults(defineProps<ExceptionProps>(), {
  type: 'notFound',
  imageAlt: '',
  imageWidth: 340,
  showImage: true,
})

defineSlots<{
  image?: (props: ExceptionSlotProps) => unknown
  title?: (props: ExceptionSlotProps) => unknown
  description?: (props: ExceptionSlotProps) => unknown
  default?: (props: ExceptionSlotProps) => unknown
}>()

const presets: Record<ExceptionType, { title: string; description: string }> = {
  badRequest: {
    title: '请求错误',
    description: '抱歉，请求参数有误，请检查后重试。',
  },
  forbidden: {
    title: '无访问权限',
    description: '抱歉，你没有权限访问该页面。如需访问，请联系管理员。',
  },
  notFound: {
    title: '页面不存在',
    description: '抱歉，你访问的页面不存在或已被移除。',
  },
  serverError: {
    title: '服务端错误',
    description: '抱歉，服务器开小差了，请稍后重试。',
  },
  networkError: {
    title: '网络异常',
    description: '抱歉，网络连接异常，请检查网络后重试。',
  },
}

const titleId = useId()
const preset = computed(() => presets[props.type] ?? presets.notFound)
const title = computed(() => props.title ?? preset.value.title)
const description = computed(() => props.description ?? preset.value.description)
const alt = computed(() => props.imageAlt || title.value)

const mediaStyle = computed(() => ({
  '--w-exception-image-width':
    typeof props.imageWidth === 'number' ? `${props.imageWidth}px` : props.imageWidth,
}))

const slotProps = computed<ExceptionSlotProps>(() => ({
  type: props.type,
  title: title.value,
  description: description.value,
}))
</script>

<template>
  <section
    class="w-exception"
    :class="[`w-exception--${type}`, classes?.root]"
    :style="styles?.root"
    :aria-labelledby="titleId"
  >
    <div
      v-if="showImage"
      class="w-exception__media"
      :class="classes?.media"
      :style="[mediaStyle, styles?.media]"
    >
      <slot name="image" v-bind="slotProps">
        <img
          v-if="image"
          class="w-exception__image"
          :class="classes?.image"
          :style="styles?.image"
          :src="image"
          :alt="alt"
        />
        <Illustration
          v-else
          class="w-exception__illustration"
          :class="classes?.illustration"
          :style="styles?.illustration"
          :type="type"
        />
      </slot>
    </div>

    <div class="w-exception__content" :class="classes?.content" :style="styles?.content">
      <h2 :id="titleId" class="w-exception__title" :class="classes?.title" :style="styles?.title">
        <slot name="title" v-bind="slotProps">{{ title }}</slot>
      </h2>
      <p
        class="w-exception__description"
        :class="classes?.description"
        :style="styles?.description"
      >
        <slot name="description" v-bind="slotProps">{{ description }}</slot>
      </p>
      <div
        v-if="$slots.default"
        class="w-exception__extra"
        :class="classes?.extra"
        :style="styles?.extra"
      >
        <slot v-bind="slotProps" />
      </div>
    </div>
  </section>
</template>
