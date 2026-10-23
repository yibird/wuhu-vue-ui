<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, Segmented } from 'antdv-next'
import { Gantt } from '@wuhu-vue-ui/gantt'
import type { GanttTaskId, GanttTaskUpdateEvent, GanttView } from '@wuhu-vue-ui/gantt'
import { createGanttTasks, findGanttTask, formatDateValue, useGanttSidebarWidth } from './shared'

const tasks = ref(createGanttTasks())
const view = ref<GanttView>('week')
const views: { label: string; value: GanttView }[] = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
]
const selected = ref<GanttTaskId | null>('components')
const message = ref('')
const sidebarWidth = useGanttSidebarWidth()

const selectedName = computed(
  () => findGanttTask(tasks.value, selected.value ?? '')?.name ?? '未选择',
)

function handleTaskUpdate(event: GanttTaskUpdateEvent) {
  const task = findGanttTask(tasks.value, event.task.id)
  if (!task) return
  task.start = formatDateValue(event.start)
  task.end = formatDateValue(event.end)
  message.value = `${task.name} 已调整为 ${formatDateValue(event.start)} → ${formatDateValue(event.end)}`
}
</script>

<template>
  <div class="gantt-card">
    <Gantt
      v-model:selected="selected"
      :tasks="tasks"
      :view="view"
      :sidebar-width="sidebarWidth"
      height="620px"
      locale="zh-CN"
      @task-update="handleTaskUpdate"
    >
      <template #toolbar="{ scrollToToday }">
        <div class="gantt-toolbar">
          <Segmented v-model:value="view" :options="views" />
          <Button @click="scrollToToday">定位今天</Button>
          <span class="gantt-toolbar__hint">拖动任务条调整日期，拖拽两端调整工期</span>
        </div>
      </template>
    </Gantt>

    <div class="gantt-card__footer">
      <span>
        当前选中
        <strong>{{ selectedName }}</strong>
      </span>
      <span v-if="message" class="gantt-card__update">{{ message }}</span>
      <span v-else class="hint">依赖箭头由 dependencies 自动生成</span>
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
