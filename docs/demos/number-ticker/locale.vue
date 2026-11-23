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
