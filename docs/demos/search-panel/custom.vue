<script setup lang="ts">
import { ref } from 'vue'
import { SearchPanel } from '@wuhu-vue-ui/search-panel'
import type { CommandMenuItem } from '@wuhu-vue-ui/command-menu'

const open = ref(false)
const message = ref('已禁用全局快捷键，点击按钮打开')

const items: CommandMenuItem[] = [
  { key: 'new-file', label: '新建文件', description: '创建一个空白文档', group: '文件' },
  { key: 'new-folder', label: '新建文件夹', description: '在当前目录创建文件夹', group: '文件' },
  { key: 'search', label: '全局搜索', description: '搜索项目内所有内容', group: '导航' },
  { key: 'settings', label: '打开设置', description: '调整编辑器与主题偏好', group: '导航' },
]

function handleSelect(item: CommandMenuItem) {
  message.value = `已选择「${item.label}」`
  open.value = false
}
</script>

<template>
  <div class="search-panel-custom">
    <button type="button" class="search-panel-custom__trigger" @click="open = true">
      打开自定义面板
    </button>
    <p class="search-panel-custom__hint">{{ message }}</p>

    <SearchPanel
      v-model:open="open"
      :items="items"
      :shortcut="false"
      width="560"
      @select="handleSelect"
    >
      <template #header="{ close }">
        <div class="search-panel-custom__header">
          <span class="search-panel-custom__badge">⌘</span>
          <strong>编辑器命令</strong>
          <button
            type="button"
            class="search-panel-custom__close"
            aria-label="关闭搜索面板"
            @click="close"
          >
            ✕
          </button>
        </div>
      </template>

      <template #item="{ item, active }">
        <span class="search-panel-custom__row" :class="{ 'is-active': active }">
          <span class="search-panel-custom__label">{{ item.label }}</span>
          <small v-if="item.description">{{ item.description }}</small>
        </span>
      </template>

      <template #footer>
        <span>自定义底部：Enter 执行 · Esc 退出</span>
      </template>
    </SearchPanel>
  </div>
</template>

<style lang="less">
.search-panel-custom {
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

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    color: var(--w-color-text);
    font-size: var(--w-font-size-sm, 13px);
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--w-radius-sm, 6px);
    background: var(--w-color-primary-soft, rgba(79, 70, 229, 0.12));
    color: var(--w-color-primary, #4f46e5);
    font-size: 12px;
  }

  &__close {
    margin-left: auto;
    border: none;
    background: transparent;
    color: var(--w-color-text-tertiary);
    font: inherit;
    cursor: pointer;

    &:focus-visible {
      outline: var(--w-focus-ring-width, 2px) solid var(--w-focus-ring-color);
      outline-offset: var(--w-focus-ring-offset, 2px);
    }
  }

  &__row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-weight: 500;
  }

  &__row small {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-2xs, 11px);
  }
}
</style>
