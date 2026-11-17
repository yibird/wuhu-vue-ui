<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Exception, setExceptionPresets } from '@wuhu-vue-ui/exception'

const applied = ref(false)

function applyPresets() {
  setExceptionPresets({
    notFound: {
      title: '页面走丢了',
      description: '地址可能已经变更，试试从首页重新进入。',
    },
    serverError: {
      title: '服务正在维护',
      description: '我们正在紧急修复，请稍后再试。',
    },
  })
  applied.value = true
}

function resetPresets() {
  setExceptionPresets({})
  applied.value = false
}

onBeforeUnmount(resetPresets)
</script>

<template>
  <div class="exception-global">
    <div class="exception-global__actions">
      <button type="button" :disabled="applied" @click="applyPresets">应用全局配置</button>
      <button type="button" :disabled="!applied" @click="resetPresets">恢复默认</button>
      <span aria-live="polite">{{ applied ? '已应用全局配置' : '当前为默认配置' }}</span>
    </div>

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

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    grid-column: 1 / -1;
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
