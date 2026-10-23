<script setup lang="ts">
import { ref } from 'vue'
import { Copy } from '@wuhu-vue-ui/copy'

const message = ref('异步取数期间按钮会进入 loading 状态')

async function copyInstallCommand() {
  await new Promise((resolve) => setTimeout(resolve, 360))
  return 'pnpm add @wuhu-vue-ui/copy'
}

function handleSuccess() {
  message.value = '安装命令已复制'
}
</script>

<template>
  <div class="copy-demo">
    <div class="copy-demo__code">
      <span>安装命令</span>
      <code>pnpm add @wuhu-vue-ui/copy</code>
    </div>
    <Copy :text="copyInstallCommand" @success="handleSuccess" />
  </div>
  <p class="hint">{{ message }}</p>
</template>

<style lang="less">
.copy-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-md);
  background: var(--w-color-surface);

  &__code {
    overflow: hidden;
    color: var(--w-color-text);
    font-family: var(--w-font-family-mono);
    font-size: var(--w-font-size-sm);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.copy-slots__status {
  color: var(--w-color-text-tertiary);
  font-size: 11px;
}
.copy-demo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  background: var(--w-color-surface-subtle);

  &__code {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    span {
      color: var(--w-color-text-tertiary);
      font-size: 10px;
    }

    code {
      overflow: hidden;
      color: var(--w-color-text);
      font-family: var(--w-font-family-mono);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__actions {
    display: flex;
    flex: none;
    gap: 7px;
  }
}
</style>
