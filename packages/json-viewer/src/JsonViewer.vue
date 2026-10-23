<script setup lang="ts">
import { computed, ref } from 'vue'
import { CodeEditor } from '@wuhu-vue-ui/code-editor'
import type {
  CodeEditorExpose,
  CodeEditorInstance,
  CodeEditorProps,
} from '@wuhu-vue-ui/code-editor'
import { formatJsonValue } from './json'
import type { JsonViewerErrorSlotProps, JsonViewerProps } from './types'

defineOptions({
  name: 'WJsonViewer',
})

const props = withDefaults(defineProps<JsonViewerProps>(), {
  height: '320px',
  width: '100%',
  theme: 'vs',
  indent: 2,
  options: () => ({}),
  loadingText: 'JSON 加载中…',
})

const emit = defineEmits<{
  ready: [editor: CodeEditorInstance]
  error: [error: Error]
}>()

defineSlots<{
  loading?: () => unknown
  error?: (props: JsonViewerErrorSlotProps) => unknown
}>()

const viewerRef = ref<CodeEditorExpose | null>(null)

const formatted = computed(() => formatJsonValue(props.value, props.indent))

const viewerOptions = computed<CodeEditorProps['options']>(() => ({
  minimap: { enabled: false },
  lineNumbers: 'on' as const,
  folding: true,
  scrollBeyondLastLine: false,
  renderLineHighlight: 'none',
  wordWrap: 'off' as const,
  ...props.options,
  // A viewer must stay read-only even if the caller passes Monaco options.
  readOnly: true,
  domReadOnly: true,
}))

function handleReady(editor: CodeEditorInstance) {
  emit('ready', editor)
}

function handleError(error: Error) {
  emit('error', error)
}

function getEditor(): CodeEditorInstance | null {
  return viewerRef.value?.getEditor() ?? null
}

function focus() {
  viewerRef.value?.focus()
}

function layout() {
  viewerRef.value?.layout()
}

function getValue() {
  const editor = viewerRef.value?.getEditor()
  return editor ? (viewerRef.value?.getValue() ?? formatted.value) : formatted.value
}

function getFormattedValue() {
  return formatted.value
}

defineExpose({
  getEditor,
  focus,
  layout,
  getValue,
  getFormattedValue,
})
</script>

<template>
  <CodeEditor
    ref="viewerRef"
    class="w-json-viewer"
    :model-value="formatted"
    language="json"
    :theme="theme"
    :height="height"
    :width="width"
    :options="viewerOptions"
    read-only
    :loading-text="loadingText"
    @ready="handleReady"
    @error="handleError"
  >
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
    <template v-if="$slots.error" #error="scope">
      <slot name="error" v-bind="scope" />
    </template>
  </CodeEditor>
</template>
