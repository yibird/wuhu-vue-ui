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
