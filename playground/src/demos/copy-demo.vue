<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Copy } from '@wuhu-vue-ui/copy'
import DemoCard from '../components/demo-card.vue'

type FeedbackState = 'idle' | 'success' | 'error'

const inviteCode = 'WUHU-VUE-UI-2026'
const defaultFeedback = '只有图标会触发复制，文字可以正常选中'
const copyErrorMessage = '复制失败 · 浏览器拒绝了剪贴板访问，请手动选择文本复制'
const feedback = ref(defaultFeedback)
const feedbackState = ref<FeedbackState>('idle')
const installFeedback = ref('异步取数期间按钮会进入 loading 状态。')
const installFeedbackState = ref<FeedbackState>('idle')
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
let installFeedbackTimer: ReturnType<typeof setTimeout> | undefined

function scheduleReset(reset: () => void) {
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(reset, 2600)
}

function scheduleInstallReset(reset: () => void) {
  if (installFeedbackTimer) clearTimeout(installFeedbackTimer)
  installFeedbackTimer = setTimeout(reset, 2600)
}

function handleSuccess(text: string) {
  feedback.value = `复制成功 · ${text.length} 个字符`
  feedbackState.value = 'success'
  scheduleReset(() => {
    feedback.value = defaultFeedback
    feedbackState.value = 'idle'
  })
}

function handleError() {
  feedback.value = copyErrorMessage
  feedbackState.value = 'error'
  scheduleReset(() => {
    feedback.value = defaultFeedback
    feedbackState.value = 'idle'
  })
}

function handleInstallSuccess(text: string) {
  installFeedback.value = `复制成功 · ${text.length} 个字符`
  installFeedbackState.value = 'success'
  scheduleInstallReset(() => {
    installFeedback.value = '异步取数期间按钮会进入 loading 状态。'
    installFeedbackState.value = 'idle'
  })
}

function handleInstallError() {
  installFeedback.value = copyErrorMessage
  installFeedbackState.value = 'error'
  scheduleInstallReset(() => {
    installFeedback.value = '异步取数期间按钮会进入 loading 状态。'
    installFeedbackState.value = 'idle'
  })
}

async function copyInstallCommand() {
  await new Promise((resolve) => setTimeout(resolve, 360))
  return 'pnpm add @wuhu-vue-ui/copy'
}

onBeforeUnmount(() => {
  if (feedbackTimer) clearTimeout(feedbackTimer)
  if (installFeedbackTimer) clearTimeout(installFeedbackTimer)
})
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="基础复制" description="showIcon 默认为 true，此时只有图标会触发复制。">
      <div class="copy-demo">
        <div class="copy-demo__code">
          <span>邀请码</span>
          <code>{{ inviteCode }}</code>
        </div>
        <Copy :text="() => inviteCode" @success="handleSuccess" @error="handleError" />
      </div>
      <p
        class="hint"
        :class="{
          'hint--success': feedbackState === 'success',
          'hint--error': feedbackState === 'error',
        }"
        role="status"
      >
        {{ feedback }}
      </p>
    </DemoCard>

    <DemoCard
      title="异步 text + 图标模式"
      description="text 可以返回 Promise，加载完成后再写入剪贴板。"
    >
      <div class="copy-demo">
        <div class="copy-demo__code">
          <span>安装命令</span>
          <code>pnpm add @wuhu-vue-ui/copy</code>
        </div>
        <Copy
          :text="copyInstallCommand"
          @success="handleInstallSuccess"
          @error="handleInstallError"
        />
      </div>
      <p
        class="hint"
        :class="{
          'hint--success': installFeedbackState === 'success',
          'hint--error': installFeedbackState === 'error',
        }"
        role="status"
      >
        {{ installFeedback }}
      </p>
    </DemoCard>

    <DemoCard
      title="自定义触发器"
      description="showIcon=false 时默认插槽会成为触发按钮内容，可完全接管 UI。"
    >
      <Copy
        v-slot="{ copied, loading, error }"
        :text="() => inviteCode"
        :show-icon="false"
        class="copy-custom"
      >
        <span class="copy-custom__code">{{ inviteCode }}</span>
        <span class="button button--small">
          {{ loading ? '复制中…' : copied ? '已复制' : error ? '重试复制' : '自定义复制' }}
        </span>
      </Copy>
    </DemoCard>

    <DemoCard title="禁用状态" description="disabled 会阻止交互，保留完整的可访问性信息。">
      <div class="copy-demo">
        <div class="copy-demo__code">
          <span>只读内容</span>
          <code>readonly-value</code>
        </div>
        <Copy :text="() => 'readonly-value'" disabled>不可复制</Copy>
      </div>
    </DemoCard>
  </div>
</template>
