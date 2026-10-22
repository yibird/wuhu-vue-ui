<script setup lang="ts">
import { ref } from 'vue'
import { Loading, createLoading } from '@wuhu-ui/loading'
import type { LoadingAnimation, LoadingGradient, LoadingInstance } from '@wuhu-ui/loading'
import DemoCard from '../components/demo-card.vue'

const animations: LoadingAnimation[] = ['bars', 'beat', 'pulse', 'ring', 'spinner']
const animation = ref<LoadingAnimation>('ring')
const inlineOpen = ref(true)
const fullOpen = ref(false)
const imperative = ref<LoadingInstance | null>(null)
const gradient = ref<LoadingGradient>(true)

const gradientPresets: Array<{ label: string; value: LoadingGradient }> = [
  { label: '默认渐变', value: true },
  { label: '霓虹', value: ['#4f46e5', '#c026d3', '#0ea5e9'] },
  { label: '日落', value: ['#f97316', '#e11d48'] },
  { label: '关闭渐变', value: false },
]

const animationLabels: Record<LoadingAnimation, string> = {
  bars: 'Bars',
  beat: 'Beat',
  pulse: 'Pulse',
  ring: 'Ring',
  spinner: 'Spinner',
}

function showFull(): void {
  fullOpen.value = true
  window.setTimeout(() => {
    fullOpen.value = false
  }, 1600)
}

function showImperative(): void {
  imperative.value?.destroy()
  imperative.value = createLoading({
    animation: animation.value,
    title: '正在保存',
    description: '命令式创建的 Loading，会在 1.6 秒后自动关闭。',
  })
  window.setTimeout(() => imperative.value?.close(), 1600)
}

function destroyImperative(): void {
  imperative.value?.destroy()
  imperative.value = null
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="动画类型"
      description="内置 bars、beat、pulse、ring、spinner 五种动画，可随时切换。"
    >
      <div class="loading-demo__picker" role="group" aria-label="Loading 动画类型">
        <button
          v-for="item in animations"
          :key="item"
          type="button"
          class="button button--small"
          :class="item === animation ? 'button--primary' : 'button--ghost'"
          @click="animation = item"
        >
          {{ animationLabels[item] }}
        </button>
      </div>

      <div class="loading-demo__stage">
        <Loading
          v-model:open="inlineOpen"
          :animation="animation"
          title="加载中"
          description="请稍候…"
        />
      </div>
    </DemoCard>

    <DemoCard
      title="渐变背景"
      description="gradient 支持 true、CSS 渐变字符串或颜色数组，仅作用于 Loading 背景。"
    >
      <div class="loading-demo__picker" role="group" aria-label="Loading 渐变">
        <button
          v-for="preset in gradientPresets"
          :key="preset.label"
          type="button"
          class="button button--small"
          :class="gradient === preset.value ? 'button--primary' : 'button--ghost'"
          @click="gradient = preset.value"
        >
          {{ preset.label }}
        </button>
      </div>

      <div class="loading-demo__stage">
        <Loading
          animation="bars"
          :gradient="gradient"
          title="背景渐变"
          description="动画颜色保持纯色，渐变只作用于背景"
          style="width: 100%; min-height: 160px"
        />
      </div>
    </DemoCard>

    <DemoCard title="全屏模式" description="full 会渲染固定遮罩层，并默认锁定页面滚动。">
      <button type="button" class="button button--primary" @click="showFull">
        显示全屏 Loading
      </button>
      <Loading
        v-model:open="fullOpen"
        full
        :animation="animation"
        title="正在处理"
        description="全屏 Loading 会自动锁定 body 滚动。"
      />
    </DemoCard>

    <DemoCard
      title="默认 / 标题 / 描述插槽"
      description="default 可替换动画，title 与 description 可完全自定义。"
      wide
    >
      <div class="loading-demo__stage">
        <Loading :animation="animation">
          <span class="loading-demo__custom-indicator" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <template #title>
            <strong class="loading-demo__custom-title">自定义标题</strong>
          </template>
          <template #description>
            <span class="loading-demo__custom-desc">通过插槽替换动画与文案</span>
          </template>
        </Loading>
      </div>
    </DemoCard>

    <DemoCard
      title="命令式 API"
      description="createLoading 创建，close() 关闭，destroy() 立即销毁。"
    >
      <div class="loading-demo__actions">
        <button type="button" class="button button--primary button--small" @click="showImperative">
          createLoading()
        </button>
        <button type="button" class="button button--ghost button--small" @click="destroyImperative">
          destroy()
        </button>
      </div>
      <p class="hint">命令式实例同样支持 update() 动态修改标题、动画等配置。</p>
    </DemoCard>
  </div>
</template>

<style scoped>
.loading-demo__picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.loading-demo__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  border: 1px dashed var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
}

.loading-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loading-demo__custom-indicator {
  position: relative;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.loading-demo__custom-indicator span {
  width: 8px;
  height: 28px;
  border-radius: 999px;
  background: var(--w-color-primary, #4f46e5);
  animation: loading-demo-custom 0.9s ease-in-out infinite;
}

.loading-demo__custom-indicator span:nth-child(2) {
  animation-delay: 0.12s;
}

.loading-demo__custom-indicator span:nth-child(3) {
  animation-delay: 0.24s;
}

.loading-demo__custom-title {
  font-size: var(--w-font-size-sm, 13px);
  color: var(--w-color-primary, #4f46e5);
}

.loading-demo__custom-desc {
  color: var(--w-color-text-secondary, #475569);
}

@keyframes loading-demo-custom {
  0%,
  100% {
    transform: scaleY(0.5);
    opacity: 0.45;
  }

  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>
