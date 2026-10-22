<script setup lang="ts">
import { ref } from 'vue'
import { CommandMenu } from '@wuhu-ui/command-menu'
import type { CommandMenuItem, CommandMenuKey } from '@wuhu-ui/command-menu'

const items: CommandMenuItem[] = [
  {
    key: 'publish',
    label: '发布新版本',
    description: '构建并推送到生产环境',
    group: '发布',
    shortcut: 'P P',
    keywords: ['deploy'],
  },
  {
    key: 'preview',
    label: '生成预览链接',
    description: '创建 24 小时有效的分享地址',
    group: '发布',
    shortcut: 'P L',
  },
  {
    key: 'rollback',
    label: '回滚上一版本',
    description: '将线上流量切回上一个稳定版本',
    group: '发布',
    disabled: true,
  },
  {
    key: 'logs',
    label: '查看构建日志',
    description: '定位失败步骤与耗时',
    group: '诊断',
    shortcut: 'L G',
  },
  {
    key: 'metrics',
    label: '指标看板',
    description: '错误率、延迟与流量趋势',
    group: '诊断',
    shortcut: 'M D',
  },
]

const selected = ref<CommandMenuKey>()
const lastAction = ref('（未选择）')

function handleSelect(item: CommandMenuItem) {
  lastAction.value = item.label
}
</script>

<template>
  <div class="command-demo">
    <div class="command-demo__panel">
      <CommandMenu
        v-model="selected"
        :items="items"
        aria-label="自定义 item 插槽"
        @select="handleSelect"
      >
        <template #item="{ item, index, active, selected, disabled }">
          <span
            class="command-slot-item"
            :class="{ 'is-active': active, 'is-selected': selected, 'is-disabled': disabled }"
          >
            <span class="command-slot-item__index">{{ String(index + 1).padStart(2, '0') }}</span>

            <span class="command-slot-item__body">
              <strong>{{ item.label }}</strong>
              <span v-if="item.description" class="command-slot-item__desc">
                {{ item.description }}
              </span>
            </span>

            <span v-if="item.group" class="command-slot-item__group">{{ item.group }}</span>
            <kbd v-if="item.shortcut" class="command-slot-item__shortcut">{{ item.shortcut }}</kbd>

            <svg
              v-if="selected"
              class="command-slot-item__check"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m3.5 8.5 3 3 6-7" />
            </svg>
          </span>
        </template>
      </CommandMenu>
    </div>

    <div class="command-demo__meta">
      <div class="command-demo__row">
        <span>选中 key</span>
        <strong>{{ selected ?? '（未选择）' }}</strong>
      </div>
      <div class="command-demo__row">
        <span>最近选择</span>
        <strong>{{ lastAction }}</strong>
      </div>
      <p class="hint">
        item 插槽只替换行内容；外层 role、键盘导航、悬浮高亮与点击选择仍由组件管理。
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
