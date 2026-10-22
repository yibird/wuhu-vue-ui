<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { SliderCaptcha } from '@wuhu-ui/slider-captcha'
import type { SliderCaptchaFailEvent, SliderCaptchaSuccessEvent } from '@wuhu-ui/slider-captcha'

const captcha = ref<{ refresh: () => void } | null>(null)
const logs = ref<string[]>([])

function push(message: string) {
  logs.value = [message, ...logs.value].slice(0, 4)
}

function handleSuccess(event: SliderCaptchaSuccessEvent) {
  push(`success · 偏移 ${event.offset} · ${event.duration}ms`)
}

function handleFail(event: SliderCaptchaFailEvent) {
  push(`fail · 偏移 ${event.offset}，目标 ${event.target.x}`)
}

function handleRefresh() {
  push('refresh · 换一张')
  captcha.value?.refresh()
}
</script>

<template>
  <SliderCaptcha
    ref="captcha"
    src="/samples/banner.png"
    :width="360"
    :height="180"
    :piece-size="52"
    :tolerance="8"
    :text="'拖动滑块完成拼图'"
    @success="handleSuccess"
    @fail="handleFail"
  />

  <div class="command-demo__row slider-captcha-demo__actions">
    <Button @click="handleRefresh">换一张</Button>
    <span class="hint">自定义背景图、尺寸与容差</span>
  </div>

  <div class="event-log">
    <span v-if="logs.length === 0" class="hint">验证事件将显示在这里</span>
    <span v-for="log in logs" :key="log" class="event-chip">{{ log }}</span>
  </div>
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
