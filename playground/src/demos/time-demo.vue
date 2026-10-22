<script setup lang="ts">
import { computed, ref } from 'vue'
import { Time } from '@wuhu-ui/time'
import DemoCard from '../components/demo-card.vue'

const timeSeed = Date.now()
const timeSamples = [
  { label: '刚刚', value: new Date(timeSeed) },
  { label: '10 分钟前', value: new Date(timeSeed - 10 * 60_000) },
  { label: '1 小时前', value: new Date(timeSeed - 60 * 60_000) },
  { label: '昨天', value: new Date(timeSeed - 26 * 60 * 60_000) },
  { label: '上个月', value: new Date(timeSeed - 34 * 24 * 60 * 60_000) },
]

const locale = ref('zh-CN')
const numeric = ref<Intl.RelativeTimeFormatNumeric>('auto')
const style = ref<Intl.RelativeTimeFormatStyle>('long')

const customFormatterSample = computed(() => new Date(timeSeed - 3 * 24 * 60 * 60_000))

function customFormatter(date: Date, now: Date): string {
  const days = Math.round((now.getTime() - date.getTime()) / 86_400_000)
  return days === 0 ? '今天' : `${days} 天前 · 自定义格式`
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="相对时间样例" description="默认每 30 秒刷新一次，也可传入固定 now 用于预览。">
      <ul class="time-list">
        <li v-for="sample in timeSamples" :key="sample.label">
          <span class="time-list__label">{{ sample.label }}</span>
          <span class="time-list__value">
            <Time :time="sample.value" :now="new Date(timeSeed)" />
          </span>
        </li>
      </ul>
    </DemoCard>

    <DemoCard
      title="本地化与格式"
      description="numeric 与 style 对应 Intl.RelativeTimeFormat 的两个维度。"
    >
      <div class="time-controls">
        <label class="viewer-select">
          <span>Locale</span>
          <select v-model="locale">
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>
        <label class="viewer-select">
          <span>Numeric</span>
          <select v-model="numeric">
            <option value="auto">auto</option>
            <option value="always">always</option>
          </select>
        </label>
        <label class="viewer-select">
          <span>Style</span>
          <select v-model="style">
            <option value="long">long</option>
            <option value="short">short</option>
            <option value="narrow">narrow</option>
          </select>
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
    </DemoCard>

    <DemoCard
      title="自定义格式化"
      description="formatter 接收 date、now 与 locale，可输出完全自定义的文案。"
      wide
    >
      <div class="time-custom">
        <span class="time-custom__value">
          <Time
            :time="customFormatterSample"
            :now="new Date(timeSeed)"
            :formatter="customFormatter"
          />
        </span>
        <span class="hint">原生 title 中仍保留完整日期，悬停即可查看。</span>
      </div>
    </DemoCard>
  </div>
</template>
