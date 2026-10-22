<script setup lang="ts">
import { GradientText } from '@wuhu-ui/gradient-text'
</script>

<template>
  <div class="gradient-tile">
    <GradientText
      type="radial"
      :colors="['#4f46e5', '#c026d3', '#0ea5e9']"
      :animate="true"
      :duration="4200"
      class="gradient-number"
    >
      99.9%
    </GradientText>
    <span class="gradient-caption">SLA · 过去 30 天</span>
  </div>
</template>

<style lang="less">
.gradient-showcase {
  padding: 26px;
  border-radius: 14px;
  background:
    radial-gradient(420px 200px at 0% 0%, rgba(79, 70, 229, 0.1), transparent 60%),
    var(--w-color-surface-subtle);
  text-align: center;

  p {
    margin: 8px 0 0;
    color: var(--w-color-text-secondary);
    font-size: var(--w-font-size-xs);
  }

  &--dark {
    background:
      radial-gradient(420px 200px at 10% 0%, rgba(129, 140, 248, 0.3), transparent 60%),
      linear-gradient(135deg, #111827, #1e1b4b);
    color: #e2e8f0;

    p {
      color: #94a3b8;
    }
  }
}

.gradient-title {
  font-size: clamp(30px, 4vw, 48px);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1.15;
}

.gradient-animation {
  &__controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .button.is-active {
      border-color: var(--w-color-primary-soft-hover);
      background: var(--w-color-primary-soft);
      color: var(--w-color-primary);
    }
  }

  &__divider {
    width: 1px;
    height: 20px;
    background: var(--w-color-border);
  }

  &__meta {
    margin-left: auto;
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs);
    font-variant-numeric: tabular-nums;
  }
}

.gradient-tile {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-height: 180px;
  border-radius: 12px;
  background: var(--w-color-surface-subtle);
}

.gradient-caption {
  color: var(--w-color-text-tertiary);
  font-size: var(--w-font-size-2xs);
}

.gradient-number {
  font-size: clamp(32px, 4vw, 46px);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1.15;
}

.gradient-inline {
  margin: 0;
  color: var(--w-color-text-secondary);
  font-size: var(--w-font-size-lg);
  line-height: 1.8;
}
.gradient-demo {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  min-height: 180px;
  text-align: center;

  &__title {
    font-size: clamp(30px, 3.4vw, 42px);
    font-weight: 800;
    letter-spacing: -0.045em;
    line-height: 1.15;
  }

  p {
    max-width: 420px;
    margin: 14px 0 0;
    color: var(--w-color-text-secondary);
    font-size: 12px;
    line-height: 1.8;
  }
}
</style>
