<script setup lang="ts">
import { ref } from 'vue'
import { Loading } from '@wuhu-vue-ui/loading'
import type { LoadingGradient } from '@wuhu-vue-ui/loading'

const presets: Array<{ label: string; value: LoadingGradient }> = [
  { label: '默认渐变', value: true },
  { label: '品牌渐变', value: ['var(--w-color-primary, #4f46e5)', 'var(--w-color-info, #0369a1)'] },
  { label: '关闭渐变', value: false },
]

const gradient = ref<LoadingGradient>(true)
</script>

<template>
  <div class="loading-demo">
    <div class="loading-demo__picker" role="group" aria-label="Loading 渐变">
      <button
        v-for="preset in presets"
        :key="preset.label"
        type="button"
        :class="{ 'is-active': gradient === preset.value }"
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
        description="gradient 作用于 Loading 容器背景，不改变动画颜色"
        style="width: 100%; min-height: 180px"
      />
    </div>
  </div>
</template>

<style scoped>
.loading-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-demo__picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loading-demo__picker button {
  padding: 6px 12px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
  color: var(--w-color-text-secondary, #475569);
  font: inherit;
  font-size: var(--w-font-size-xs, 12px);
  cursor: pointer;
}

.loading-demo__picker button.is-active {
  border-color: var(--w-color-primary, #4f46e5);
  background: var(--w-color-selected, var(--w-color-primary-soft));
  color: var(--w-color-primary, #4f46e5);
}

.loading-demo__stage {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
}
</style>
