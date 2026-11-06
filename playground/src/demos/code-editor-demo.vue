<script setup lang="ts">
import { ref } from 'vue'
import { CodeEditor } from '@wuhu-vue-ui/code-editor'
import type { CodeEditorExpose, CodeEditorInstance } from '@wuhu-vue-ui/code-editor'
import './monaco-env'
import DemoCard from '../components/demo-card.vue'

const sample = [
  "import { computed, ref } from 'vue'",
  '',
  'export interface Todo {',
  '  id: number',
  '  title: string',
  '  done: boolean',
  '}',
  '',
  'export function useTodos(initial: Todo[] = []) {',
  '  const todos = ref<Todo[]>(initial)',
  '  const remaining = computed(() => todos.value.filter((todo) => !todo.done).length)',
  '',
  '  function toggle(id: number){',
  '    const todo = todos.value.find((item) => item.id === id)',
  '    if (todo) todo.done = !todo.done',
  '  }',
  '',
  '  return { todos, remaining, toggle }',
  '}',
].join('\n')

const editorRef = ref<CodeEditorExpose | null>(null)
const value = ref(sample)
const language = ref('typescript')
const theme = ref('vs')
const readOnly = ref(false)
const eventLog = ref('等待编辑器加载…')

const languageOptions = ['typescript', 'javascript', 'json', 'markdown', 'html', 'css', 'python']

function handleReady(editor: CodeEditorInstance) {
  const model = editor.getModel()
  eventLog.value = `ready · ${model?.getLanguageId() ?? language.value}`
}

function handleChange(next: string) {
  eventLog.value = `change · ${next.split('\n').length} 行 · ${next.length} 字符`
}

function handleFocus() {
  eventLog.value = 'focus · 编辑器获得焦点'
}

function handleBlur() {
  eventLog.value = 'blur · 编辑器失去焦点'
}

function handleError(error: Error) {
  eventLog.value = `error · ${error.message}`
}

function toggleTheme() {
  theme.value = theme.value === 'vs' ? 'vs-dark' : 'vs'
}

function focusEditor() {
  editorRef.value?.focus()
}

function replaceSample() {
  language.value = 'typescript'
  editorRef.value?.setValue(sample)
  eventLog.value = 'setValue · 已恢复示例代码'
}

function logValue() {
  eventLog.value = `getValue · ${editorRef.value?.getValue().length ?? 0} 字符`
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="TypeScript 编辑器"
      description="双向绑定内容，实时切换语言与主题；通过实例方法控制聚焦、取值和重置。"
      wide
    >
      <div
        style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 12px"
      >
        <label class="hint">
          语言
          <select v-model="language" class="field" style="width: auto; height: 32px">
            <option v-for="item in languageOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <button type="button" class="button button--ghost button--small" @click="toggleTheme">
          主题：{{ theme }}
        </button>

        <label class="hint" style="display: inline-flex; align-items: center; gap: 6px">
          <input v-model="readOnly" type="checkbox" />
          只读
        </label>

        <button type="button" class="button button--ghost button--small" @click="focusEditor">
          聚焦
        </button>
        <button type="button" class="button button--ghost button--small" @click="logValue">
          读取内容
        </button>
        <button type="button" class="button button--primary button--small" @click="replaceSample">
          重置示例
        </button>
      </div>

      <CodeEditor
        ref="editorRef"
        v-model="value"
        :language="language"
        :theme="theme"
        :read-only="readOnly"
        :height="420"
        @ready="handleReady"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @error="handleError"
      />

      <p class="hint" style="margin: 10px 0 0">{{ eventLog }}</p>
    </DemoCard>

    <DemoCard
      title="只读与固定尺寸"
      description="readOnly 关闭编辑能力，height 使用数字时会转换为像素。"
    >
      <CodeEditor
        :model-value="sample"
        language="typescript"
        theme="vs-dark"
        read-only
        :height="260"
        :width="'100%'"
        loading-text="正在加载 Monaco…"
      />
    </DemoCard>
  </div>
</template>
