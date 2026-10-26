<template>
  <header
    class="w-view-header"
    :class="{ 'w-view-header-collapsed': collapsed }"
    :style="headerStyle"
  >
    <div :id="contentId" class="w-view-header__body" :aria-hidden="collapsed" :inert="collapsed">
      <div class="w-view-header__content">
        <slot :collapsed="collapsed" />
      </div>
    </div>

    <div v-if="showTrigger" class="w-view-header__trigger">
      <slot v-if="slots.trigger" name="trigger" :collapsed="collapsed" :toggle="toggle" />
      <button
        v-else
        type="button"
        class="w-view-header__trigger-button"
        :aria-label="collapsed ? expandLabel : collapseLabel"
        :title="collapsed ? expandLabel : collapseLabel"
        :aria-controls="contentId"
        :aria-expanded="!collapsed"
        @click="toggle"
      >
        <span class="w-view-header__trigger-icon" aria-hidden="true">
          <Icon name="i-lucide:chevron-up" :size="14" />
        </span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Icon } from '@wuhu-vue-ui/icon'
import { getCssSize, viewContextKey } from './context'
import type { ViewCollapseEmits, ViewHeaderProps, ViewHeaderSlots } from './types'
import { useCollapse } from './useCollapse'
import { computed, inject, useId, type CSSProperties } from 'vue'

const props = withDefaults(defineProps<ViewHeaderProps>(), {
  collapsible: false,
  trigger: true,
  collapseLabel: '收起头部',
  expandLabel: '展开头部',
})

const collapsed = defineModel<boolean>('collapsed', { default: false })
const emits = defineEmits<ViewCollapseEmits>()
const slots = defineSlots<ViewHeaderSlots>()
defineOptions({ name: 'ViewHeader' })

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
