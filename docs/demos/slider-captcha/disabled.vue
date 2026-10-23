<script setup lang="ts">
import { SliderCaptcha } from '@wuhu-vue-ui/slider-captcha'
</script>

<template>
  <SliderCaptcha disabled :width="320" :height="160" />
  <p class="hint">禁用后无法拖动、键盘操作或提交验证，适合只读回显。</p>
</template>

<style lang="less">
.slider-captcha-demo__actions {
  margin-top: 10px;
}
.command-demo__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--w-color-text-tertiary);
  font-size: 11px;
}
.command-demo__row strong {
  overflow: hidden;
  color: var(--w-color-text);
  font-family: var(--w-font-family-mono);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
