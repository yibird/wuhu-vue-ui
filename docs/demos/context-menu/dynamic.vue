<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { ContextMenu } from '@wuhu-vue-ui/context-menu'
import type {
  ContextMenuExpose,
  ContextMenuItem,
  ContextMenuSelectDetails,
} from '@wuhu-vue-ui/context-menu'

interface Row {
  id: number
  name: string
  locked?: boolean
}

const rows: Row[] = [
  { id: 1, name: '产品需求文档' },
  { id: 2, name: '发布计划', locked: true },
  { id: 3, name: '会议记录' },
]

const menu = ref<ContextMenuExpose>()
const current = ref<Row | null>(null)
const message = ref('')

const items = computed<ContextMenuItem[]>(() => {
  const row = current.value
  if (!row) return []

  return [
    { type: 'header', label: row.locked ? '只读文件' : '文件操作' },
    { key: 'open', label: '打开', icon: h('span', '↗') },
    {
      key: 'rename',
      label: '重命名',
      suffix: h('kbd', 'F2'),
      disabled: row.locked,
    },
    { key: 'duplicate', label: '创建副本', disabled: row.locked },
    { type: 'separator' },
    { key: 'delete', label: '删除', danger: true, disabled: row.locked },
  ]
})

function openMenu(event: MouseEvent, row: Row) {
  current.value = row
  menu.value?.open(event)
}

function handleSelect({ item }: ContextMenuSelectDetails) {
  if (!('label' in item)) return
  message.value = `${current.value?.name ?? ''} · ${item.label}`
}
</script>

<template>
  <ContextMenu ref="menu" :items="items" @select="handleSelect" />

  <ul class="context-menu-rows">
    <li
      v-for="row in rows"
      :key="row.id"
      :class="{ 'is-active': current?.id === row.id }"
      @contextmenu.prevent="openMenu($event, row)"
    >
      <span>{{ row.name }}</span>
      <em>{{ row.locked ? '只读' : '可编辑' }}</em>
    </li>
  </ul>
  <p class="hint">{{ message || 'items 是函数时，会在每次打开前按命中的数据生成菜单项。' }}</p>
</template>

<style lang="less">
.context-menu-rows {
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-lg, 12px);
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 14px;
    border-bottom: 1px solid var(--w-color-border-subtle);
    background: var(--w-color-surface);
    font-size: var(--w-font-size-sm, 13px);
    cursor: context-menu;

    &:last-child {
      border-bottom: 0;
    }

    &:hover,
    &.is-active {
      background: var(--w-color-surface-hover);
    }
  }

  em {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs, 12px);
    font-style: normal;
  }
}
</style>
