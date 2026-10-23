<script setup lang="ts">
import { Highlight } from '@wuhu-vue-ui/highlight'
</script>

<template>
  <p class="highlight-copy">
    <Highlight
      text="可访问性、键盘导航与 ARIA 属性都由组件负责。"
      :keywords="['可访问性', '键盘导航', 'ARIA']"
      tag="strong"
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
