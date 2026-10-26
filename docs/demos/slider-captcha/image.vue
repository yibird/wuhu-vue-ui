<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { SliderCaptcha } from '@wuhu-vue-ui/slider-captcha'
import type { SliderCaptchaFailEvent, SliderCaptchaSuccessEvent } from '@wuhu-vue-ui/slider-captcha'

const captcha = ref<{ refresh: () => void } | null>(null)
const logs = ref<string[]>([])

const sources = [
  'https://picsum.photos/seed/aurora/720/360',
  'https://picsum.photos/seed/sunset/720/360',
  'https://picsum.photos/seed/lagoon/720/360',
]

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
    :src="sources"
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
    <span class="hint">每次刷新会轮换一张背景图，并重新生成缺口位置</span>
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
