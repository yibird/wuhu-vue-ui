<script setup lang="ts">
import { Time } from '@wuhu-ui/time'

const timeSeed = Date.now()
const samples = [
  { label: '刚刚', value: new Date(timeSeed) },
  { label: '10 分钟前', value: new Date(timeSeed - 10 * 60_000) },
  { label: '1 小时前', value: new Date(timeSeed - 60 * 60_000) },
  { label: '昨天', value: new Date(timeSeed - 26 * 60 * 60_000) },
  { label: '上个月', value: new Date(timeSeed - 34 * 24 * 60 * 60_000) },
]
</script>

<template>
  <ul class="time-list">
    <li v-for="sample in samples" :key="sample.label">
      <span class="time-list__label">{{ sample.label }}</span>
      <span class="time-list__value">
        <Time :time="sample.value" :now="new Date(timeSeed)" />
      </span>
    </li>
  </ul>
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
