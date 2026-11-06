<template>
  <aside
    class="w-view-sider"
    :class="[{ 'w-view-sider-collapsed': collapsed }, props.classes?.root]"
    :style="[siderStyle, props.styles?.root]"
  >
    <div class="w-view-sider__body" :class="props.classes?.body" :style="props.styles?.body">
      <div
        :id="contentId"
        class="w-view-sider__content"
        :class="props.classes?.content"
        :style="[{ width: expandedWidth }, props.styles?.content]"
        :aria-hidden="collapsed"
        :inert="collapsed"
      >
        <slot :collapsed="collapsed" />
      </div>
    </div>

    <div
      v-if="showTrigger"
      class="w-view-sider__trigger"
      :class="props.classes?.trigger"
      :style="props.styles?.trigger"
    >
      <slot v-if="slots.trigger" name="trigger" :collapsed="collapsed" :toggle="toggle" />
      <button
        v-else
        type="button"
        class="w-view-sider__trigger-button"
        :class="props.classes?.triggerButton"
        :style="props.styles?.triggerButton"
        :aria-label="collapsed ? expandLabel : collapseLabel"
        :title="collapsed ? expandLabel : collapseLabel"
        :aria-controls="contentId"
        :aria-expanded="!collapsed"
        @click="toggle"
      >
        <span
          class="w-view-sider__trigger-icon"
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
            <path d="m15 18-6-6 6-6" />
          </svg>
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, inject, useId, type CSSProperties } from 'vue'
import { getCssSize, toCssSize, viewContextKey } from './context'
import { useCollapse } from './useCollapse'
import type { ViewCollapseEmits, ViewSiderProps, ViewSiderSlots } from './types'

const props = withDefaults(defineProps<ViewSiderProps>(), {
  collapsible: false,
  trigger: true,
  width: 240,
  collapsedWidth: 0,
})

const collapseLabel = '收起侧栏'
const expandLabel = '展开侧栏'

const collapsed = defineModel<boolean>('collapsed', { default: false })
const emits = defineEmits<ViewCollapseEmits>()
const slots = defineSlots<ViewSiderSlots>()

const contentId = useId()
const viewContext = inject(viewContextKey, null)
const { showTrigger, toggle } = useCollapse(collapsed, props, emits)
const expandedWidth = computed(() => toCssSize(props.width))

const siderStyle = computed<CSSProperties>(() => {
  const width = toCssSize(collapsed.value ? props.collapsedWidth : props.width)
  const gap = viewContext?.gap.value ?? '0px'
  const shouldOffsetGap = collapsed.value && viewContext?.direction.value === 'horizontal'

  return {
    width,
    flexBasis: width,
    marginInlineEnd: shouldOffsetGap ? getCssSize(gap) : '0px',
  }
})
</script>
