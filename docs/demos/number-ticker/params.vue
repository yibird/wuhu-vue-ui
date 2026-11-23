<script setup lang="ts">
import { NumberTicker } from '@wuhu-vue-ui/number-ticker'
</script>

<template>
  <div class="ticker-row">
    <div class="ticker-chip">
      <span>duration 300</span>
      <NumberTicker :value="8600" :start-value="0" :duration="300" suffix=" ms" />
    </div>
    <div class="ticker-chip">
      <span>duration 1200</span>
      <NumberTicker :value="8600" :start-value="0" :duration="1200" suffix=" ms" />
    </div>
    <div class="ticker-chip">
      <span>无千分位</span>
      <NumberTicker :value="8600" :use-grouping="false" suffix=" users" />
    </div>
  </div>
</template>
