<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { ContextMenu } from '@wuhu-vue-ui/context-menu'
import type {
  ContextMenuExpose,
  ContextMenuItem,
  ContextMenuSelectDetails,
} from '@wuhu-vue-ui/context-menu'
import DemoCard from '../components/demo-card.vue'

interface FileRow {
  id: number
  name: string
  kind: 'file' | 'folder'
  locked?: boolean
}

const files: FileRow[] = [
  { id: 1, name: '产品需求文档', kind: 'file' },
  { id: 2, name: '设计资源', kind: 'folder' },
  { id: 3, name: '发布计划', kind: 'file', locked: true },
  { id: 4, name: '会议记录', kind: 'file' },
]

const menu = ref<ContextMenuExpose>()
const activeFile = ref<FileRow | null>(null)
const log = ref<string[]>([])

const items = computed<ContextMenuItem[]>(() => {
  const row = activeFile.value
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

function openMenu(event: MouseEvent, row: FileRow) {
  activeFile.value = row
  menu.value?.open(event)
}

/**
 * Pass items as a resolver: `open()` runs in the same tick as `activeFile`
 * changes, before the parent re-renders, so an array prop would still be the
 * previous (empty) list. The resolver reads the current computed value.
 */
function resolveItems() {
  return items.value
}

function handleSelect({ item }: ContextMenuSelectDetails) {
  if (!('label' in item)) return
  const name = activeFile.value?.name ?? ''
  log.value = [`${name} · ${item.label}`, ...log.value].slice(0, 4)
}
</script>

<template>
  <DemoCard
    title="命令式右键菜单"
    description="在列表项上点击右键打开菜单；items 根据命中的行动态生成，禁用状态随数据变化。"
    wide
  >
    <ContextMenu ref="menu" :items="resolveItems" @select="handleSelect" />

    <div class="context-demo">
      <ul class="context-demo__list">
        <li
          v-for="row in files"
          :key="row.id"
          class="context-demo__row"
          :class="{ 'is-active': activeFile?.id === row.id }"
          @contextmenu.prevent="openMenu($event, row)"
        >
          <span class="context-demo__badge">{{ row.kind === 'folder' ? '文件夹' : '文件' }}</span>
          <span class="context-demo__name">{{ row.name }}</span>
          <span class="context-demo__meta">{{ row.locked ? '只读' : '可编辑' }}</span>
        </li>
      </ul>

      <div class="context-demo__footer">
        <span v-if="activeFile" class="context-demo__hint">
          当前目标：<strong>{{ activeFile.name }}</strong>
        </span>
        <span v-else class="context-demo__hint">在任意一行上点击右键</span>
        <span v-if="log.length" class="context-demo__log">{{ log[0] }}</span>
      </div>
    </div>
  </DemoCard>
</template>

<style lang="less">
.context-demo {
  overflow: hidden;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-lg, 12px);
  background: var(--w-color-surface);

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--w-color-border-subtle);
    cursor: context-menu;
    transition: background-color var(--w-duration-fast) var(--w-easing-standard);

    &:last-child {
      border-bottom: 0;
    }

    &:hover,
    &.is-active {
      background: var(--w-color-surface-hover);
    }
  }

  &__badge {
    flex: none;
    padding: 2px 7px;
    border-radius: var(--w-radius-full, 9999px);
    background: var(--w-color-primary-soft);
    color: var(--w-color-primary);
    font-size: var(--w-font-size-2xs, 11px);
  }

  &__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--w-font-size-sm, 13px);
  }

  &__meta,
  &__hint {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs, 12px);
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-top: 1px solid var(--w-color-border);
    background: var(--w-color-surface-subtle);
    font-size: var(--w-font-size-xs, 12px);

    strong {
      color: var(--w-color-text);
      font-weight: 600;
    }
  }

  &__log {
    margin-left: auto;
    color: var(--w-color-success);
  }
}
</style>
