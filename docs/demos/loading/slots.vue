<script setup lang="ts">
import { Loading } from '@wuhu-ui/loading'
</script>

<template>
  <div class="loading-demo__stage">
    <Loading animation="bars">
      <span class="loading-demo__indicator" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <template #title>
        <strong class="loading-demo__title">自定义标题</strong>
      </template>
      <template #description>
        <span class="loading-demo__description"
          >default / title / description 三个插槽均可替换</span
        >
      </template>
    </Loading>
  </div>
</template>

<style scoped>
.loading-demo__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  border: 1px dashed var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
}

.loading-demo__indicator {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.loading-demo__indicator span {
  width: 8px;
  height: 28px;
  border-radius: 999px;
  background: var(--w-color-primary, #4f46e5);
  animation: loading-demo-slot-bars 0.9s ease-in-out infinite;
}

.loading-demo__indicator span:nth-child(2) {
  animation-delay: 0.12s;
}

.loading-demo__indicator span:nth-child(3) {
  animation-delay: 0.24s;
}

.loading-demo__title {
  color: var(--w-color-primary, #4f46e5);
}

.loading-demo__description {
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
}

@keyframes loading-demo-slot-bars {
  0%,
  100% {
    opacity: 0.45;
    transform: scaleY(0.5);
  }

  50% {
    opacity: 1;
    transform: scaleY(1);
  }
}
</style>
