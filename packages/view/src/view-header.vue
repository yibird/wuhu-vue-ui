<template>
  <header
    class="w-view-header"
    :class="[{ 'w-view-header-collapsed': collapsed }, props.classes?.root]"
    :style="[headerStyle, props.styles?.root]"
  >
    <div
      :id="contentId"
      class="w-view-header__body"
      :class="props.classes?.body"
      :style="props.styles?.body"
      :aria-hidden="collapsed"
      :inert="collapsed"
    >
      <div
        class="w-view-header__content"
        :class="props.classes?.content"
        :style="props.styles?.content"
      >
        <slot :collapsed="collapsed" />
      </div>
    </div>

    <div
      v-if="showTrigger"
      class="w-view-header__trigger"
      :class="props.classes?.trigger"
      :style="props.styles?.trigger"
    >
      <slot v-if="slots.trigger" name="trigger" :collapsed="collapsed" :toggle="toggle" />
      <button
        v-else
        type="button"
        class="w-view-header__trigger-button"
        :class="props.classes?.triggerButton"
        :style="props.styles?.triggerButton"
        :aria-label="collapsed ? expandLabel : collapseLabel"
        v-tooltip="collapsed ? expandLabel : collapseLabel"
        :aria-controls="contentId"
        :aria-expanded="!collapsed"
        @click="toggle"
      >
        <span
          class="w-view-header__trigger-icon"
          :class="props.classes?.triggerIcon"
          :style="props.styles?.triggerIcon"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            focusable="false"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { vTooltip } from '@wuhu-vue-ui/tooltip'
import { getCssSize, viewContextKey } from './context'
import type { ViewCollapseEmits, ViewHeaderProps, ViewHeaderSlots } from './types'
import { useCollapse } from './useCollapse'
import { computed, inject, useId, type CSSProperties } from 'vue'

const props = withDefaults(defineProps<ViewHeaderProps>(), {
  collapsible: false,
  trigger: true,
})

const collapseLabel = '收起头部'
const expandLabel = '展开头部'

const collapsed = defineModel<boolean>('collapsed', { default: false })
const emits = defineEmits<ViewCollapseEmits>()
const slots = defineSlots<ViewHeaderSlots>()

const contentId = useId()
const viewContext = inject(viewContextKey, null)
const { showTrigger, toggle } = useCollapse(collapsed, props, emits)
const headerStyle = computed<CSSProperties>(() => {
  const gap = viewContext?.gap.value ?? '0px'
  const shouldOffsetGap = collapsed.value && viewContext?.direction.value === 'vertical'

  return {
    marginBlockEnd: shouldOffsetGap ? getCssSize(gap) : '0px',
  }
})
</script>
