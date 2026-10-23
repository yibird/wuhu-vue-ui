<script setup lang="ts">
import { ref } from 'vue'
import { Loading } from '@wuhu-vue-ui/loading'
import type { LoadingAnimation } from '@wuhu-vue-ui/loading'

const animations: LoadingAnimation[] = ['bars', 'beat', 'pulse', 'ring', 'spinner']
const animation = ref<LoadingAnimation>('ring')
</script>

<template>
  <div class="loading-demo">
    <div class="loading-demo__picker" role="group" aria-label="Loading 动画类型">
      <button
        v-for="item in animations"
        :key="item"
        type="button"
        :class="{ 'is-active': item === animation }"
        @click="animation = item"
      >
        {{ item }}
      </button>
    </div>
    <div class="loading-demo__stage">
      <Loading :animation="animation" title="加载中" description="切换上方动画查看效果" />
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
  border-radius: var(--w-radius-full, 9999px);
  background: var(--w-color-surface, #fff);
  color: var(--w-color-text-secondary, #475569);
  font: inherit;
  font-size: var(--w-font-size-xs, 12px);
  cursor: pointer;
}

.loading-demo__picker button.is-active {
  border-color: var(--w-color-primary, #4f46e5);
  background: var(--w-color-primary-soft, rgba(79, 70, 229, 0.1));
  color: var(--w-color-primary, #4f46e5);
}

.loading-demo__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  border: 1px dashed var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
}
</style>
