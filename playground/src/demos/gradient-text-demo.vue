<script setup lang="ts">
import { computed } from 'vue'
import { GradientText } from '@wuhu-ui/gradient-text'
import DemoCard from '../components/demo-card.vue'
import { theme } from '../theme'

const isDark = computed(() => theme.value === 'dark')

// Keep every gradient stop at WCAG AA for large text (>= 3:1) on both the
// light (#f1f5f9) and dark (#162034) demo surfaces. The inline gradient sits
// at body size, so its stops target 4.5:1 in each theme.
const radialColors = computed(() =>
  isDark.value ? ['#818cf8', '#e879f9', '#38bdf8'] : ['#4f46e5', '#c026d3', '#0284c7'],
)

const conicColors = computed(() =>
  isDark.value
    ? ['#fb923c', '#fb7185', '#a78bfa', '#fb923c']
    : ['#c2410c', '#be123c', '#6d28d9', '#c2410c'],
)

const inlineGradient = computed(() =>
  isDark.value
    ? 'linear-gradient(90deg, #34d399, #38bdf8, #a78bfa)'
    : 'linear-gradient(90deg, #047857, #0369a1, #7c3aed)',
)
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="线性渐变 + 流动动画"
      description="最常用的品牌标题场景，颜色与时长都可配置。"
      wide
    >
      <div class="gradient-showcase gradient-showcase--dark">
        <GradientText
          :colors="['#818cf8', '#e879f9', '#38bdf8']"
          :animate="true"
          :duration="5000"
          :angle="110"
          class="gradient-title"
        >
          Make it memorable.
        </GradientText>
        <p>渐变完全由 CSS 生成，不依赖图片资源。</p>
      </div>
    </DemoCard>

    <DemoCard title="径向渐变" description="type=radial，适合强调数字、状态或徽章。">
      <div class="gradient-tile">
        <GradientText
          type="radial"
          :colors="radialColors"
          :animate="true"
          :duration="4200"
          class="gradient-number"
        >
          99.9%
        </GradientText>
        <span class="gradient-caption">SLA · 过去 30 天</span>
      </div>
    </DemoCard>

    <DemoCard title="锥形渐变" description="type=conic，可通过 angle 调整起始方向。">
      <div class="gradient-tile">
        <GradientText type="conic" :colors="conicColors" :angle="45" class="gradient-number">
          360°
        </GradientText>
        <span class="gradient-caption">Conic gradient</span>
      </div>
    </DemoCard>

    <DemoCard
      title="原始 CSS 渐变"
      description="gradient 属性可传入任意 background-image 值。"
      wide
    >
      <div class="gradient-showcase">
        <p class="gradient-inline">
          数字与状态可以无缝嵌入正文：
          <GradientText :gradient="inlineGradient" :animate="true" :duration="6000">
            +128.6%
          </GradientText>
          ，无需额外标记。
        </p>
      </div>
    </DemoCard>
  </div>
</template>
