<script setup lang="ts">
import { vRipple } from '@wuhu-ui/ripple'
</script>

<template>
  <div class="ripple-demo">
    <div class="ripple-demo__row">
      <button
        v-ripple="{ color: 'rgba(79, 70, 229, 0.35)', duration: 900 }"
        type="button"
        class="button"
      >
        靛蓝 · 900ms
      </button>
      <button
        v-ripple="{ color: 'rgba(5, 150, 105, 0.32)', duration: 1200 }"
        type="button"
        class="button"
      >
        绿色 · 1200ms
      </button>
      <button
        v-ripple="{ color: 'rgba(217, 119, 6, 0.34)', duration: 500 }"
        type="button"
        class="button"
      >
        琥珀 · 500ms
      </button>
    </div>
    <p class="ripple-demo__hint">color 接受任意 CSS 颜色，duration 控制单次波纹的动画时长。</p>
  </div>
</template>

<style lang="less">
.ripple-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  &__surface {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    padding: 16px;
    border: 1px dashed var(--w-color-border-strong);
    border-radius: var(--w-radius-lg);
    background: var(--w-color-surface-subtle);
    color: var(--w-color-text-secondary);
    cursor: pointer;
    user-select: none;

    &--inline {
      min-width: 160px;
      min-height: 40px;
      padding: 0 18px;
      border-style: solid;
      border-radius: var(--w-radius-md);
    }
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--w-color-text-secondary);
    font-size: var(--w-font-size-xs);
    cursor: pointer;
    user-select: none;
  }

  &__hint {
    margin: 0;
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs);
    line-height: 1.6;

    code {
      padding: 1px 5px;
      border-radius: 4px;
      background: var(--w-color-surface-subtle);
      font-family: var(--w-font-family-mono);
      font-size: 10px;
    }
  }
}
</style>
