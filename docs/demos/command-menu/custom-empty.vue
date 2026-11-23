<script setup lang="ts">
import { ref } from 'vue'
import { CommandMenu } from '@wuhu-vue-ui/command-menu'
import type { CommandMenuItem, CommandMenuKey } from '@wuhu-vue-ui/command-menu'

const items: CommandMenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    description: '查看今日概览与关键指标',
    group: '导航',
    keywords: ['首页', 'home', 'shouye'],
  },
  {
    key: 'users',
    label: '用户管理',
    description: '搜索、编辑与停用用户',
    group: '导航',
    keywords: ['账户', 'members'],
  },
  {
    key: 'settings',
    label: '系统设置',
    description: '主题、通知与安全策略',
    group: '设置',
    keywords: ['配置', 'settings'],
  },
  {
    key: 'help',
    label: '帮助中心',
    description: '查看文档或联系技术支持',
    group: '设置',
    keywords: ['文档', 'docs'],
  },
]

const selected = ref<CommandMenuKey>()
const query = ref('')

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
        placeholder="输入一个不存在的命令，例如 focus"
        @search="handleSearch"
      >
        <template #empty="{ query }">
          <span class="command-slot-empty">
            <span class="command-slot-empty__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8" />
                <path
                  d="m15.5 15.5 4 4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
                <path
                  d="m8.5 8.5 4 4m0-4-4 4"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </span>

            <strong>没有找到「{{ query }}」</strong>
            <span class="command-slot-empty__desc"> 试试更短的关键词，例如「工作」。 </span>
            <span class="command-slot-empty__hint">empty 插槽接收当前 query</span>
          </span>
        </template>
      </CommandMenu>
    </div>

    <div class="command-demo__meta">
      <div class="command-demo__row">
        <span>当前搜索</span>
        <strong>{{ query || '（空）' }}</strong>
      </div>
      <p class="hint">
        empty 插槽可完全接管空结果 UI；组件外层的 role="status" 仍会保留，便于读屏播报。
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
