<script setup lang="ts">
import { vRipple } from '@wuhu-ui/ripple'
</script>

<template>
  <div class="ripple-demo">
    <div class="ripple-demo__row">
      <button v-ripple type="button" class="button">跟随指针</button>
      <button
        v-ripple="{ center: true, color: 'rgba(14, 165, 233, 0.32)' }"
        type="button"
        class="button"
      >
        从中心扩散
      </button>
    </div>
    <p class="ripple-demo__hint">
      设置 <code>center</code> 后波纹始终从元素中心扩散，适合图标按钮或不强调点击位置的场景。
    </p>
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
