<script setup lang="ts">
import { Scrollbar } from '@wuhu-vue-ui/scrollbar'

const releases = [
  {
    version: 'v0.0.1',
    note: '首个公开版本',
    status: '已发布',
    time: '今天 10:24',
    tone: 'success',
  },
  {
    version: 'v0.0.1-rc.3',
    note: '修复 Gantt 依赖线',
    status: '已发布',
    time: '昨天 18:02',
    tone: 'success',
  },
  {
    version: 'v0.0.1-rc.2',
    note: '统一设计令牌',
    status: '已发布',
    time: '昨天 11:40',
    tone: 'success',
  },
  {
    version: 'v0.0.1-rc.1',
    note: '新增 ContextMenu',
    status: '已发布',
    time: '11/19 16:15',
    tone: 'success',
  },
  {
    version: 'v0.0.1-beta.4',
    note: '调整滚动条配色',
    status: '进行中',
    time: '11/19 09:30',
    tone: 'warning',
  },
  {
    version: 'v0.0.1-beta.3',
    note: 'FileViewer 工具栏',
    status: '已发布',
    time: '11/18 14:08',
    tone: 'success',
  },
  {
    version: 'v0.0.1-beta.2',
    note: '文档示例重组',
    status: '已发布',
    time: '11/18 10:21',
    tone: 'success',
  },
  {
    version: 'v0.0.1-beta.1',
    note: '搭建 monorepo',
    status: '已发布',
    time: '11/17 20:05',
    tone: 'success',
  },
]
</script>

<template>
  <Scrollbar height="220px" class="demo-scrollbar">
    <div class="release-list">
      <div v-for="release in releases" :key="release.version" class="release-list__row">
        <span class="release-list__version">{{ release.version }}</span>
        <span class="release-list__meta">{{ release.note }}</span>
        <span class="release-list__status" :class="`is-${release.tone}`">{{ release.status }}</span>
        <span class="release-list__time">{{ release.time }}</span>
      </div>
    </div>
  </Scrollbar>
</template>
