<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { NumberTicker } from '@wuhu-vue-ui/number-ticker'

const percent = ref(86.4)
const users = ref(28416)
</script>

<template>
  <div class="ticker-metrics">
    <div class="ticker-metric">
      <span>转化率</span>
      <strong>
        <NumberTicker :value="percent" :decimals="1" suffix="%" :duration="720" />
      </strong>
    </div>
    <div class="ticker-metric">
      <span>活跃用户（en-US）</span>
      <strong>
        <NumberTicker :value="users" locale="en-US" :duration="720" />
      </strong>
    </div>
    <div class="ticker-metric">
      <span>活跃用户（zh-CN）</span>
      <strong>
        <NumberTicker :value="users" locale="zh-CN" :duration="720" />
      </strong>
    </div>
  </div>

  <div class="ticker-actions">
    <Button @click="percent = Math.random() * 100">随机转化率</Button>
    <Button @click="users = Math.round(10000 + Math.random() * 90000)">随机用户数</Button>
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
