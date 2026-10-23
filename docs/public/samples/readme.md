# Wuhu File Viewer

A **themeable**, **internationalized** file preview component for Vue 3.
Every renderer is loaded on demand, so opening an image never downloads the
Office, PDF or EPUB code.

![Preview banner](/samples/banner.png)

## Highlights

- 40+ formats across Office, PDF, media, code, archives and e-books
- Light, dark and fully custom themes via CSS variables
- English and Simplified Chinese built in (English by default)
- Accessible toolbar, keyboard shortcuts, slots and a public API
- Zero runtime dependencies — `vue` is the only peer

> The preview above is rendered from this Markdown file by the lazy-loaded
> Markdown chunk.

## Supported families

| Family        | Formats                                        |
| ------------- | ---------------------------------------------- |
| Word          | docx, docm, odt, rtf                           |
| Spreadsheets  | xlsx, xlsm, ods, csv, tsv                      |
| Presentations | pptx, pptm, odp                                |
| Documents     | pdf, epub, markdown, text, code                |
| Media         | png, jpg, webp, avif, svg, mp4, webm, mp3, wav |
| Archives      | zip, tar, gz, tgz                              |

## Quick start

```ts
import { FileViewer } from '@wuhu-vue-ui/file-viewer'

const props = {
  src: '/reports/quarterly.pdf',
  locale: 'en',
  theme: 'auto',
}
```

```vue
<template>
  <FileViewer
    src="/reports/quarterly.pdf"
    theme="auto"
    locale="en"
    height="620px"
    @ready="onReady"
  />
</template>
```

### Task list

- [x] Lazy renderer chunks
- [x] Theming tokens
- [x] Localization catalogs
- [ ] Add more legacy formats

---

Mixing **bold**, _italic_, `inline code`, ~~deleted text~~ and
[links](https://example.com) is supported. Relative links resolve against the
`options.markdown.baseUrl` value.
