<template>
  <aside class="w-view-sider" :class="{ 'w-view-sider-collapsed': collapsed }" :style="siderStyle">
    <div class="w-view-sider__body" v-bind="$attrs">
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
import type { ViewCollapseEmits, WViewSiderProps, WViewSiderSlots } from './types'
import { useCollapse } from './useCollapse'

const props = withDefaults(defineProps<WViewSiderProps>(), {
  collapsible: false,
  trigger: true,
  collapseLabel: '收起侧栏',
  expandLabel: '展开侧栏',
  width: 240,
  collapsedWidth: 0,
})

const collapsed = defineModel<boolean>('collapsed', { default: false })
const emits = defineEmits<ViewCollapseEmits>()
const slots = defineSlots<WViewSiderSlots>()
defineOptions({ name: 'WViewSider', inheritAttrs: false })

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

<style lang="less" scoped>
.w-view-sider {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: visible;
  transition:
    width var(--w-duration-normal, 220ms) var(--w-easing-emphasized, ease),
    flex-basis var(--w-duration-normal, 220ms) var(--w-easing-emphasized, ease),
    margin-inline-end var(--w-duration-normal, 220ms) var(--w-easing-emphasized, ease);

  &__body {
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  &__content {
    box-sizing: border-box;
    height: 100%;
    min-height: 100%;
    overflow: hidden;
    transition:
      opacity var(--w-duration-fast, 120ms) var(--w-easing-standard, ease),
      transform var(--w-duration-normal, 220ms) var(--w-easing-emphasized, ease);
  }

  &__trigger {
    position: absolute;
    top: 50%;
    right: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(50%, -50%);

    &-button {
      display: inline-grid;
      place-items: center;
      width: 26px;
      height: 48px;
      padding: 0;
      color: var(--w-color-text-secondary, #475569);
      cursor: pointer;
      background: var(--w-color-surface, #ffffff);
      border: 1px solid var(--w-color-border, #e2e8f0);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);

      &:hover .w-view-sider__trigger-icon {
        scale: 1.16;
      }

      &:active .w-view-sider__trigger-icon {
        scale: 1.08;
      }

      &:focus-visible {
        outline: 2px solid var(--w-color-primary, #4f46e5);
        outline-offset: 2px;
      }
    }

    &-icon {
      display: grid;
      place-items: center;
      transition: scale var(--w-duration-fast, 120ms) var(--w-easing-emphasized, ease);
    }
  }

  &.w-view-sider-collapsed {
    .w-view-sider__content {
      pointer-events: none;
      opacity: 0;
      transform: translateX(-8px);
    }

    .w-view-sider__trigger-icon {
      transform: rotate(180deg);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .w-view-sider,
  .w-view-sider__content,
  .w-view-sider__trigger-button,
  .w-view-sider__trigger-icon {
    transition: none;
  }
}
</style>
