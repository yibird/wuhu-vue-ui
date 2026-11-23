<script setup lang="ts">
import { ref } from 'vue'
import { SearchPanel } from '@wuhu-vue-ui/search-panel'
import type { CommandMenuItem } from '@wuhu-vue-ui/command-menu'

const open = ref(false)
const selected = ref<string | number>()
const message = ref('按 Ctrl / Cmd + K 或点击按钮打开')

const items: CommandMenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    description: '查看今日概览与关键指标',
    group: '最近访问',
    shortcut: 'G D',
  },
  {
    key: 'users',
    label: '用户管理',
    description: '搜索、编辑与停用用户',
    group: '最近访问',
    shortcut: 'G U',
  },
  {
    key: 'release',
    label: '发起发布',
    description: '创建版本并通知相关负责人',
    group: '操作',
    shortcut: 'N R',
  },
  {
    key: 'settings',
    label: '系统设置',
    description: '主题、通知与安全策略',
    group: '页面',
    shortcut: 'G S',
  },
  {
    key: 'billing',
    label: '账单与订阅',
    description: '查看发票并管理套餐',
    group: '页面',
    shortcut: 'G B',
  },
]

function handleSelect(item: CommandMenuItem) {
  message.value = `已打开「${item.label}」`
}
</script>

<template>
  <div class="search-panel-basic">
    <button type="button" class="search-panel-basic__trigger" @click="open = true">
      打开搜索面板
    </button>
    <p class="search-panel-basic__hint">{{ message }}</p>

    <SearchPanel
      v-model:open="open"
      v-model:value="selected"
      :items="items"
      placeholder="搜索页面、操作或成员..."
      @select="handleSelect"
    />
  </div>
</template>

<style lang="less">
.search-panel-basic {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-lg, 12px);
  background: var(--w-color-surface);

  &__trigger {
    padding: 7px 12px;
    border: 1px solid var(--w-color-border-strong);
    border-radius: var(--w-radius-sm, 6px);
    background: var(--w-color-surface-elevated);
    color: var(--w-color-text);
    font: inherit;
    cursor: pointer;

    &:focus-visible {
      outline: var(--w-focus-ring-width, 2px) solid var(--w-focus-ring-color);
      outline-offset: var(--w-focus-ring-offset, 2px);
    }
  }

  &__hint {
    margin: 0;
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs, 12px);
  }
}
</style>
