<script setup lang="ts">
import { ref } from 'vue'
import { Tooltip, vTooltip } from '@wuhu-vue-ui/tooltip'
import DemoCard from '../components/demo-card.vue'

const placements = ['top', 'bottom', 'left', 'right'] as const

const anchorEl = ref<HTMLElement | null>(null)
const anchorOpen = ref(false)
const controlledOpen = ref(false)
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="四个方向"
      description="组件包裹触发元素，Floating UI 负责翻转与视口内避让。"
      wide
    >
      <div class="tooltip-demo__row">
        <Tooltip
          v-for="placement in placements"
          :key="placement"
          :content="`${placement} 方向提示`"
          :placement="placement"
        >
          <button type="button" class="button">{{ placement }}</button>
        </Tooltip>
      </div>
    </DemoCard>

    <DemoCard
      title="延迟与禁用"
      description="showDelay / hideDelay 控制显示隐藏节奏；disabled 时完全不响应。"
    >
      <div class="tooltip-demo__row">
        <Tooltip content="300ms 后出现" :show-delay="300" :hide-delay="150">
          <button type="button" class="button">延迟提示</button>
        </Tooltip>
        <Tooltip content="不会出现" disabled>
          <button type="button" class="button">禁用</button>
        </Tooltip>
      </div>
    </DemoCard>

    <DemoCard
      title="受控与锚点"
      description="v-model:open 控制显隐；anchor 指向外部元素时只渲染浮层。"
    >
      <div class="tooltip-demo__row">
        <button type="button" class="button" @click="controlledOpen = !controlledOpen">
          {{ controlledOpen ? '关闭' : '打开' }}受控提示
        </button>
        <Tooltip v-model:open="controlledOpen" content="受控 Tooltip" placement="bottom">
          <span class="tooltip-demo__anchor-target">悬浮触发元素</span>
        </Tooltip>

        <button ref="anchorEl" type="button" class="button" @click="anchorOpen = !anchorOpen">
          切换锚点提示
        </button>
        <Tooltip
          :anchor="anchorEl"
          :open="anchorOpen"
          placement="right"
          @update:open="anchorOpen = $event"
        >
          <template #content>
            <strong>锚点模式</strong>
            <span>：浮层定位到外部元素，不额外包裹触发节点。</span>
          </template>
        </Tooltip>
      </div>
    </DemoCard>

    <DemoCard
      title="指令"
      description="v-tooltip 适合给已有图标按钮补充提示，不会改变原有 DOM 结构。"
    >
      <div class="tooltip-demo__row">
        <button
          type="button"
          class="tooltip-demo__icon"
          aria-label="复制链接"
          v-tooltip="'复制链接'"
        >
          ⧉
        </button>
        <button type="button" class="tooltip-demo__icon" aria-label="刷新" v-tooltip="'刷新'">
          ↻
        </button>
        <button
          type="button"
          class="tooltip-demo__icon"
          aria-label="设置"
          v-tooltip="{ content: '设置', placement: 'bottom' }"
        >
          ⚙
        </button>
      </div>
    </DemoCard>
  </div>
</template>

<style scoped>
.tooltip-demo__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.tooltip-demo__anchor-target {
  display: inline-flex;
  padding: 6px 12px;
  border: 1px dashed var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-sm, 13px);
}

.tooltip-demo__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #ffffff);
  color: var(--w-color-text, #0f172a);
  font-size: 16px;
  cursor: pointer;
}

.tooltip-demo__icon:hover {
  background: var(--w-color-surface-hover, #f1f5f9);
}
</style>
