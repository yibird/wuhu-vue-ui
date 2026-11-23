import type { CommandMenuItem } from '@wuhu-vue-ui/command-menu'
import type { GanttTask } from '@wuhu-vue-ui/gantt'

export interface Conversation {
  id: number
  name: string
  company: string
  preview: string
  unread: number
  time: string
}

export interface ReviewComment {
  id: number
  author: string
  page: number
  body: string
  time: string
}

export const releaseTasks: GanttTask[] = [
  {
    id: 'requirements',
    name: '需求与范围',
    children: [
      {
        id: 'brief',
        name: '版本需求确认',
        start: '2026-11-02',
        end: '2026-11-05',
        progress: 100,
        assignee: '林然',
      },
      {
        id: 'scope',
        name: '范围评审',
        start: '2026-11-05',
        end: '2026-11-07',
        progress: 100,
        dependencies: ['brief'],
        assignee: '周叙',
      },
    ],
  },
  {
    id: 'design',
    name: '设计',
    children: [
      {
        id: 'flow',
        name: '交互稿',
        start: '2026-11-06',
        end: '2026-11-11',
        progress: 80,
        dependencies: ['scope'],
        assignee: '米娅',
      },
      {
        id: 'visual',
        name: '视觉稿',
        start: '2026-11-09',
        end: '2026-11-14',
        progress: 55,
        dependencies: ['flow'],
        assignee: '艾娃',
      },
    ],
  },
  {
    id: 'build',
    name: '研发',
    children: [
      {
        id: 'frontend',
        name: '前端实现',
        start: '2026-11-12',
        end: '2026-11-20',
        progress: 35,
        dependencies: ['visual'],
        assignee: '陈默',
      },
      {
        id: 'backend',
        name: '接口联调',
        start: '2026-11-15',
        end: '2026-11-21',
        progress: 20,
        dependencies: ['frontend'],
        assignee: '瑞雪',
      },
    ],
  },
  {
    id: 'ship',
    name: '发布',
    children: [
      {
        id: 'qa',
        name: '回归测试',
        start: '2026-11-22',
        end: '2026-11-26',
        progress: 0,
        dependencies: ['backend'],
        assignee: '伊然',
      },
      {
        id: 'launch',
        name: '正式发布',
        start: '2026-11-27',
        end: '2026-11-27',
        milestone: true,
        dependencies: ['qa'],
      },
    ],
  },
]

export const releaseCommands: CommandMenuItem[] = [
  {
    key: 'task:brief',
    label: '版本需求确认',
    description: '负责人：林然',
    group: '定位任务',
    keywords: ['需求'],
  },
  {
    key: 'task:visual',
    label: '视觉稿',
    description: '负责人：艾娃',
    group: '定位任务',
    keywords: ['设计'],
  },
  {
    key: 'task:frontend',
    label: '前端实现',
    description: '负责人：陈默',
    group: '定位任务',
    keywords: ['开发'],
  },
  {
    key: 'task:qa',
    label: '回归测试',
    description: '负责人：伊然',
    group: '定位任务',
    keywords: ['测试'],
  },
]

export const conversations: Conversation[] = [
  {
    id: 1,
    name: '林然',
    company: '云栖科技',
    preview: '新版本的权限配置还需要确认一下',
    unread: 2,
    time: '10:24',
  },
  {
    id: 2,
    name: '米娅',
    company: '南海贸易',
    preview: '设计稿已经同步到评审空间',
    unread: 0,
    time: '09:58',
  },
  {
    id: 3,
    name: '陈默',
    company: '远山物流',
    preview: '接口返回的字段和文档不一致',
    unread: 1,
    time: '09:31',
  },
  {
    id: 4,
    name: '伊然',
    company: '启明教育',
    preview: '回归测试今天下午开始',
    unread: 0,
    time: '昨天',
  },
]

export const conversationCommands: CommandMenuItem[] = conversations.map((conversation) => ({
  key: `conversation:${conversation.id}`,
  label: conversation.name,
  description: conversation.company,
  group: '切换会话',
  keywords: [conversation.company],
}))

export const cannedReplies = [
  '已收到，我们会尽快处理',
  '该问题已记录，稍后同步进度',
  '请提供复现步骤或截图',
]

export const reviewComments: ReviewComment[] = [
  {
    id: 1,
    author: '林然',
    page: 1,
    body: '版本号与发布日期需要和排期保持一致。',
    time: '10 分钟前',
  },
  { id: 2, author: '周叙', page: 2, body: '补充回滚方案与灰度范围。', time: '32 分钟前' },
  { id: 3, author: '米娅', page: 3, body: '附件中的视觉稿已更新到最新版本。', time: '1 小时前' },
  { id: 4, author: '伊然', page: 4, body: '测试用例覆盖登录与权限场景。', time: '2 小时前' },
]

export const lastSyncedAt = new Date('2026-11-20T10:24:00+08:00')
