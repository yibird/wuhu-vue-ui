<script setup lang="ts">
import { computed, ref } from 'vue'
import { CommandMenu } from '@wuhu-vue-ui/command-menu'
import { Copy } from '@wuhu-vue-ui/copy'
import { Gantt } from '@wuhu-vue-ui/gantt'
import { NumberTicker } from '@wuhu-vue-ui/number-ticker'
import { Time } from '@wuhu-vue-ui/time'
import type { CommandMenuItem } from '@wuhu-vue-ui/command-menu'
import type { GanttTask, GanttTaskId } from '@wuhu-vue-ui/gantt'
import { lastSyncedAt, releaseCommands, releaseTasks } from './fixtures'

const ganttRef = ref<InstanceType<typeof Gantt>>()
const selectedId = ref<GanttTaskId | null>('frontend')

function findTask(tasks: GanttTask[], id: GanttTaskId | null): GanttTask | undefined {
  if (id === null) return undefined
  for (const task of tasks) {
    if (task.id === id) return task
    const child = findTask(task.children ?? [], id)
    if (child) return child
  }
  return undefined
}

const selectedTask = computed(() => findTask(releaseTasks, selectedId.value))

async function locateTask(item: CommandMenuItem) {
  const id = String(item.key).replace(/^task:/, '')
  await ganttRef.value?.scrollToTask(id)
  selectedId.value = id
}
</script>

<template>
  <div class="scenario-app">
    <header class="scenario-app__bar">
      <div class="scenario-app__title">
        <strong>Wuhu UI 0.1 发布计划</strong>
        <span>REL-2026-11 · 产品研发</span>
      </div>
      <div class="scenario-app__meta">
        <Copy :text="() => 'REL-2026-11'">REL-2026-11</Copy>
        <span>同步于 <Time :time="lastSyncedAt" /></span>
      </div>
    </header>

    <div class="scenario-app__body">
      <div class="scenario-app__main">
        <Gantt
          ref="ganttRef"
          :tasks="releaseTasks"
          height="100%"
          view="week"
          :scroll-to-today="false"
          @task-click="selectedId = $event.id"
        />
      </div>

      <aside class="scenario-app__side">
        <section class="scenario-app__section">
          <h3 class="scenario-app__section-title">版本指标</h3>
          <dl class="scenario-app__metrics">
            <div class="scenario-app__metric">
              <dt>任务总数</dt>
              <dd><NumberTicker :value="8" /></dd>
            </div>
            <div class="scenario-app__metric">
              <dt>进行中</dt>
              <dd><NumberTicker :value="3" /></dd>
            </div>
            <div class="scenario-app__metric">
              <dt>平均进度</dt>
              <dd><NumberTicker :value="49" suffix="%" /></dd>
            </div>
            <div class="scenario-app__metric">
              <dt>剩余天数</dt>
              <dd><NumberTicker :value="7" suffix=" 天" /></dd>
            </div>
          </dl>
        </section>

        <section class="scenario-app__section">
          <h3 class="scenario-app__section-title">快速定位</h3>
          <CommandMenu
            :items="releaseCommands"
            placeholder="搜索任务或负责人..."
            aria-label="定位发布任务"
            @select="locateTask"
          />
        </section>

        <section class="scenario-app__section">
          <h3 class="scenario-app__section-title">当前任务</h3>
          <div v-if="selectedTask" class="scenario-task">
            <strong>{{ selectedTask.name }}</strong>
            <span>{{ selectedTask.assignee ?? '未分配' }} · {{ selectedTask.progress ?? 0 }}%</span>
          </div>
          <p v-else class="scenario-app__empty">在排期中点击任务查看详情</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style lang="less">
.scenario-task {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: var(--w-font-size-sm);
    font-weight: 600;
  }

  span {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs);
  }
}

.scenario-app__main .w-gantt {
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.scenario-app__side .w-command-menu {
  box-shadow: none;
}
</style>
