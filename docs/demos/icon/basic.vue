<script setup lang="ts">
import { Icon } from '@wuhu-vue-ui/icon'

const icons = [
  'chevron-up',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'arrow-up',
  'arrow-right',
  'check',
  'x',
  'plus',
  'minus',
  'search',
]
</script>

<template>
  <div class="icon-demo">
    <div v-for="name in icons" :key="name" class="icon-demo__item">
      <Icon :name="`i-lucide:${name}`" :size="22" />
      <code>{{ name }}</code>
    </div>
    <div class="icon-demo__item">
      <Icon name="search" :size="28" color="var(--w-color-primary)" spin />
      <code>spin</code>
    </div>
  </div>
</template>

<style scoped>
.icon-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.icon-demo__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 76px;
  padding: 12px 10px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
  color: var(--w-color-text, #0f172a);
}

.icon-demo__item code {
  color: var(--w-color-text-tertiary, #94a3b8);
  font-size: 10px;
}
</style>
