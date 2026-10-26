<script setup lang="ts">
import { SlidingHighlight } from '@wuhu-vue-ui/sliding-highlight'

const items = [
  { label: '概览', value: 'overview' },
  { label: '组件', value: 'components', badge: 16 },
  { label: '示例', value: 'examples', badge: 32 },
  { label: '文档', value: 'docs' },
]
</script>

<template>
  <SlidingHighlight as="div" class="sliding-nav1" :inset="0">
    <div v-for="item in items" :key="item.value" class="sliding-nav1__item">
      {{ item.label }}
    </div>
  </SlidingHighlight>

  <div style="margin-top: 10px">
    <SlidingHighlight as="div" class="sliding-nav2" :inset="0">
      <div v-for="item in items" :key="item.value" class="sliding-nav2__item">
        {{ item.label }}
      </div>
    </SlidingHighlight>
  </div>
</template>

<style lang="less">
.sliding-nav1 {
  --w-sliding-highlight-bg: #eee;
  display: flex;
  align-items: center;
  gap: 2px;
  width: fit-content;
  max-width: 100%;
  margin: 0;
  padding: 8px;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  background: #fff;
  list-style: none;

  &__item {
    width: 80px;
    display: flex;
    justify-content: center;
    padding: 10px;
    border-radius: 8px;
    color: var(--w-color-text-secondary);
    font-size: var(--w-font-size-sm, 13px);
    cursor: pointer;
    transition: color var(--w-duration-fast, 120ms) ease;

    &:hover {
      color: var(--w-color-text);
    }
  }
}

.sliding-nav2 {
  --w-sliding-highlight-bg: #eee;
  width: 300px;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 8px;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  background: #fff;
  list-style: none;

  &__item {
    width: 100%;
    display: flex;
    padding: 10px;
    border-radius: 8px;
    color: var(--w-color-text-secondary);
    font-size: var(--w-font-size-sm, 13px);
    cursor: pointer;
    transition: color var(--w-duration-fast, 120ms) ease;

    &:hover {
      color: var(--w-color-text);
    }
  }
}
</style>
