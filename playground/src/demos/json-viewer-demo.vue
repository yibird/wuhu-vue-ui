<script setup lang="ts">
import { ref } from 'vue'
import { JsonViewer } from '@wuhu-vue-ui/json-viewer'
import './monaco-env'
import DemoCard from '../components/demo-card.vue'

const value = ref({
  id: 'wuhu-001',
  name: 'Wuhu Vue UI',
  version: '0.1.0',
  features: ['scrollbar', 'command-menu', 'gantt', 'json-viewer'],
  meta: {
    stars: 1286,
    active: true,
    tags: ['vue3', 'typescript', 'monorepo'],
  },
})

const theme = ref('vs')
const indent = ref(2)
const jsonString = '{"service":"gateway","healthy":true}'

function toggleTheme(): void {
  theme.value = theme.value === 'vs' ? 'vs-dark' : 'vs'
}

function refresh(): void {
  value.value = {
    ...value.value,
    meta: {
      ...value.value.meta,
      stars: Math.round(1000 + Math.random() * 500),
    },
  }
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="只读 JSON 查看器"
      description="自动格式化对象与 JSON 字符串，固定只读，可切换主题与缩进。"
      wide
    >
      <div class="json-viewer-demo__toolbar">
        <button type="button" class="button button--ghost button--small" @click="toggleTheme">
          主题：{{ theme }}
        </button>
        <button
          type="button"
          class="button button--ghost button--small"
          @click="indent = indent === 2 ? 4 : 2"
        >
          缩进：{{ indent }}
        </button>
        <button type="button" class="button button--primary button--small" @click="refresh">
          刷新数据
        </button>
      </div>

      <JsonViewer
        :value="value"
        :theme="theme"
        :indent="indent"
        height="360px"
        :options="{ lineNumbers: 'off', wordWrap: 'on' }"
      />
    </DemoCard>

    <DemoCard title="JSON 字符串" description="字符串会先解析再格式化；无效 JSON 原样展示。">
      <JsonViewer :value="jsonString" height="220px" />
    </DemoCard>
  </div>
</template>

<style scoped>
.json-viewer-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
