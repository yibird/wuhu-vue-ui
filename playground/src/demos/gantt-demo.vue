<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Gantt } from '@wuhu-vue-ui/gantt'
import type {
  GanttContextMenuItem,
  GanttContextMenuSelectEvent,
  GanttTask,
  GanttTaskId,
  GanttTaskUpdateEvent,
  GanttView,
} from '@wuhu-vue-ui/gantt'
import DemoCard from '../components/demo-card.vue'

function isoDate(offset: number): string {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const ganttTasks = ref<GanttTask[]>([
  {
    id: 'plan',
    name: '产品规划',
    children: [
      {
        id: 'research',
        name: '用户调研',
        start: isoDate(-8),
        end: isoDate(-4),
        progress: 100,
        assignee: 'Lin',
      },
      {
        id: 'prd',
        name: '需求文档',
        start: isoDate(-3),
        end: isoDate(2),
        progress: 86,
        dependencies: ['research'],
        assignee: 'Mia',
      },
    ],
  },
  {
    id: 'design',
    name: '视觉设计',
    children: [
      {
        id: 'banner',
        name: '首页视觉',
        start: isoDate(1),
        end: isoDate(8),
        progress: 58,
        dependencies: ['prd'],
        assignee: 'Ava',
      },
      {
        id: 'motion',
        name: '动效规范',
        start: isoDate(5),
        end: isoDate(11),
        progress: 24,
        dependencies: ['prd'],
        assignee: 'Noah',
      },
    ],
  },
  {
    id: 'development',
    name: '研发交付',
    children: [
      {
        id: 'components',
        name: '组件开发',
        start: isoDate(4),
        end: isoDate(16),
        progress: 46,
        dependencies: ['banner'],
        assignee: 'Chen',
      },
      {
        id: 'integration',
        name: '接口联调',
        start: isoDate(12),
        end: isoDate(20),
        progress: 18,
        dependencies: ['components'],
        assignee: 'Rui',
      },
      {
        id: 'review',
        name: '代码评审',
        start: isoDate(20),
        end: isoDate(20),
        milestone: true,
        dependencies: ['integration'],
      },
    ],
  },
  {
    id: 'release',
    name: '测试发布',
    children: [
      {
        id: 'qa',
        name: '全量测试',
        start: isoDate(21),
        end: isoDate(26),
        progress: 0,
        dependencies: ['review'],
        assignee: 'Iris',
      },
      {
        id: 'launch',
        name: '正式发布',
        start: isoDate(28),
        end: isoDate(28),
        milestone: true,
        dependencies: ['qa'],
      },
    ],
  },
])

const ganttView = ref<GanttView>('week')
const ganttViews: { label: string; value: GanttView }[] = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
]
const ganttSelected = ref<GanttTaskId | null>('components')
const ganttUpdateMessage = ref('')
const ganttSidebarWidth = ref(280)

function syncGanttSidebarWidth() {
  ganttSidebarWidth.value = window.innerWidth < 700 ? 176 : 280
}

onMounted(() => {
  syncGanttSidebarWidth()
  window.addEventListener('resize', syncGanttSidebarWidth)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncGanttSidebarWidth)
})

function findTask(tasks: GanttTask[], id: GanttTaskId): GanttTask | undefined {
  for (const task of tasks) {
    if (task.id === id) return task
    if (task.children) {
      const found = findTask(task.children, id)
      if (found) return found
    }
  }
}

const selectedTaskName = computed(
  () => findTask(ganttTasks.value, ganttSelected.value ?? '')?.name ?? '未选择',
)

function formatDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function handleTaskUpdate(event: GanttTaskUpdateEvent) {
  const task = findTask(ganttTasks.value, event.task.id)
  if (!task) return
  task.start = formatDateValue(event.start)
  task.end = formatDateValue(event.end)
  ganttUpdateMessage.value = `${task.name} 已调整为 ${formatDateValue(event.start)} → ${formatDateValue(event.end)}`
}

const ganttContextMenuItems: GanttContextMenuItem[] = [
  { key: 'detail', label: '查看详情', shortcut: 'Enter' },
  { key: 'complete', label: '标记完成' },
  { key: 'divider', divider: true },
  { key: 'delete', label: '删除任务', danger: true },
]

function handleContextMenuSelect(event: GanttContextMenuSelectEvent) {
  if (event.item.key === 'complete') {
    const task = findTask(ganttTasks.value, event.task.id)
    if (task) task.progress = 100
  }
  ganttUpdateMessage.value = `右键菜单：${event.item.label} · ${event.task.name}`
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="完整交互"
      description="层级任务、依赖箭头、进度与里程碑；拖动任务条或两端即可调整排期，右键任务可打开操作菜单。"
      wide
      flush
    >
      <div class="gantt-card">
        <Gantt
          v-model:selected="ganttSelected"
          :tasks="ganttTasks"
          :view="ganttView"
          :sidebar-width="ganttSidebarWidth"
          :context-menu-items="ganttContextMenuItems"
          height="640px"
          locale="zh-CN"
          @task-update="handleTaskUpdate"
          @context-menu-select="handleContextMenuSelect"
        >
          <template #toolbar="{ scrollToToday }">
            <div class="gantt-toolbar">
              <div class="segmented" role="group" aria-label="甘特图时间粒度">
                <button
                  v-for="option in ganttViews"
                  :key="option.value"
                  type="button"
                  :class="{ 'is-active': ganttView === option.value }"
                  @click="ganttView = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
              <button type="button" class="button button--small" @click="scrollToToday">
                定位今天
              </button>
              <span class="gantt-toolbar__hint">拖动任务条调整日期，拖拽两端调整工期</span>
            </div>
          </template>
        </Gantt>

        <div class="gantt-card__footer">
          <span>
            当前选中
            <strong>{{ selectedTaskName }}</strong>
          </span>
          <span v-if="ganttUpdateMessage" class="gantt-card__update">
            {{ ganttUpdateMessage }}
          </span>
          <span v-else class="hint">依赖箭头由 dependencies 自动生成</span>
        </div>
      </div>
    </DemoCard>

    <DemoCard
      title="只读月视图"
      description="readonly 关闭拖拽与缩放，适合汇报与只读大屏。"
      wide
      flush
    >
      <div class="gantt-card">
        <Gantt
          :tasks="ganttTasks"
          view="month"
          :sidebar-width="ganttSidebarWidth"
          height="340px"
          locale="zh-CN"
          readonly
          :scroll-to-today="false"
        />
      </div>
    </DemoCard>
  </div>
</template>
