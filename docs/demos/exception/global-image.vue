<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
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

const applied = ref(false)

function applyPreset() {
  setExceptionPresets({
    notFound: { image: banner },
  })
  applied.value = true
}

function resetPreset() {
  setExceptionPresets({})
  applied.value = false
}

onBeforeUnmount(resetPreset)
</script>

<template>
  <div class="exception-global-image">
    <div class="exception-global-image__actions">
      <button type="button" :disabled="applied" @click="applyPreset">注入 404 banner</button>
      <button type="button" :disabled="!applied" @click="resetPreset">恢复默认插图</button>
      <span aria-live="polite">{{ applied ? '已注入自定义图片' : '当前为默认插图' }}</span>
    </div>

    <div class="exception-global-image__stage">
      <Exception
        type="notFound"
        title="页面走丢了"
        description="地址可能已经变更，试试从首页重新进入。"
      />
    </div>
  </div>
</template>

<style lang="less">
.exception-global-image {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 12px;

    button {
      padding: 6px 12px;
      border: 1px solid var(--w-color-border, #e2e8f0);
      border-radius: 8px;
      background: var(--w-color-surface, #ffffff);
      color: var(--w-color-text, #0f172a);
      font: inherit;
      cursor: pointer;

      &:hover:not(:disabled) {
        border-color: var(--w-color-border-strong, #cbd5e1);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      &:focus-visible {
        outline: 2px solid var(--w-color-primary, #4f46e5);
        outline-offset: 2px;
      }
    }

    span {
      color: var(--w-color-text-tertiary, #64748b);
    }
  }

  &__stage {
    overflow: hidden;
    border: 1px solid var(--w-color-border, #e2e8f0);
    border-radius: 16px;
    background: var(--w-color-surface, #ffffff);
    box-shadow: var(--w-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
  }
}
</style>
