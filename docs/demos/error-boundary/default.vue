<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import { Button } from 'antdv-next'
import { ErrorBoundary } from '@wuhu-vue-ui/error-boundary'
import type { ErrorBoundaryErrorEvent } from '@wuhu-vue-ui/error-boundary'

const crash = ref(false)
const seen = ref('')

const BuggyPanel = defineComponent({
  name: 'BuggyPanel',
  props: {
    crash: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      if (props.crash) throw new Error('模拟渲染异常：无法读取面板配置')
      return h('div', { class: 'buggy-panel' }, [
        h('strong', '组件运行正常'),
        h('span', '点击上方按钮触发一次渲染错误，错误边界会兜底并支持重试。'),
      ])
    }
  },
})

function handleError(event: ErrorBoundaryErrorEvent) {
  seen.value = event.error instanceof Error ? event.error.message : '未知错误'
}
</script>

<template>
  <div class="error-demo__actions">
    <Button danger @click="crash = true">触发渲染错误</Button>
    <span v-if="seen" class="hint">{{ seen }}</span>
  </div>

  <ErrorBoundary :show-details="true" @error="handleError" @reset="crash = false">
    <BuggyPanel :crash="crash" />
  </ErrorBoundary>
</template>

<style lang="less">
.boundary-custom {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  margin-top: 12px;
  padding: 16px;
  border: 1px solid var(--w-color-danger-soft);
  border-radius: var(--w-radius-md);
  background: var(--w-color-danger-soft);

  &__badge {
    padding: 2px 6px;
    border-radius: var(--w-radius-xs);
    background: var(--w-color-danger);
    color: var(--w-color-text-inverse);
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
  }

  strong {
    font-size: var(--w-font-size-sm);
  }

  p {
    margin: 0 0 6px;
    color: var(--w-color-text-secondary);
    font-size: var(--w-font-size-xs);
  }
}
.error-demo__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  .hint {
    margin: 0;
  }
}

.buggy-panel {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 22px;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  background: var(--w-color-surface-subtle);

  strong {
    font-size: 13px;
    font-weight: 600;
  }

  span {
    color: var(--w-color-text-secondary);
    font-size: 11px;
  }
}
</style>
