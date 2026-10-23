<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { NumberTicker } from '@wuhu-vue-ui/number-ticker'

const replayKey = ref(0)

function replay() {
  replayKey.value += 1
}
</script>

<template>
  <div class="ticker-row">
    <div class="ticker-chip">
      <span>linear</span>
      <NumberTicker
        :key="`linear-${replayKey}`"
        :value="8642.5"
        :decimals="1"
        :start-value="0"
        :duration="900"
        easing="linear"
        suffix=" pts"
      />
    </div>
    <div class="ticker-chip">
      <span>cubic-bezier 回弹</span>
      <NumberTicker
        :key="`bounce-${replayKey}`"
        :value="8642.5"
        :decimals="1"
        :start-value="0"
        :duration="900"
        easing="cubic-bezier(0.34, 1.56, 0.64, 1)"
        suffix=" pts"
      />
    </div>
    <div class="ticker-chip">
      <span>跳过首屏动画</span>
      <NumberTicker
        :key="`instant-${replayKey}`"
        :value="8642.5"
        :decimals="1"
        :animate-on-mount="false"
        suffix=" pts"
      />
    </div>
  </div>

  <div class="ticker-actions">
    <Button @click="replay">重播挂载动画</Button>
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
