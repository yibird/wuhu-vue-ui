<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { Button } from 'antdv-next'
import { JsonViewer } from '@wuhu-vue-ui/json-viewer'
import '../../../playground/src/demos/monaco-env'

const { isDark } = useData()
const theme = computed(() => (isDark.value ? 'vs-dark' : 'vs'))

const value = ref(
  JSON.stringify({
    service: 'gateway',
    status: 'healthy',
    metrics: {
      requests: 12860,
      errors: 12,
      latencyMs: 23.8,
    },
    instances: ['10.0.0.12', '10.0.0.18'],
  }),
)

function refresh() {
  value.value = JSON.stringify({
    service: 'gateway',
    status: 'healthy',
    metrics: {
      requests: Math.round(10000 + Math.random() * 5000),
      errors: Math.round(Math.random() * 20),
      latencyMs: Math.round((12 + Math.random() * 20) * 10) / 10,
    },
    instances: ['10.0.0.12', '10.0.0.18'],
    updatedAt: new Date().toISOString(),
  })
}
</script>

<template>
  <JsonViewer
    :value="value"
    :theme="theme"
    :indent="4"
    height="360px"
    :options="{ wordWrap: 'on', lineNumbers: 'off' }"
  />
  <div class="demo-actions">
    <Button @click="refresh">刷新数据</Button>
  </div>
</template>
