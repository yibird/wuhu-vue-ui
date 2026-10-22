<script setup lang="ts">
import { Highlight } from '@wuhu-ui/highlight'

const customStyle = {
  padding: '0 3px',
  borderRadius: '4px',
  background: 'var(--w-color-warning-soft)',
  color: 'var(--w-color-warning)',
}
</script>

<template>
  <p class="highlight-copy">
    <Highlight
      text="TypeScript 提供完整类型，Less 与设计令牌负责主题，Vue 3 负责响应式视图。"
      :keywords="['TypeScript', 'Less', 'Vue 3']"
      :highlight-style="customStyle"
    />
  </p>
</template>

<style lang="less">
.highlight-options {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  color: var(--w-color-text-secondary);
  font-size: var(--w-font-size-xs);

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .hint {
    margin: 0 0 0 auto;
  }
}
.highlight-copy {
  margin: 14px 0 0;
  color: var(--w-color-text-secondary);
  font-size: 13px;
  line-height: 1.95;
}
@media (max-width: 760px) {
  .highlight-options .hint {
    margin-left: 0;
  }
}
</style>
