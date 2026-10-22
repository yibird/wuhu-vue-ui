<script setup lang="ts">
import { ref } from 'vue'
import { Gantt } from '@wuhu-ui/gantt'
import type {
  GanttContextMenuItem,
  GanttContextMenuSelectEvent,
  GanttTask,
  GanttTaskId,
} from '@wuhu-ui/gantt'
import { createGanttTasks, findGanttTask, useGanttSidebarWidth } from './shared'

const tasks = ref(createGanttTasks())
const sidebarWidth = useGanttSidebarWidth()
const selected = ref<GanttTaskId | null>(null)
const message = ref('在任务行或任务条上点击右键，打开操作菜单')

function contextMenuItems(task: GanttTask): GanttContextMenuItem[] {
  return [
    { key: 'detail', label: '查看详情', shortcut: 'Enter' },
    {
      key: 'complete',
      label: task.progress === 100 ? '已完成' : '标记完成',
      disabled: task.progress === 100,
    },
    { key: 'divider', divider: true },
    { key: 'delete', label: '删除任务', danger: true },
  ]
}

function handleContextMenuSelect(event: GanttContextMenuSelectEvent) {
  const { item, task } = event

  if (item.key === 'complete') {
    const target = findGanttTask(tasks.value, task.id)
    if (target) target.progress = 100
    message.value = `已将「${task.name}」标记为完成`
    return
  }

  message.value = `已选择「${item.label}」· ${task.name}`
}
</script>

<template>
  <div class="gantt-card">
    <Gantt
      v-model:selected="selected"
      :tasks="tasks"
      :sidebar-width="sidebarWidth"
      :context-menu-items="contextMenuItems"
      view="week"
      height="420px"
      locale="zh-CN"
      @context-menu-select="handleContextMenuSelect"
    />

    <div class="gantt-card__footer">
      <span>
        右键任务
        <strong>打开上下文菜单</strong>
      </span>
      <span class="hint">{{ message }}</span>
    </div>
  </div>
</template>

<style lang="less">
.gantt-panel-demo {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 272px;
  gap: 16px;
  align-items: start;
}

.gantt-task-panel {
  min-height: 240px;
  padding: 16px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-panel, 16px);
  background: var(--w-color-surface);
  box-shadow: var(--w-shadow-sm);
  transition:
    border-color var(--w-duration-normal, 220ms) var(--w-easing-standard, ease),
    box-shadow var(--w-duration-normal, 220ms) var(--w-easing-standard, ease);

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  &__title {
    margin: 0;
    font-size: var(--w-font-size-md);
    font-weight: 650;
    line-height: 1.3;
  }

  &__id {
    display: inline-block;
    margin-top: 3px;
    color: var(--w-color-text-tertiary);
    font-family: var(--w-font-family-mono);
    font-size: 10px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 16px 0 0;
  }

  &__row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    font-size: var(--w-font-size-xs);

    dt {
      color: var(--w-color-text-tertiary);
    }

    dd {
      margin: 0;
      color: var(--w-color-text);
      font-weight: 500;
      text-align: right;
    }
  }

  &__event {
    margin: 16px 0 0;
    padding-top: 12px;
    border-top: 1px dashed var(--w-color-border);
    color: var(--w-color-text-tertiary);
    font-size: 11px;

    code {
      color: var(--w-color-primary);
    }
  }

  &__empty {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    min-height: 200px;
    text-align: center;

    strong {
      font-size: var(--w-font-size-sm);
    }

    p {
      margin: 6px 0 0;
      color: var(--w-color-text-tertiary);
      font-size: 11px;
      line-height: 1.6;
    }

    code {
      color: var(--w-color-primary);
    }
  }
}

@media (max-width: 860px) {
  .gantt-panel-demo {
    grid-template-columns: minmax(0, 1fr);
  }
}

.gantt-card {
  overflow: hidden;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-panel, 16px);
  background: var(--w-color-surface);
  box-shadow: var(--w-shadow-sm);

  .w-gantt {
    border: none;
    border-radius: 0;
    box-shadow: none;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-top: 1px solid var(--w-color-border);
    background: var(--w-color-surface-subtle);
    color: var(--w-color-text-secondary);
    font-size: 11px;

    strong {
      color: var(--w-color-text);
      font-weight: 600;
    }

    .hint {
      margin: 0 0 0 auto;
    }
  }

  &__update {
    margin-left: auto;
    color: var(--w-color-success);
  }
}

.gantt-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;

  &__hint {
    margin-left: auto;
    color: var(--w-color-text-tertiary);
    font-size: 10px;
  }
}
@media (max-width: 640px) {
  .gantt-card__footer {
    align-items: flex-start;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 6px;
  }
}
</style>
