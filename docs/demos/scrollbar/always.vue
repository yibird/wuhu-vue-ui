<script setup lang="ts">
import { Scrollbar } from '@wuhu-vue-ui/scrollbar'

const environments = [
  {
    version: '生产环境',
    note: 'api.example.com',
    status: '已同步',
    time: '2 分钟前',
    tone: 'success',
  },
  {
    version: '预发环境',
    note: 'staging.example.com',
    status: '已同步',
    time: '8 分钟前',
    tone: 'success',
  },
  {
    version: '测试环境',
    note: 'test.example.com',
    status: '同步中',
    time: '刚刚',
    tone: 'warning',
  },
  {
    version: '灰度环境',
    note: 'canary.example.com',
    status: '已同步',
    time: '12 分钟前',
    tone: 'success',
  },
  {
    version: '演示环境',
    note: 'demo.example.com',
    status: '已同步',
    time: '26 分钟前',
    tone: 'success',
  },
  {
    version: '本地环境',
    note: 'localhost:9191',
    status: '已同步',
    time: '1 小时前',
    tone: 'success',
  },
]
</script>

<template>
  <Scrollbar height="180px" always class="demo-scrollbar">
    <div class="release-list">
      <div v-for="environment in environments" :key="environment.version" class="release-list__row">
        <span class="release-list__version">{{ environment.version }}</span>
        <span class="release-list__meta">{{ environment.note }}</span>
        <span class="release-list__status" :class="`is-${environment.tone}`">
          {{ environment.status }}
        </span>
        <span class="release-list__time">{{ environment.time }}</span>
      </div>
    </div>
  </Scrollbar>
</template>
