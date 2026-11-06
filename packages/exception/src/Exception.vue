<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { getExceptionPreset } from './config'
import Illustration from './Illustration.vue'
import type { ExceptionProps, ExceptionSlotProps, ExceptionType } from './types'

const props = withDefaults(defineProps<ExceptionProps>(), {
  type: 'notFound',
  showImage: true,
})

const emit = defineEmits<{
  'image-error': [image: string, event: Event]
}>()

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
// Resolve the runtime type once so class names, illustrations and presets all
// agree even when an out-of-range value is passed from untyped templates.
const resolvedType = computed<ExceptionType>(() =>
  Object.prototype.hasOwnProperty.call(presets, props.type) ? props.type : 'notFound',
)
const preset = computed(() => presets[resolvedType.value] ?? presets.notFound)
const globalPreset = computed(() => getExceptionPreset(resolvedType.value))
const title = computed(() => props.title ?? globalPreset.value?.title ?? preset.value.title)
const description = computed(
  () => props.description ?? globalPreset.value?.description ?? preset.value.description,
)
const image = computed(() => props.image ?? globalPreset.value?.image)
const imageFailed = ref(false)

watch(image, () => {
  imageFailed.value = false
})

function handleImageError(event: Event) {
  const src = image.value
  imageFailed.value = true
  if (src) emit('image-error', src, event)
}

const slotProps = computed<ExceptionSlotProps>(() => ({
  type: resolvedType.value,
  title: title.value,
  description: description.value,
}))
</script>

<template>
  <section
    class="w-exception"
    :class="[`w-exception--${resolvedType}`, classes?.root]"
    :style="styles?.root"
    :aria-labelledby="titleId"
  >
    <div v-if="showImage" class="w-exception__media" :class="classes?.media" :style="styles?.media">
      <slot name="image" v-bind="slotProps">
        <img
          v-if="image && !imageFailed"
          class="w-exception__image"
          :class="classes?.image"
          :style="styles?.image"
          :src="image"
          :alt="title"
          @error="handleImageError"
        />
        <Illustration
          v-else
          class="w-exception__illustration"
          :class="classes?.illustration"
          :style="styles?.illustration"
          :type="resolvedType"
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
