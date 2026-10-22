<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { GradientText } from '@wuhu-ui/gradient-text'
import type { GradientTextProps } from '@wuhu-ui/gradient-text'

type Direction = NonNullable<GradientTextProps['animationDirection']>

const animate = ref(true)
const duration = ref(4000)
const direction = ref<Direction>('alternate')

const durations = [
  { label: '2s', value: 2000 },
  { label: '4s', value: 4000 },
  { label: '8s', value: 8000 },
]

const directions: { label: string; value: Direction }[] = [
  { label: 'normal', value: 'normal' },
  { label: 'reverse', value: 'reverse' },
  { label: 'alternate', value: 'alternate' },
  { label: 'alternate-reverse', value: 'alternate-reverse' },
]
</script>

<template>
  <div class="gradient-animation">
    <div class="gradient-animation__controls">
      <Button :type="animate ? 'primary' : 'default'" @click="animate = !animate">
        {{ animate ? '关闭动画' : '开启动画' }}
      </Button>

      <span class="gradient-animation__divider" aria-hidden="true" />

      <Button
        v-for="item in durations"
        :key="item.value"
        :type="duration === item.value ? 'primary' : 'default'"
        @click="duration = item.value"
      >
        {{ item.label }}
      </Button>

      <Button
        v-for="item in directions"
        :key="item.value"
        :type="direction === item.value ? 'primary' : 'default'"
        @click="direction = item.value"
      >
        {{ item.label }}
      </Button>

      <span class="gradient-animation__meta">
        {{ animate ? 'animating' : 'paused' }} · {{ duration }}ms · {{ direction }}
      </span>
    </div>

    <div class="gradient-showcase gradient-showcase--dark">
      <GradientText
        :colors="['#818cf8', '#e879f9', '#38bdf8']"
        :animate="animate"
        :duration="duration"
        :animation-direction="direction"
        :angle="110"
        class="gradient-title"
      >
        Make it memorable.
      </GradientText>
      <p>按钮直接控制 animate、duration 与 animationDirection 三个 props。</p>
    </div>
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
