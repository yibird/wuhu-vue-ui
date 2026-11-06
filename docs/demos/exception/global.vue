<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { Exception, setExceptionPresets } from '@wuhu-vue-ui/exception'

const banner = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1" />
      <stop offset="1" stop-color="#a855f7" />
    </linearGradient>
  </defs>
  <rect width="320" height="200" rx="20" fill="url(#g)" />
  <text x="160" y="116" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="64" font-weight="700">404</text>
  <text x="160" y="150" text-anchor="middle" fill="rgba(255, 255, 255, 0.75)" font-family="system-ui, sans-serif" font-size="14" letter-spacing="2">GLOBAL BANNER</text>
</svg>
`)}`

onMounted(() => {
  setExceptionPresets({
    notFound: {
      image: banner,
      title: '页面走丢了',
      description: '地址可能已经变更，试试从首页重新进入。',
    },
    serverError: {
      title: '服务正在维护',
      description: '我们正在紧急修复，请稍后再试。',
    },
  })
})

onBeforeUnmount(() => {
  setExceptionPresets({})
})
</script>

<template>
  <div class="exception-global">
    <div class="exception-global__item">
      <span class="exception-global__label">notFound</span>
      <Exception type="notFound" />
    </div>
    <div class="exception-global__item">
      <span class="exception-global__label">serverError</span>
      <Exception type="serverError" />
    </div>
  </div>
</template>

<style lang="less">
.exception-global {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  &__item {
    overflow: hidden;
    border: 1px solid var(--w-color-border, #e2e8f0);
    border-radius: 16px;
    background: var(--w-color-surface, #ffffff);
    box-shadow: var(--w-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
  }

  &__label {
    display: block;
    padding: 8px 14px;
    border-bottom: 1px solid var(--w-color-border-subtle, #e2e8f0);
    background: var(--w-color-surface-subtle, #f8fafc);
    color: var(--w-color-text-tertiary, #64748b);
    font-family: var(--w-font-family-mono, monospace);
    font-size: 10px;
  }
}

@media (max-width: 760px) {
  .exception-global {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
