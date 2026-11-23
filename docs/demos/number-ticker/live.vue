<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import { Button } from 'antdv-next'
import { NumberTicker } from '@wuhu-vue-ui/number-ticker'

const metrics = reactive({
  requests: 12860,
  users: 28416,
  successRate: 99.2,
})
const running = ref(false)

let timer: number | undefined

function tick() {
  metrics.requests = Math.max(0, Math.round(metrics.requests + (Math.random() - 0.42) * 2400))
  metrics.users = Math.max(0, Math.round(metrics.users + (Math.random() - 0.5) * 180))
  metrics.successRate = Math.min(
    100,
    Math.max(90, Math.round((metrics.successRate + (Math.random() - 0.5) * 0.8) * 10) / 10),
  )
}

function stop() {
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
}

function toggle() {
  running.value = !running.value
  if (running.value) {
    timer = window.setInterval(tick, 1400)
  } else {
    stop()
  }
}

onBeforeUnmount(stop)
</script>

<template>
  <div class="ticker-row">
    <div class="ticker-chip">
      <span>实时请求 / 秒</span>
      <NumberTicker :value="metrics.requests" locale="en-US" :duration="420" />
    </div>
    <div class="ticker-chip">
      <span>在线用户</span>
      <NumberTicker :value="metrics.users" :duration="420" />
    </div>
    <div class="ticker-chip">
      <span>成功率</span>
      <NumberTicker :value="metrics.successRate" :decimals="1" suffix="%" :duration="420" />
    </div>
  </div>

  <div class="ticker-actions">
    <Button @click="toggle">{{ running ? '暂停' : '开始' }}</Button>
    <Button @click="tick">单步更新</Button>
  </div>
</template>
