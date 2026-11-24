import { createLibraryConfig } from '../../scripts/vite.library'

export default createLibraryConfig(import.meta.dirname, {
  // `BubbleMenu` lives behind the `@tiptap/vue-3/menus` subpath, which must
  // stay external alongside the package root.
  external: [/^@tiptap\/vue-3\//],
})
