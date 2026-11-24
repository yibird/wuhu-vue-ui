<script setup lang="ts">
import { ImgComparisonSlider } from '@wuhu-vue-ui/img-comparison-slider'

const classes = {
  root: 'styled-comparison',
  line: 'styled-comparison__line',
  knob: 'styled-comparison__knob',
}

const styles = {
  line: { width: '3px' },
  knob: { color: '#ffffff' },
}
</script>

<template>
  <ImgComparisonSlider
    before="/comparison-before.svg"
    after="/comparison-after.svg"
    :classes="classes"
    :styles="styles"
  />
</template>

<style lang="less">
.styled-comparison {
  --w-img-comparison-slider-knob-size: 38px;
}

.styled-comparison__line {
  background: linear-gradient(180deg, #6366f1, #a855f7);
}

.styled-comparison__knob {
  border-color: transparent;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  box-shadow:
    0 8px 20px -6px rgba(99, 102, 241, 0.6),
    0 0 0 4px rgba(99, 102, 241, 0.16);
}
</style>
