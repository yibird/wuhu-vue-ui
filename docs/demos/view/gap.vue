<script setup lang="ts">
import { ref } from 'vue'
import { View, ViewContent, ViewFooter, ViewHeader } from '@wuhu-vue-ui/view'

const gap = ref(12)
const gapOptions = [0, 8, 12, 20]

const direction = ref<'vertical' | 'horizontal'>('vertical')
const directionOptions = [
  { value: 'vertical', label: '纵向' },
  { value: 'horizontal', label: '横向' },
] as const
</script>

<template>
  <div class="gap-demo">
    <div class="gap-demo__toolbar">
      <span class="gap-demo__label">gap</span>
      <button
        v-for="value in gapOptions"
        :key="value"
        type="button"
        class="gap-demo__option"
        :class="{ 'is-active': gap === value }"
        :aria-pressed="gap === value"
        @click="gap = value"
      >
        {{ value }}px
      </button>
    </div>

    <div class="gap-demo__toolbar">
      <span class="gap-demo__label">direction</span>
      <button
        v-for="option in directionOptions"
        :key="option.value"
        type="button"
        class="gap-demo__option"
        :class="{ 'is-active': direction === option.value }"
        :aria-pressed="direction === option.value"
        @click="direction = option.value"
      >
        {{ option.label }}（{{ option.value }}）
      </button>
    </div>

    <div class="gap-demo__stage">
      <View :full="false" :gap="gap" :direction="direction">
        <ViewHeader>
          <div class="gap-demo__section">
            <strong>Header</strong>
            <span>{{ direction === 'vertical' ? '纵向' : '横向' }} · gap {{ gap }}px</span>
          </div>
        </ViewHeader>
        <ViewContent>
          <div class="gap-demo__section gap-demo__section--content">
            <h3>Content</h3>
            <p>调整 gap 或 direction，观察 Header、Content、Footer 的间距与排列方式。</p>
          </div>
        </ViewContent>
        <ViewFooter>
          <div class="gap-demo__section">Footer</div>
        </ViewFooter>
      </View>
    </div>
  </div>
</template>

<style scoped>
.gap-demo {
  overflow: visible;
}

.gap-demo__toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.gap-demo__label {
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
}

.gap-demo__option {
  padding: 4px 9px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-full, 9999px);
  background: var(--w-color-surface, #fff);
  color: var(--w-color-text-secondary, #475569);
  font: inherit;
  font-size: var(--w-font-size-xs, 12px);
  cursor: pointer;
}

.gap-demo__option.is-active {
  border-color: var(--w-color-primary, #4f46e5);
  background: var(--w-color-primary-soft, rgba(79, 70, 229, 0.1));
  color: var(--w-color-primary, #4f46e5);
}

.gap-demo__stage {
  box-sizing: border-box;
  height: 320px;
  padding: 10px;
  overflow: hidden;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-lg, 12px);
  background: var(--w-color-surface-subtle, #f8fafc);
}

.gap-demo__section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  white-space: nowrap;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
  font-size: var(--w-font-size-sm, 13px);
}

.gap-demo__section--content {
  display: block;
  min-height: 120px;
}

.gap-demo__section h3 {
  margin: 0 0 6px;
  font-size: var(--w-font-size-sm, 13px);
}

.gap-demo__section p {
  margin: 0;
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
  line-height: 1.6;
  white-space: normal;
}
</style>
