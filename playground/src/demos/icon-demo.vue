<script setup lang="ts">
import { ref } from 'vue'
import { Icon, registerIcon } from '@wuhu-ui/icon'
import DemoCard from '../components/demo-card.vue'

const icons = [
  'chevron-up',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'arrow-up',
  'arrow-down',
  'arrow-left',
  'arrow-right',
  'check',
  'x',
  'plus',
  'minus',
  'search',
]

const size = ref(22)
const spinning = ref(false)

const customRegistered = ref(false)

function registerCustomIcon(): void {
  registerIcon(
    'custom-star',
    'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z',
  )
  customRegistered.value = true
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="内置图标" description="兼容 Iconify 风格名称，例如 i-lucide:chevron-up。" wide>
      <div class="icon-demo__toolbar">
        <label class="hint">
          尺寸
          <input v-model.number="size" type="range" min="14" max="40" />
          {{ size }}px
        </label>
        <label class="hint">
          <input v-model="spinning" type="checkbox" />
          旋转
        </label>
      </div>

      <div class="icon-demo__grid">
        <div v-for="name in icons" :key="name" class="icon-demo__item">
          <Icon :name="`i-lucide:${name}`" :size="size" :spin="spinning" />
          <code>{{ name }}</code>
        </div>
      </div>
    </DemoCard>

    <DemoCard title="自定义注册" description="registerIcon 可以注册任意 SVG path。">
      <button
        type="button"
        class="button button--primary button--small"
        @click="registerCustomIcon"
      >
        注册 custom-star
      </button>
      <div class="icon-demo__custom">
        <Icon name="i-custom:custom-star" :size="32" color="var(--w-color-primary)" />
        <span>{{ customRegistered ? '已注册' : '注册后显示' }}</span>
      </div>
    </DemoCard>
  </div>
</template>

<style scoped>
.icon-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.icon-demo__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.icon-demo__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 84px;
  padding: 12px 10px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
}

.icon-demo__item code {
  color: var(--w-color-text-tertiary, #94a3b8);
  font-size: 10px;
}

.icon-demo__custom {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
}
</style>
