<script setup lang="ts">
import { ref } from 'vue'
import { ImgComparisonSlider } from '@wuhu-vue-ui/img-comparison-slider'
import DemoCard from '../components/demo-card.vue'

const horizontalPosition = ref(56)
const verticalPosition = ref(42)
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="横向对比 + 标签"
      description="拖拽、触摸或使用方向键调整分割位置，支持自定义标签。"
      wide
    >
      <ImgComparisonSlider
        v-model:value="horizontalPosition"
        before="/comparison-before.svg"
        after="/comparison-after.svg"
      />
      <div class="slider-meta">
        <span>分割位置</span>
        <strong>{{ Math.round(horizontalPosition) }}%</strong>
        <span class="hint">使用 ← → 方向键精确调整</span>
      </div>
    </DemoCard>

    <DemoCard
      title="纵向对比"
      description="direction=vertical，容器固定高度时使用 aspectRatio=auto。"
    >
      <div class="comparison-vertical">
        <ImgComparisonSlider
          v-model:value="verticalPosition"
          before="/comparison-before.svg"
          after="/comparison-after.svg"
          direction="vertical"
          aspect-ratio="auto"
          :keyboard-step="5"
        />
      </div>
      <div class="slider-meta">
        <span>分割位置</span>
        <strong>{{ Math.round(verticalPosition) }}%</strong>
        <span class="hint">↑ ↓ 每次 5%</span>
      </div>
    </DemoCard>
  </div>
</template>
