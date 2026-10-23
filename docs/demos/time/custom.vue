<script setup lang="ts">
import { Time } from '@wuhu-vue-ui/time'

const timeSeed = Date.now()
const sample = new Date(timeSeed - 3 * 24 * 60 * 60_000)

function formatter(date: Date, now: Date): string {
  const days = Math.round((now.getTime() - date.getTime()) / 86_400_000)
  return days === 0 ? '今天' : `${days} 天前 · 自定义格式`
}
</script>

<template>
  <div class="time-custom">
    <span class="time-custom__value">
      <Time :time="sample" :now="new Date(timeSeed)" :formatter="formatter" />
    </span>
    <span class="hint">原生 title 中仍保留完整日期，悬停即可查看。</span>
  </div>
</template>

<style lang="less">
.time-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.time-custom {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;

  &__value {
    font-size: 20px;
    font-weight: 650;
    letter-spacing: -0.02em;
  }

  .hint {
    margin: 0;
  }
}
.time-list {
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 9px 13px;
    border-top: 1px solid var(--w-color-border-subtle);

    &:first-child {
      border-top: 0;
    }
  }

  &__label {
    color: var(--w-color-text-tertiary);
    font-size: 11px;
  }

  &__value {
    color: var(--w-color-text);
    font-size: 12px;
    font-weight: 500;
  }
}
</style>
