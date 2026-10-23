<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { JsonViewer } from '@wuhu-vue-ui/json-viewer'
import '../../../playground/src/demos/monaco-env'

const { isDark } = useData()
const theme = computed(() => (isDark.value ? 'vs-dark' : 'vs'))

const value = {
  id: 'wuhu-001',
  name: 'Wuhu Vue UI',
  version: '0.1.0',
  features: ['scrollbar', 'command-menu', 'gantt', 'code-editor'],
  author: {
    name: 'Wuhu',
    homepage: 'https://github.com/wuhu-ui',
  },
  active: true,
  stars: 1286,
}
</script>

<template>
  <JsonViewer :value="value" :theme="theme" height="320px" />
</template>
