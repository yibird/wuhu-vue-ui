<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { editor as MonacoEditor, IDisposable } from 'monaco-editor'
import type {
  CodeEditorErrorSlotProps,
  CodeEditorExpose,
  CodeEditorLabels,
  CodeEditorModel,
  CodeEditorProps,
} from './types'

const props = withDefaults(defineProps<CodeEditorProps>(), {
  modelValue: '',
  language: 'plaintext',
  theme: 'vs',
  readOnly: false,
  disabled: false,
  height: '320px',
  width: '100%',
  options: () => ({}),
  automaticLayout: true,
  loadingText: '编辑器加载中…',
  labels: () => ({}),
})

const labels = computed<CodeEditorLabels>(() => ({
  loading: props.loadingText,
  error: '编辑器加载失败',
  retry: '重试',
  ...props.labels,
}))

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  ready: [editor: MonacoEditor.IStandaloneCodeEditor]
  error: [error: Error]
  focus: []
  blur: []
}>()

defineSlots<{
  loading?: () => unknown
  error?: (props: CodeEditorErrorSlotProps) => unknown
}>()

type MonacoApi = typeof import('monaco-editor')

const containerRef = ref<HTMLElement>()
const editor = shallowRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
const model = shallowRef<CodeEditorModel | null>(null)
const loading = ref(true)
const loadError = shallowRef<Error | null>(null)

let monacoApi: MonacoApi | null = null
let disposables: IDisposable[] = []
let createdModel = false
let syncingFromProps = false
let destroyed = false
let loadToken = 0

const readOnlyState = computed(() => props.readOnly || props.disabled)

const rootClasses = computed(() => ({
  'is-loading': loading.value,
  'is-error': loadError.value !== null,
  'is-ready': editor.value !== null,
  'is-disabled': props.disabled,
}))

const rootStyle = computed(() => ({
  width: toCssSize(props.width),
  height: toCssSize(props.height),
}))

const errorMessage = computed(() => loadError.value?.message || labels.value.error)

let themeOverride: string | null = null

function toCssSize(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}

/**
 * Resolve the `auto` theme from the app's explicit `data-w-theme` attribute or,
 * when it is absent, from the OS colour scheme. Any other value is a Monaco
 * theme identifier and is forwarded unchanged.
 */
function resolveTheme(theme: string): string {
  if (theme !== 'auto') return theme

  if (typeof document !== 'undefined') {
    const explicit = document.documentElement.getAttribute('data-w-theme')
    if (explicit === 'dark') return 'vs-dark'
    if (explicit === 'light') return 'vs'
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs'
  }

  return 'vs'
}

function resolvedTheme(): string {
  return themeOverride ?? resolveTheme(props.theme)
}

function applyTheme() {
  monacoApi?.editor.setTheme(resolvedTheme())
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause))
}

function createEditor(api: MonacoApi) {
  const container = containerRef.value
  if (!container) throw new Error('Code editor container is not available.')

  const textModel = api.editor.createModel(props.modelValue ?? '', props.language)
  model.value = textModel
  createdModel = true

  let instance: MonacoEditor.IStandaloneCodeEditor
  try {
    instance = api.editor.create(container, {
      ...props.options,
      model: textModel,
      theme: resolvedTheme(),
      readOnly: readOnlyState.value,
      automaticLayout: props.automaticLayout,
    })
  } catch (cause) {
    textModel.dispose()
    model.value = null
    createdModel = false
    throw cause
  }

  editor.value = instance
  appliedOptions = { ...props.options, readOnly: readOnlyState.value }

  disposables = [
    instance.onDidChangeModelContent(handleContentChange),
    instance.onDidFocusEditorText(() => emit('focus')),
    instance.onDidBlurEditorText(() => emit('blur')),
  ]

  emit('ready', instance)
}

async function load(): Promise<void> {
  if (destroyed || editor.value) return

  const token = ++loadToken
  loading.value = true
  loadError.value = null

  // Monaco needs DOM APIs and must not be imported during SSR.
  if (typeof window === 'undefined') {
    loading.value = false
    return
  }

  try {
    const imported = await import('monaco-editor')
    if (destroyed || token !== loadToken) return

    const candidate = imported as unknown as MonacoApi & { default?: MonacoApi }
    // Prefer the ESM namespace; fall back to the CJS interop default. Reading
    // `.default` unconditionally throws on strict ESM mock namespaces.
    monacoApi = candidate.editor ? candidate : (candidate.default as MonacoApi)

    // Wait for the container to be in the DOM before Monaco measures it.
    await nextTick()
    if (destroyed || token !== loadToken) return

    createEditor(monacoApi)
    loading.value = false
  } catch (cause) {
    if (destroyed || token !== loadToken) return

    disposeInstance()
    loadError.value = toError(cause)
    loading.value = false
    emit('error', loadError.value)
  }
}

