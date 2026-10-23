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

<style lang="less">
.ticker-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ticker-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 8px 10px;
  border-radius: var(--w-radius-sm);
  background: var(--w-color-surface-subtle);

  span {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs);
  }

  strong {
    font-size: var(--w-font-size-lg);
    letter-spacing: -0.02em;
  }
}

.ticker-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.ticker-chip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-md);
  background: var(--w-color-surface-subtle);

  span {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-3xs);
  }

  > :last-child {
    font-size: 20px;
    font-weight: 650;
  }
}
.ticker-card {
  position: relative;
  overflow: hidden;
  padding: 20px;
  border-radius: 14px;
  background:
    radial-gradient(420px 180px at 110% -10%, rgba(129, 140, 248, 0.38), transparent 60%),
    linear-gradient(135deg, #111827, #312e81 70%, #1e1b4b);
  color: #ffffff;

  &::after {
    position: absolute;
    top: -40px;
    right: -20px;
    width: 140px;
    height: 140px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    content: '';
  }

  &__label {
    color: rgba(226, 232, 240, 0.64);
    font-size: 10px;
    letter-spacing: 0.04em;
  }

  &__value {
    margin: 8px 0 6px;
    font-size: clamp(32px, 4vw, 44px);
    font-weight: 700;
    letter-spacing: -0.045em;
    line-height: 1;
  }

  &__meta {
    color: #6ee7b7;
    font-size: 10px;
  }
}

.ticker-actions {
  display: flex;
  gap: 7px;
  margin-top: 12px;
}
@media (max-width: 900px) {
  .ticker-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
