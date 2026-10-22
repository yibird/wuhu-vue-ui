<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import { ErrorBoundary } from '@wuhu-ui/error-boundary'
import type { ErrorBoundaryErrorEvent } from '@wuhu-ui/error-boundary'
import DemoCard from '../components/demo-card.vue'

const crashDemo = ref(false)
const customCrash = ref(false)
const errorSeen = ref('')

function handleBoundaryError(event: ErrorBoundaryErrorEvent) {
  errorSeen.value = event.error instanceof Error ? event.error.message : '未知错误'
}

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
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="默认回退与重试" description="捕获后代渲染错误，展示堆栈信息并支持重置。">
      <div class="error-demo__actions">
        <button type="button" class="button button--danger button--small" @click="crashDemo = true">
          触发渲染错误
        </button>
        <span v-if="errorSeen" class="hint">{{ errorSeen }}</span>
      </div>

      <ErrorBoundary :show-details="true" @error="handleBoundaryError" @reset="crashDemo = false">
        <BuggyPanel :crash="crashDemo" />
      </ErrorBoundary>
    </DemoCard>

    <DemoCard
      title="自定义回退"
      description="fallback 插槽拿到 error、reset 与实例，可替换整个降级界面。"
    >
      <button type="button" class="button button--danger button--small" @click="customCrash = true">
        触发错误
      </button>

      <ErrorBoundary @reset="customCrash = false">
        <BuggyPanel :crash="customCrash" />
        <template #fallback="{ error, reset }">
          <div class="boundary-custom">
            <span class="boundary-custom__badge">Fallback</span>
            <strong>这个区块暂时不可用</strong>
            <p>{{ error instanceof Error ? error.message : String(error) }}</p>
            <button type="button" class="button button--small" @click="reset">重新加载区块</button>
          </div>
        </template>
      </ErrorBoundary>
    </DemoCard>
  </div>
</template>
