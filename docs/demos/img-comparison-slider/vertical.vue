<script setup lang="ts">
import { ref } from 'vue'
import { ImgComparisonSlider } from '@wuhu-ui/img-comparison-slider'

const position = ref(42)
</script>

<template>
  <div class="comparison-vertical">
    <ImgComparisonSlider
      v-model="position"
      before="/comparison-before.svg"
      after="/comparison-after.svg"
      alt-before="方案 A"
      alt-after="方案 B"
      direction="vertical"
      aspect-ratio="auto"
      :keyboard-step="5"
      show-labels
      before-label="方案 A"
      after-label="方案 B"
    />
  </div>
  <div class="slider-meta">
    <span>分割位置</span>
    <strong>{{ Math.round(position) }}%</strong>
    <span class="hint">↑ ↓ 每次 5%</span>
  </div>
</template>

<style lang="less">
.comparison-vertical {
  height: 320px;
}
/* Image comparison demo variants */
.comparison-custom {
  .comparison-label {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: var(--w-radius-full, 9999px);
    background: var(--w-color-tooltip-bg, rgba(15, 23, 42, 0.94));
    color: var(--w-color-tooltip-text, #ffffff);
    font-size: 11px;
    font-weight: 600;
    backdrop-filter: blur(6px);
  }
}

.comparison-knob {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--w-color-primary);
  font-family: var(--w-font-family-mono);
  font-size: 10px;
  font-weight: 700;
}

.comparison-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;

  .button.is-active {
    border-color: var(--w-color-primary-soft-hover);
    background: var(--w-color-primary-soft);
    color: var(--w-color-primary);
  }
}

.comparison-disabled {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  color: var(--w-color-text-secondary);
  font-size: 11px;
}
.slider-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;

  span {
    color: var(--w-color-text-tertiary);
    font-size: 11px;
  }

  strong {
    color: var(--w-color-primary);
    font-family: var(--w-font-family-mono);
    font-size: 13px;
  }

  .hint {
    margin: 0 0 0 auto;
  }
}
.comparison-controls .ant-btn {
  height: 28px;
  padding-inline: 10px;
  font-size: 12px;
}
</style>
