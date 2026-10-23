import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { GanttTask } from '@wuhu-vue-ui/gantt'

function isoDate(offset: number): string {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createGanttTasks(): GanttTask[] {
  return [
    {
      id: 'plan',
      name: '产品规划',
      color: '#4f46e5',
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
      color: '#db2777',
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
      color: '#0f766e',
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
          color: '#f59e0b',
          dependencies: ['integration'],
        },
      ],
    },
    {
      id: 'release',
      name: '测试发布',
      color: '#0284c7',
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
          color: '#dc2626',
          dependencies: ['qa'],
        },
      ],
    },
  ]
}

export function useGanttSidebarWidth() {
  const sidebarWidth = ref(280)

  function sync() {
    sidebarWidth.value = window.innerWidth < 700 ? 176 : 280
  }

  onMounted(() => {
    sync()
    window.addEventListener('resize', sync)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', sync)
  })

  return sidebarWidth
}

export function findGanttTask(tasks: GanttTask[], id: string | number): GanttTask | undefined {
  for (const task of tasks) {
    if (task.id === id) return task
    if (task.children) {
      const found = findGanttTask(task.children, id)
      if (found) return found
    }
  }
}

export function formatDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
