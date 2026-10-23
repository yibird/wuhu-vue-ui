<script setup lang="ts">
import { ref } from 'vue'
import { Segmented, Select } from 'antdv-next'
import { Time } from '@wuhu-vue-ui/time'

const timeSeed = Date.now()
const locale = ref('zh-CN')
const numeric = ref<Intl.RelativeTimeFormatNumeric>('auto')
const style = ref<Intl.RelativeTimeFormatStyle>('long')

const localeOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
]
const numericOptions: { label: string; value: Intl.RelativeTimeFormatNumeric }[] = [
  { label: 'auto', value: 'auto' },
  { label: 'always', value: 'always' },
]
const styleOptions: { label: string; value: Intl.RelativeTimeFormatStyle }[] = [
  { label: 'long', value: 'long' },
  { label: 'short', value: 'short' },
  { label: 'narrow', value: 'narrow' },
]
</script>

<template>
  <div class="time-controls">
    <label class="demo-control">
      <span>Locale</span>
      <Select v-model:value="locale" :options="localeOptions" style="width: 120px" />
    </label>
    <label class="demo-control">
      <span>Numeric</span>
      <Segmented v-model:value="numeric" :options="numericOptions" />
    </label>
    <label class="demo-control">
      <span>Style</span>
      <Segmented v-model:value="style" :options="styleOptions" />
    </label>
  </div>

  <ul class="time-list">
    <li>
      <span class="time-list__label">15 分钟前</span>
      <span class="time-list__value">
        <Time
          :time="new Date(timeSeed - 15 * 60_000)"
          :now="new Date(timeSeed)"
          :locale="locale"
          :numeric="numeric"
          :format-style="style"
        />
      </span>
    </li>
    <li>
      <span class="time-list__label">3 天前</span>
      <span class="time-list__value">
        <Time
          :time="new Date(timeSeed - 3 * 24 * 60 * 60_000)"
          :now="new Date(timeSeed)"
          :locale="locale"
          :numeric="numeric"
          :format-style="style"
        />
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
