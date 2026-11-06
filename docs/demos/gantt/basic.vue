<script setup lang="ts">
import { Gantt } from '@wuhu-vue-ui/gantt'
import type { GanttTask } from '@wuhu-vue-ui/gantt'

const tasks: GanttTask[] = [
  {
    id: 'design',
    name: '需求设计',
    start: '2026-11-02',
    end: '2026-11-06',
    progress: 100,
  },
  {
    id: 'develop',
    name: '功能开发',
    start: '2026-11-05',
    end: '2026-11-14',
    progress: 45,
    dependencies: ['design'],
  },
  {
    id: 'test',
    name: '测试验收',
    start: '2026-11-16',
    end: '2026-11-20',
    dependencies: ['develop'],
  },
  {
    id: 'release',
    name: '正式发布',
    start: '2026-11-21',
    end: '2026-11-21',
    milestone: true,
    dependencies: ['test'],
  },
]
</script>

<template>
  <Gantt :tasks="tasks" height="360px" />
</template>
