<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from 'antdv-next'
import { NumberTicker } from '@wuhu-vue-ui/number-ticker'

const delta = ref(-12480.75)
const leverage = computed(() => Math.round(delta.value * 3.2 * 100) / 100)

function shift(amount: number) {
  delta.value = Math.round((delta.value + amount) * 100) / 100
}
</script>

<template>
  <div class="ticker-metrics">
    <div class="ticker-metric">
      <span>账户盈亏（2 位小数）</span>
      <strong>
        <NumberTicker
          :value="delta"
          :decimals="2"
          prefix="$ "
          locale="en-US"
          :start-value="-5000"
        />
      </strong>
    </div>
    <div class="ticker-metric">
      <span>整数显示</span>
      <strong>
        <NumberTicker :value="delta" suffix=" pts" :start-value="0" />
      </strong>
    </div>
    <div class="ticker-metric">
      <span>杠杆后（3.2x）</span>
      <strong>
        <NumberTicker :value="leverage" :decimals="2" prefix="$ " locale="en-US" />
      </strong>
    </div>
  </div>

  <div class="ticker-actions">
    <Button @click="shift(-500)">下跌 500</Button>
    <Button @click="shift(1250.5)">反弹 1,250.5</Button>
    <Button @click="delta = 0">归零</Button>
  </div>
</template>
