import type { editor, IDisposable } from 'monaco-editor'

/** The underlying Monaco standalone editor instance. */
export type CodeEditorInstance = editor.IStandaloneCodeEditor

/** The Monaco text model created and owned by the component. */
export type CodeEditorModel = editor.ITextModel

/** A disposable returned by Monaco event subscriptions. */
export type CodeEditorDisposable = IDisposable

export interface CodeEditorProps {
  /** Editor content, used with `v-model`. */
  modelValue?: string
  /** Monaco language identifier, e.g. `typescript` or `json`. */
  language?: string
  /**
   * Monaco theme identifier, e.g. `vs` or `vs-dark`, or `auto` to follow the
   * app's `data-w-theme` attribute / `prefers-color-scheme`.
   * Monaco themes are global: changing this value affects every editor instance.
   */
  theme?: string
  /** Make the editor read-only. */
  readOnly?: boolean
  /** Disable the editor. Implies `readOnly`. */
  disabled?: boolean
  /** Container height. Numbers are treated as pixels. */
  height?: string | number
  /** Container width. Numbers are treated as pixels. */
  width?: string | number
  /** Options forwarded to `monaco.editor.create`. */
  options?: Omit<
    editor.IStandaloneEditorConstructionOptions,
    'model' | 'theme' | 'readOnly' | 'automaticLayout'
  >
  /** Let Monaco re-layout when the container resizes. */
  automaticLayout?: boolean
  /** Text shown while Monaco is loading. */
  loadingText?: string
}

export interface CodeEditorErrorSlotProps {
  error: Error
  retry: () => void
}

export interface CodeEditorExpose {
  /** The underlying editor instance (Vue unwraps the internal ref on expose). */
  editor: CodeEditorInstance | null
  getEditor: () => CodeEditorInstance | null
  focus: () => void
  layout: () => void
  getValue: () => string
  setValue: (value: string) => void
  setLanguage: (language: string) => void
  setTheme: (theme: string) => void
}
