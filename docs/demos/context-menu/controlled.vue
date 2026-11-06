<script setup lang="ts">
import { ref } from 'vue'
import { ContextMenu } from '@wuhu-vue-ui/context-menu'
import type {
  ContextMenuExpose,
  ContextMenuItem,
  ContextMenuSelectDetails,
} from '@wuhu-vue-ui/context-menu'

const menu = ref<ContextMenuExpose>()
const open = ref(false)
const message = ref('菜单当前关闭')

const items: ContextMenuItem[] = [
  { key: 'preview', label: '预览' },
  { key: 'share', label: '分享链接' },
  { key: 'settings', label: '更多设置' },
]

function openMenu(event: MouseEvent) {
  menu.value?.open(event)
}

function handleSelect({ item }: ContextMenuSelectDetails) {
  if (!('label' in item)) return
  message.value = `已选择「${item.label}」，open = ${String(open.value)}`
}
</script>

<template>
  <ContextMenu
    ref="menu"
    v-model:open="open"
    :items="items"
    @select="handleSelect"
    @close="message = `菜单已关闭（open = ${String(open)}）`"
  />

  <div class="context-menu-controlled">
    <button type="button" @click="openMenu">在点击位置打开</button>
    <span
      >open：<strong>{{ open }}</strong></span
    >
    <span>{{ message }}</span>
  </div>
</template>

<style lang="less">
.context-menu-controlled {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-lg, 12px);
  background: var(--w-color-surface);
  color: var(--w-color-text-tertiary);
  font-size: var(--w-font-size-xs, 12px);

  button {
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

  strong {
    color: var(--w-color-text);
  }
}
</style>
