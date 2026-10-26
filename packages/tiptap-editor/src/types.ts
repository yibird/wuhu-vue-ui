import type { Content, Editor, Extensions, FocusPosition, JSONContent } from '@tiptap/core'
import type { Editor as VueEditor } from '@tiptap/vue-3'
import type { HTMLAttributes, VNodeChild } from 'vue'

/** Number values are treated as pixels. */
export type TiptapEditorSize = number | string

export interface TiptapEditorLabels {
  /** Accessible name of the editable area. */
  editor: string
  /** Accessible name of the toolbar. */
  toolbar: string
  undo: string
  redo: string
  bold: string
  italic: string
  underline: string
  strike: string
  code: string
  heading1: string
  heading2: string
  heading3: string
  bulletList: string
  orderedList: string
  blockquote: string
  codeBlock: string
  link: string
  alignLeft: string
  alignCenter: string
  alignRight: string
  clearFormatting: string
  linkPlaceholder: string
  linkApply: string
  linkCancel: string
  image: string
  imageUpload: string
  imageUploading: string
  imageUrlPlaceholder: string
  imageApply: string
  imageCancel: string
  imageHint: string
  imageInvalidType: string
  /** Supports `{max}` as a placeholder for `imageMaxSize`. */
  imageTooLarge: string
  imageUploadFailed: string
  table: string
  insertTable: string
  addRowBefore: string
  addRowAfter: string
  deleteRow: string
  addColumnBefore: string
  addColumnAfter: string
  deleteColumn: string
  toggleHeaderRow: string
  deleteTable: string
  taskList: string
  highlight: string
  color: string
  horizontalRule: string
  fullscreen: string
  exitFullscreen: string
  characters: string
  words: string
  dropImage: string
}

/**
 * Resolves an uploaded image to a URL (or data URL). The optional signal is
 * aborted when the editor unmounts so uploads can be cancelled.
 */
export type TiptapEditorImageUpload = (file: File, signal?: AbortSignal) => string | Promise<string>

export interface TiptapEditorProps
  extends /* @vue-ignore */ Omit<HTMLAttributes, 'onFocus' | 'onBlur' | 'onChange'> {
  /** HTML content. Use `v-model` for two-way binding. */
  modelValue?: string
  /** Placeholder shown when the document is empty. */
  placeholder?: string
  /** Whether the user can edit the content. */
  editable?: boolean
  /** Disables editing and the toolbar without changing the rendered content. */
  disabled?: boolean
  /** Shows the built-in toolbar. */
  toolbar?: boolean
  /** Minimum height of the editable area. */
  minHeight?: TiptapEditorSize
  /** Maximum height of the editable area before it starts scrolling. */
  maxHeight?: TiptapEditorSize
  /** Accessible name of the editable area. Defaults to `labels.editor`. */
  ariaLabel?: string
  /** Overrides for the built-in toolbar/editor labels. */
  labels?: Partial<TiptapEditorLabels>
  /**
   * Custom image uploader. Without it, images are inserted as Base64 data URLs
   * so the editor still works out of the box.
   */
  imageUpload?: TiptapEditorImageUpload
  /** File picker accept filter for image uploads. */
  imageAccept?: string
  /** Maximum image size in MB. `0` disables the check. */
  imageMaxSize?: number
  /** Shows the character/word counter below the editor. */
  showCount?: boolean
  /** Shows the fullscreen toggle in the toolbar. */
  allowFullscreen?: boolean
  /**
   * Extra Tiptap extensions appended to the built-in set. Applied on creation,
   * so changing the array later does not rebuild the editor.
   */
  extensions?: Extensions
}

/** Focus target accepted by Tiptap's `focus` command. */
export type TiptapEditorFocusPosition = FocusPosition

export interface TiptapEditorExpose {
  /** Underlying Tiptap editor, or `null` before mount. */
  editor: VueEditor | null
  focus: (position?: TiptapEditorFocusPosition) => void
  blur: () => void
  clearContent: (emitUpdate?: boolean) => void
  setContent: (content: Content, emitUpdate?: boolean) => void
  getHTML: () => string
  getJSON: () => JSONContent
}

export interface TiptapEditorSlots {
  /** Replaces the built-in toolbar when editing is enabled. */
  toolbar?: (props: { editor: Editor }) => VNodeChild
}

export interface TiptapEditorEmits {
  'update:modelValue': [html: string]
  change: [html: string]
  ready: [editor: Editor]
  focus: [editor: Editor]
  blur: [editor: Editor]
  'image-upload-start': [file: File]
  'image-upload-success': [url: string, file: File]
  'image-upload-error': [error: Error, file: File]
}
