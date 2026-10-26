<template>
  <aside class="w-view-sider" :class="{ 'w-view-sider-collapsed': collapsed }" :style="siderStyle">
    <div class="w-view-sider__body">
      <div
        :id="contentId"
        class="w-view-sider__content"
        :style="{ width: expandedWidth }"
        :aria-hidden="collapsed"
        :inert="collapsed"
      >
        <slot :collapsed="collapsed" />
      </div>
    </div>

    <div v-if="showTrigger" class="w-view-sider__trigger">
      <slot v-if="slots.trigger" name="trigger" :collapsed="collapsed" :toggle="toggle" />
      <button
        v-else
        type="button"
        class="w-view-sider__trigger-button"
        :aria-label="collapsed ? expandLabel : collapseLabel"
        :title="collapsed ? expandLabel : collapseLabel"
        :aria-controls="contentId"
        :aria-expanded="!collapsed"
        @click="toggle"
      >
        <span class="w-view-sider__trigger-icon" aria-hidden="true">
          <Icon name="i-lucide:chevron-left" :size="14" />
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, inject, useId, type CSSProperties } from 'vue'
import { Icon } from '@wuhu-vue-ui/icon'
import { getCssSize, toCssSize, viewContextKey } from './context'
import { useCollapse } from './useCollapse'
import type { ViewCollapseEmits, ViewSiderProps, ViewSiderSlots } from './types'

const props = withDefaults(defineProps<ViewSiderProps>(), {
  collapsible: false,
  trigger: true,
  collapseLabel: '收起侧栏',
  expandLabel: '展开侧栏',
  width: 240,
  collapsedWidth: 0,
})

const collapsed = defineModel<boolean>('collapsed', { default: false })
const emits = defineEmits<ViewCollapseEmits>()
const slots = defineSlots<ViewSiderSlots>()
defineOptions({ name: 'ViewSider' })

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
