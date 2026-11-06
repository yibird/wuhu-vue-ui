<script setup lang="ts">
import { ref } from 'vue'
import { ContextMenu } from '@wuhu-vue-ui/context-menu'
import type {
  ContextMenuExpose,
  ContextMenuItem,
  ContextMenuSelectDetails,
} from '@wuhu-vue-ui/context-menu'

const menu = ref<ContextMenuExpose>()
const message = ref('在卡片内点击右键')

const items: ContextMenuItem[] = [
  { type: 'header', label: '文档' },
  { key: 'open', label: '打开' },
  { key: 'rename', label: '重命名' },
  { key: 'duplicate', label: '创建副本', disabled: true },
  { type: 'separator' },
  { key: 'delete', label: '删除', danger: true },
]

function openMenu(event: MouseEvent) {
  menu.value?.open(event)
}

function handleSelect({ item }: ContextMenuSelectDetails) {
  if (!('label' in item)) return
  message.value = `已选择「${item.label}」`
}
</script>

<template>
  <ContextMenu ref="menu" :items="items" @select="handleSelect" />

  <div class="context-menu-demo" @contextmenu.prevent="openMenu">
    <strong>右键点击此区域</strong>
    <span>菜单支持分组标题、分隔线、禁用与危险项。</span>
  </div>
  <p class="hint">{{ message }}</p>
</template>

<style lang="less">
.context-menu-demo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 24px;
  border: 1px dashed var(--w-color-border-strong);
  border-radius: var(--w-radius-lg, 12px);
  background: var(--w-color-surface-subtle);
  text-align: center;
  cursor: context-menu;

  strong {
    color: var(--w-color-text);
    font-size: var(--w-font-size-sm, 13px);
  }

  span {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs, 12px);
  }
}
</style>
