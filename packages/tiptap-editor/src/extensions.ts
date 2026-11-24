import { Extension, Mark, Node, mergeAttributes, type Extensions } from '@tiptap/core'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
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
    fontSize: {
      /** Applies a CSS `font-size` to the current selection. */
      setFontSize: (fontSize: string) => ReturnType
      /** Removes the font size while keeping other text styles. */
      unsetFontSize: () => ReturnType
    }
    subscript: {
      /** Toggles the `<sub>` mark. */
      toggleSubscript: () => ReturnType
    }
    superscript: {
      /** Toggles the `<sup>` mark. */
      toggleSuperscript: () => ReturnType
    }
    indent: {
      /** Adds one indent level to the current block. */
      increaseIndent: () => ReturnType
      /** Removes one indent level from the current block. */
      decreaseIndent: () => ReturnType
    }
    video: {
      /** Inserts a `<video controls>` block. */
      setVideo: (src: string) => ReturnType
    }
    attachment: {
      /** Inserts a downloadable attachment link block. */
      setAttachment: (attributes: { href: string; name?: string }) => ReturnType
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
 * Adds `fontSize` to the `textStyle` mark, mirroring the inline `FontFamily`
 * extension so the editor does not need a separate dependency.
 */
const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              const fontSize = attributes.fontSize
              if (typeof fontSize !== 'string' || !fontSize) return {}
              return { style: `font-size: ${fontSize}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

const Subscript = Mark.create({
  name: 'subscript',
  excludes: 'superscript',

  parseHTML() {
    return [{ tag: 'sub' }]
  },

  renderHTML() {
    return ['sub', 0]
  },

  addKeyboardShortcuts() {
    return {
      'Mod-,': () => this.editor.commands.toggleSubscript(),
    }
  },

  addCommands() {
    return {
      toggleSubscript:
        () =>
        ({ commands }) =>
          commands.toggleMark('subscript'),
    }
  },
})

const Superscript = Mark.create({
  name: 'superscript',
  excludes: 'subscript',

  parseHTML() {
    return [{ tag: 'sup' }]
  },

  renderHTML() {
    return ['sup', 0]
  },

  addKeyboardShortcuts() {
    return {
      'Mod-.': () => this.editor.commands.toggleSuperscript(),
    }
  },

  addCommands() {
    return {
      toggleSuperscript:
        () =>
        ({ commands }) =>
          commands.toggleMark('superscript'),
    }
  },
})

/**
 * Block-level indentation stored as an integer level and rendered as a
 * `margin-left` so the value survives HTML round-trips.
 */
const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      maxIndent: 6,
      stepEm: 1.5,
    }
  },

  addGlobalAttributes() {
    const { types, stepEm } = this.options

    return [
      {
        types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const margin = element.style.marginLeft
              const value = Number.parseFloat(margin)
              if (!Number.isFinite(value) || !margin.endsWith('em')) return 0
              return Math.max(0, Math.round(value / stepEm))
            },
            renderHTML: (attributes) => {
              const level = Number(attributes.indent)
              if (!Number.isFinite(level) || level <= 0) return {}
              return { style: `margin-left: ${level * stepEm}em` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    const { maxIndent } = this.options

    return {
      increaseIndent:
        () =>
        ({ editor, commands }) => {
          const type = editor.isActive('heading') ? 'heading' : 'paragraph'
          const level = Number(editor.getAttributes(type).indent ?? 0)
          if (level >= maxIndent) return false
          return commands.updateAttributes(type, { indent: level + 1 })
        },
      decreaseIndent:
        () =>
        ({ editor, commands }) => {
          const type = editor.isActive('heading') ? 'heading' : 'paragraph'
          const level = Number(editor.getAttributes(type).indent ?? 0)
          if (level <= 0) return false
          return commands.updateAttributes(type, { indent: level - 1 })
        },
    }
  },
})

const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'video[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        controls: '',
        class: 'w-tiptap-editor__video',
      }),
    ]
  },

  addCommands() {
    return {
      setVideo:
        (src) =>
        ({ commands }) =>
          commands.insertContent({ type: 'video', attrs: { src } }),
    }
  },
})

const Attachment = Node.create({
  name: 'attachment',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      href: { default: null },
      name: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-attachment]',
        getAttrs: (element) => ({
          href: element.getAttribute('href'),
          name: element.textContent,
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { name, ...attributes } = HTMLAttributes
    const label =
      typeof name === 'string' && name.trim()
        ? name
        : String(attributes.href ?? '')
            .split('/')
            .pop() || '附件'

    return [
      'a',
      mergeAttributes(attributes, {
        'data-attachment': '',
        class: 'w-tiptap-editor__attachment',
        target: '_blank',
        rel: 'noopener noreferrer',
        download: label,
      }),
      label,
    ]
  },

  addCommands() {
    return {
      setAttachment:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent({ type: 'attachment', attrs: attributes }),
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
    FontSize,
    Subscript,
    Superscript,
    Indent,
    Highlight.configure({ multicolor: false }),
    Image.configure({
      allowBase64: true,
      HTMLAttributes: { class: 'w-tiptap-editor__image' },
    }),
    Video,
    Attachment,
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder, includeChildren: false }),
    ...extra,
  ]
}
