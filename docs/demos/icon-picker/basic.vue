<script setup lang="ts">
import { ref } from 'vue'
import { IconPicker } from '@wuhu-vue-ui/icon-picker'
import type { IconPickerItem } from '@wuhu-vue-ui/icon-picker'
import { iconGroups } from './icons'

const selected = ref<string | null>(null)
const lastSelected = ref<IconPickerItem | null>(null)

function handleSelect(item: IconPickerItem) {
  lastSelected.value = item
}
</script>

<template>
  <div class="icon-picker-demo">
    <IconPicker v-model:value="selected" :items="iconGroups" @select="handleSelect" />

    <div class="icon-picker-demo__result">
      <span>当前图标</span>
      <strong>{{ selected ?? '（未选择）' }}</strong>
      <span>最近选择</span>
      <strong>{{ lastSelected?.label ?? '（无）' }}</strong>
    </div>
  </div>
</template>

<style lang="less">
.icon-picker-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-picker-demo__result {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--w-color-text-tertiary);
  font-size: var(--w-font-size-xs);

  strong {
    color: var(--w-color-text);
    font-family: var(--w-font-family-mono);
    font-size: 11px;
    font-weight: 600;
  }
}
</style>