function handleContentChange() {
  if (syncingFromProps) return
  const value = editor.value?.getValue() ?? ''
  emit('update:modelValue', value)
  emit('change', value)
}

function disposeInstance() {
  for (const disposable of disposables) disposable.dispose()
  disposables = []

  editor.value?.dispose()
  editor.value = null

  if (createdModel) model.value?.dispose()
  model.value = null
  createdModel = false
}

function retry() {
  loadError.value = null
  void load()
}

function getEditor(): MonacoEditor.IStandaloneCodeEditor | null {
  return editor.value
}

function focus() {
  editor.value?.focus()
}

function layout() {
  editor.value?.layout()
}

function getValue(): string {
  return editor.value?.getValue() ?? props.modelValue ?? ''
}

function setValue(value: string) {
  const instance = editor.value
  if (!instance || instance.getValue() === value) return
  instance.setValue(value)
}

function setLanguage(language: string) {
  if (!monacoApi || !model.value) return
  monacoApi.editor.setModelLanguage(model.value, language)
}

function setTheme(theme: string) {
  // Explicit overrides survive `theme="auto"` watcher updates until the
  // `theme` prop itself changes.
  themeOverride = theme
  applyTheme()
}

watch(
  () => props.modelValue,
  (value) => {
    const instance = editor.value
    if (!instance) return

    const next = value ?? ''
    if (instance.getValue() === next) return

    syncingFromProps = true
    try {
      instance.setValue(next)
    } finally {
      syncingFromProps = false
    }
  },
)

watch(
  () => props.language,
  (language) => setLanguage(language),
)

watch(
  () => props.theme,
  () => {
    themeOverride = null
    applyTheme()
  },
)

let appliedOptions: Record<string, unknown> = {}

/** Sends only the option keys that actually changed to Monaco. */
function syncOptions() {
  const instance = editor.value
  if (!instance) return

  const next = { ...props.options, readOnly: readOnlyState.value } as Record<string, unknown>
  const changed: Record<string, unknown> = {}
  for (const key in next) {
    if (next[key] !== appliedOptions[key]) changed[key] = next[key]
  }
  for (const key in appliedOptions) {
    if (!(key in next)) changed[key] = undefined
  }
  appliedOptions = next
  if (!Object.keys(changed).length) return

  type UpdateOptions = Parameters<MonacoEditor.IStandaloneCodeEditor['updateOptions']>[0]
  instance.updateOptions(changed as unknown as UpdateOptions)
}

watch(readOnlyState, syncOptions)
watch(() => props.options, syncOptions, { deep: true })

watch(
  () => props.automaticLayout,
  (automaticLayout) => {
    editor.value?.updateOptions({ automaticLayout })
  },
)

onMounted(() => {
  void load()
})

onBeforeUnmount(() => {
  destroyed = true
  loadToken += 1
  disposeInstance()
  monacoApi = null
})

defineExpose<CodeEditorExpose>({
  get editor() {
    return editor.value
  },
  getEditor,
  focus,
  layout,
  getValue,
  setValue,
  setLanguage,
  setTheme,
})
</script>

<template>
  <div
    class="w-code-editor"
    :class="rootClasses"
    :style="rootStyle"
    :aria-busy="loading ? 'true' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <div ref="containerRef" class="w-code-editor__container" />

    <div v-if="loading" class="w-code-editor__loading" role="status" aria-live="polite">
      <slot name="loading">
        <span class="w-code-editor__spinner" aria-hidden="true" />
        <span>{{ labels.loading }}</span>
      </slot>
    </div>

    <div v-else-if="loadError" class="w-code-editor__error" role="alert">
      <slot name="error" :error="loadError" :retry="retry">
        <span class="w-code-editor__error-text">{{ errorMessage }}</span>
        <button type="button" class="w-code-editor__retry" @click="retry">
          {{ labels.retry }}
        </button>
      </slot>
    </div>
  </div>
</template>
