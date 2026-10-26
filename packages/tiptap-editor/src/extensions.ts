import type { Extensions } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'

/**
 * Builds the default editing experience: headings 1-3, rich inline marks,
 * lists (including task lists), quotes, code blocks, tables, images,
 * horizontal rules, links, text colour/highlight, undo/redo, alignment and
 * placeholder text.
 */
export function createTiptapExtensions(
  placeholder: () => string,
  extra: Extensions = [],
): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: true },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: false }),
    Image.configure({
      allowBase64: true,
      HTMLAttributes: { class: 'w-tiptap-editor__image' },
    }),
    TableKit.configure({ table: { resizable: false } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder, includeChildren: false }),
    ...extra,
  ]
}
