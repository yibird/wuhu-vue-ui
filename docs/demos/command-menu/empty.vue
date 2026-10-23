<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox } from 'antdv-next'
import { CommandMenu } from '@wuhu-vue-ui/command-menu'
import type { CommandMenuItem, CommandMenuKey } from '@wuhu-vue-ui/command-menu'

const items: CommandMenuItem[] = [
  { key: 'search', label: '全局搜索', description: '跨项目查找内容', shortcut: '/' },
  { key: 'new', label: '新建文档', description: '创建空白文档', shortcut: 'N' },
  { key: 'invite', label: '邀请成员', description: '发送工作区邀请', shortcut: 'I' },
  { key: 'archive', label: '归档项目', description: '只读项目不可编辑', disabled: true },
]

const selected = ref<CommandMenuKey>()
const query = ref('')
const filterable = ref(true)
const disabled = ref(false)

function handleSearch(value: string) {
  query.value = value
}
</script>

<template>
  <div class="command-demo">
    <div class="command-demo__panel">
      <CommandMenu
        v-model="selected"
        :items="items"
        :filterable="filterable"
        :disabled="disabled"
        empty-text="没有匹配的命令，试试“新建”或“搜索”"
        placeholder="输入一个不存在的关键词..."
        aria-label="空状态命令菜单"
        @search="handleSearch"
      />
    </div>

    <div class="command-demo__meta">
      <Checkbox v-model:checked="filterable" class="command-option">启用搜索过滤</Checkbox>
      <Checkbox v-model:checked="disabled" class="command-option">禁用整个菜单</Checkbox>

      <div class="command-demo__row">
        <span>当前搜索</span>
        <strong>{{ query || '（空）' }}</strong>
      </div>

      <p class="hint">
        关闭过滤后所有命令保持可见；<code>emptyText</code>
        用于无匹配结果时的提示，禁用项会被键盘导航跳过。
      </p>
    </div>
  </div>
</template>

<style lang="less">
/* Command menu demo variants */
.command-option {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
  color: var(--w-color-text-secondary);
  font-size: 12px;
}
.command-demo {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 480px) minmax(0, 1fr);
  gap: 24px;
}

.command-demo__panel {
  min-width: 0;
}

.command-demo__meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-card, 12px);
  background: var(--w-color-surface-subtle);
}

.command-demo__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--w-color-text-tertiary);
  font-size: 11px;

  strong {
    overflow: hidden;
    color: var(--w-color-text);
    font-family: var(--w-font-family-mono);
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.command-demo__message {
  margin: 2px 0 0;
  color: var(--w-color-text-secondary);
  font-size: 12px;
}

.command-demo__meta .hint {
  margin-top: 0;
}

.command-slot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;

  &__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex: none;
    border-radius: 7px;
    background: var(--w-color-surface-subtle);
    color: var(--w-color-text-tertiary);
    font-family: var(--w-font-family-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.02em;
    transition:
      background-color var(--w-duration-fast) ease,
      color var(--w-duration-fast) ease;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1px;
    min-width: 0;

    strong {
      color: var(--w-color-text);
      font-size: 12.5px;
      font-weight: 600;
    }
  }

  &__desc {
    overflow: hidden;
    color: var(--w-color-text-tertiary);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__group {
    flex: none;
    padding: 2px 7px;
    border-radius: var(--w-radius-full);
    background: var(--w-color-primary-soft);
    color: var(--w-color-primary);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  &__shortcut {
    flex: none;
    color: var(--w-color-text-tertiary);
    font-family: var(--w-font-family-mono);
    font-size: 10px;
  }

  &__check {
    width: 14px;
    height: 14px;
    flex: none;
    color: var(--w-color-primary);
  }

  &.is-active &__index {
    background: var(--w-color-primary-soft);
    color: var(--w-color-primary);
  }

  &.is-selected &__index {
    background: var(--w-color-primary);
    color: var(--w-color-text-inverse);
  }

  &.is-disabled {
    opacity: 0.5;
  }
}

.command-slot-empty {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px 18px;
  text-align: center;

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    margin-bottom: 2px;
    border-radius: var(--w-radius-full);
    background: var(--w-color-surface-subtle);
    color: var(--w-color-text-tertiary);

    svg {
      width: 20px;
      height: 20px;
    }
  }

  strong {
    color: var(--w-color-text);
    font-size: 12.5px;
    font-weight: 600;
  }

  &__desc {
    max-width: 300px;
    color: var(--w-color-text-tertiary);
    font-size: 11px;
    line-height: 1.65;
  }

  &__hint {
    margin-top: 2px;
    padding: 2px 8px;
    border-radius: var(--w-radius-full);
    background: var(--w-color-surface-subtle);
    color: var(--w-color-text-tertiary);
    font-family: var(--w-font-family-mono);
    font-size: 9px;
  }
}
</style>
