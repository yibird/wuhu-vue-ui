<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { NumberTicker } from '@wuhu-vue-ui/number-ticker'

const value = ref(12860.5)

function increment() {
  value.value = Math.round((value.value + 8888.8) * 10) / 10
}

function refresh() {
  value.value = 21480.2
}
</script>

<template>
  <div class="ticker-card">
    <span class="ticker-card__label">本月营收</span>
    <div class="ticker-card__value">
      <NumberTicker :value="value" :decimals="1" prefix="¥ " :duration="900" />
    </div>
    <span class="ticker-card__meta">较上月增长 18.2%</span>
  </div>
  <div class="ticker-actions">
    <Button @click="increment">+ 8,888.8</Button>
    <Button @click="refresh">刷新数据</Button>
  </div>
</template>
