<script setup lang="ts">
import { ref } from 'vue'
import { SliderCaptcha } from '@wuhu-ui/slider-captcha'
import type { SliderCaptchaFailEvent, SliderCaptchaSuccessEvent } from '@wuhu-ui/slider-captcha'

const message = ref('拖动滑块，让拼图与缺口对齐')

function handleSuccess(event: SliderCaptchaSuccessEvent) {
  message.value = `验证通过 · 用时 ${event.duration}ms · 第 ${event.attempts} 次尝试`
}

function handleFail(event: SliderCaptchaFailEvent) {
  message.value = `验证失败 · 偏移 ${Math.round(Math.abs(event.offset - event.target.x))}px`
}
</script>

<template>
  <SliderCaptcha @success="handleSuccess" @fail="handleFail" />
  <p class="hint">{{ message }}</p>
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
