<script setup lang="ts">
import { ref } from 'vue'
import { TiptapEditor } from '@wuhu-vue-ui/tiptap-editor'

const content = ref(
  '<h1>实时预览</h1><p>在左侧编辑，右侧会同步渲染 HTML 结果。</p><ul><li>支持标题、列表、表格等全部格式</li><li>预览区域只读，不会抢走编辑焦点</li></ul>',
)
</script>

<template>
  <TiptapEditor v-model:value="content" :preview="true" :min-height="220" :max-height="360" />
</template>
