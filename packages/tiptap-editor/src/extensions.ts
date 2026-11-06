import { Extension, type Extensions } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontFamily: {
      /** Applies a CSS `font-family` to the current selection. */
      setFontFamily: (fontFamily: string) => ReturnType
      /** Removes the font family while keeping other text styles. */
      unsetFontFamily: () => ReturnType
    }
  }
}

/**
 * Adds `fontFamily` to the `textStyle` mark. Tiptap ships this as a separate
 * package; the implementation is small enough to keep inside the component so
 * the package has one less runtime dependency.
 */
const FontFamily = Extension.create({
  name: 'fontFamily',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily || null,
            renderHTML: (attributes) => {
              const fontFamily = attributes.fontFamily
              if (typeof fontFamily !== 'string' || !fontFamily) return {}
              return { style: `font-family: ${fontFamily}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontFamily }).run(),
      unsetFontFamily:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run(),
    }
  },
})

/**
 * Builds the default editing experience: headings 1-3, rich inline marks,
 * lists (including task lists), quotes, code blocks, tables, images,
 * horizontal rules, links, text colour/highlight/font family, undo/redo,
 * alignment and placeholder text.
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
    FontFamily,
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
