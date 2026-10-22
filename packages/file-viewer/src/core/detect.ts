import type { FileViewerKind, FileViewerMeta } from '../types'
import { baseNameOf, extensionOf } from './format'

interface FormatDefinition {
  kind: FileViewerKind
  label: string
  extensions: string[]
  mimes?: string[]
}

const FORMATS: FormatDefinition[] = [
  {
    kind: 'image',
    label: 'Image',
    extensions: [
      'png',
      'jpg',
      'jpeg',
      'jfif',
      'pjpeg',
      'gif',
      'webp',
      'avif',
      'bmp',
      'ico',
      'svg',
      'apng',
    ],
    mimes: [
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/avif',
      'image/bmp',
      'image/x-icon',
      'image/vnd.microsoft.icon',
      'image/svg+xml',
      'image/apng',
    ],
  },
  {
    kind: 'video',
    label: 'Video',
    // Only formats browsers can generally decode through a native <video>.
    extensions: ['mp4', 'm4v', 'webm', 'ogv', 'mov', '3gp'],
    mimes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/3gpp'],
  },
  {
    kind: 'audio',
    label: 'Audio',
    // Only formats browsers can generally decode through a native <audio>.
    extensions: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'weba'],
    mimes: [
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
      'audio/flac',
      'audio/opus',
      'audio/webm',
    ],
  },
  {
    kind: 'pdf',
    label: 'PDF',
    extensions: ['pdf'],
    mimes: ['application/pdf', 'application/x-pdf'],
  },
  {
    kind: 'document',
    label: 'Word',
    extensions: ['docx', 'docm', 'dotx', 'dotm', 'odt'],
    mimes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-word.document.macroenabled.12',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
      'application/vnd.ms-word.template.macroenabled.12',
      'application/vnd.oasis.opendocument.text',
    ],
  },
  {
    kind: 'spreadsheet',
    label: 'Excel',
    extensions: ['xlsx', 'xlsm', 'xltx', 'xltm', 'ods'],
    mimes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroenabled.12',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
      'application/vnd.ms-excel.template.macroenabled.12',
      'application/vnd.oasis.opendocument.spreadsheet',
    ],
  },
  {
    kind: 'presentation',
    label: 'PowerPoint',
    extensions: ['pptx', 'pptm', 'ppsx', 'ppsm', 'potx', 'potm', 'odp'],
    mimes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint.presentation.macroenabled.12',
      'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
      'application/vnd.ms-powerpoint.slideshow.macroenabled.12',
      'application/vnd.openxmlformats-officedocument.presentationml.template',
      'application/vnd.ms-powerpoint.template.macroenabled.12',
      'application/vnd.oasis.opendocument.presentation',
    ],
  },
  {
    kind: 'document',
    label: 'Rich Text',
    extensions: ['rtf'],
    mimes: ['application/rtf', 'text/rtf'],
  },
  {
    kind: 'markdown',
    label: 'Markdown',
    extensions: ['md', 'markdown', 'mdx', 'mkd', 'mkdn', 'mdown'],
    mimes: ['text/markdown', 'text/x-markdown'],
  },
  {
    kind: 'json',
    label: 'JSON',
    extensions: [
      'json',
      'jsonc',
      'json5',
      'geojson',
      'topojson',
      'har',
      'webmanifest',
      'ipynb',
      'map',
    ],
    mimes: ['application/json', 'text/json', 'application/manifest+json', 'application/geo+json'],
  },
  {
    kind: 'xml',
    label: 'XML',
    extensions: [
      'xml',
      'xsl',
      'xslt',
      'xsd',
      'rss',
      'atom',
      'plist',
      'fb2',
      'csproj',
      'vbproj',
      'fsproj',
      'props',
      'targets',
      'resx',
      'storyboard',
      'xib',
      'config',
    ],
    mimes: ['application/xml', 'text/xml'],
  },
  {
    kind: 'html',
    label: 'HTML',
    extensions: ['html', 'htm', 'xhtml'],
    mimes: ['text/html', 'application/xhtml+xml'],
  },
  {
    kind: 'csv',
    label: 'CSV',
    extensions: ['csv', 'tsv'],
    mimes: ['text/csv', 'text/tab-separated-values'],
  },
  {
    kind: 'subtitle',
    label: 'Subtitles',
    extensions: ['srt', 'vtt', 'ass', 'ssa', 'lrc'],
    mimes: ['text/vtt', 'application/x-subrip'],
  },
  {
    kind: 'archive',
    label: 'Archive',
    extensions: ['zip', 'jar', 'war', 'ear', 'apk', 'xpi', 'crx', 'tar', 'gz', 'tgz'],
    mimes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/java-archive',
      'application/x-tar',
      'application/gzip',
      'application/x-gzip',
      'application/vnd.android.package-archive',
    ],
  },
  {
    kind: 'epub',
    label: 'EPUB',
    extensions: ['epub'],
    mimes: ['application/epub+zip'],
  },
  {
    kind: 'font',
    label: 'Font',
    extensions: ['ttf', 'otf', 'woff', 'woff2'],
    mimes: ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/font-woff'],
  },
  {
    kind: 'code',
    label: 'Code',
    extensions: [
      'js',
      'mjs',
      'cjs',
      'jsx',
      'ts',
      'mts',
      'cts',
      'tsx',
      'vue',
      'svelte',
      'astro',
      'css',
      'less',
      'scss',
      'sass',
      'styl',
      'py',
      'pyw',
      'java',
      'kt',
      'kts',
      'scala',
      'groovy',
      'gradle',
      'c',
      'h',
      'cc',
      'cpp',
      'cxx',
      'hpp',
      'hh',
      'hxx',
      'cs',
      'fs',
      'fsx',
      'go',
      'rs',
      'swift',
      'm',
      'mm',
      'php',
      'phtml',
      'rb',
      'erb',
      'rake',
      'pl',
      'pm',
      'lua',
      'r',
      'dart',
      'ex',
      'exs',
      'erl',
      'hrl',
      'clj',
      'cljs',
      'cljc',
      'edn',
      'hs',
      'lhs',
      'ml',
      'mli',
      'zig',
      'nim',
      'jl',
      'sol',
      'vb',
      'vbs',
      'bat',
      'cmd',
      'ps1',
      'psm1',
      'sh',
      'bash',
      'zsh',
      'fish',
      'ksh',
      'awk',
      'sed',
      'sql',
      'graphql',
      'gql',
      'prisma',
      'proto',
      'thrift',
      'tpl',
      'hbs',
      'handlebars',
      'ejs',
      'pug',
      'jade',
      'haml',
      'twig',
      'liquid',
      'mustache',
      'coffee',
      'diff',
      'patch',
      'toml',
      'yaml',
      'yml',
      'tf',
      'tfvars',
      'hcl',
      'nginx',
      'ini',
      'cfg',
      'conf',
      'properties',
      'env',
      'cmake',
      'lock',
    ],
    mimes: [
      'application/javascript',
      'text/javascript',
      'application/typescript',
      'text/x-python',
      'text/x-java',
      'text/x-c',
      'text/x-c++',
      'text/x-go',
      'text/x-rust',
      'text/x-php',
      'text/x-ruby',
      'text/x-shellscript',
      'text/x-sql',
      'text/yaml',
      'application/yaml',
      'text/x-toml',
    ],
  },
  {
    kind: 'text',
    label: 'Text',
    extensions: ['txt', 'log', 'text', 'nfo', 'eml', 'ics', 'vcf', 'readme'],
    mimes: ['text/plain', 'message/rfc822', 'text/calendar', 'text/vcard'],
  },
  {
    kind: 'unsupported',
    label: 'Word 97-2003',
    extensions: ['doc', 'dot'],
  },
  {
    kind: 'unsupported',
    label: 'Excel 97-2003',
    extensions: ['xls', 'xlsb', 'xlt'],
  },
  {
    kind: 'unsupported',
    label: 'PowerPoint 97-2003',
    extensions: ['ppt', 'pps', 'pot'],
  },
  {
    kind: 'unsupported',
    label: 'Archive',
    extensions: ['rar', '7z', 'bz2', 'xz', 'zst', 'lz', 'lzma', 'cab', 'iso'],
  },
  {
    kind: 'unsupported',
    label: 'E-book',
    extensions: ['mobi', 'azw', 'azw3', 'djvu'],
  },
  {
    kind: 'unsupported',
    label: 'Design file',
    extensions: ['psd', 'ai', 'sketch', 'fig', 'xd', 'indd', 'ep'],
  },
  {
    kind: 'unsupported',
    label: 'CAD drawing',
    extensions: ['dwg', 'dxf', 'dgn', 'step', 'stp', 'iges', 'igs'],
  },
  {
    kind: 'unsupported',
    label: 'Image',
    extensions: ['tif', 'tiff', 'heic', 'heif', 'raw', 'cr2', 'nef', 'arw', 'dng'],
  },
  {
    kind: 'unsupported',
    label: 'Font',
    extensions: ['eot'],
  },
]

const SPECIAL_FILES: Record<string, { kind: FileViewerKind; label: string }> = {
  dockerfile: { kind: 'code', label: 'Dockerfile' },
  makefile: { kind: 'code', label: 'Makefile' },
  cmakelists: { kind: 'code', label: 'CMake' },
  gemfile: { kind: 'code', label: 'Ruby' },
  rakefile: { kind: 'code', label: 'Ruby' },
  procfile: { kind: 'text', label: 'Text' },
  license: { kind: 'text', label: 'Text' },
  notice: { kind: 'text', label: 'Text' },
  authors: { kind: 'text', label: 'Text' },
  changelog: { kind: 'text', label: 'Text' },
  '.gitignore': { kind: 'code', label: 'Git config' },
  '.gitattributes': { kind: 'code', label: 'Git config' },
  '.editorconfig': { kind: 'code', label: 'EditorConfig' },
  '.npmrc': { kind: 'code', label: 'Config' },
  '.yarnrc': { kind: 'code', label: 'Config' },
  '.prettierrc': { kind: 'json', label: 'JSON' },
  '.eslintrc': { kind: 'json', label: 'JSON' },
  '.babelrc': { kind: 'json', label: 'JSON' },
  '.env': { kind: 'code', label: 'Config' },
  '.env.local': { kind: 'code', label: 'Config' },
  '.htaccess': { kind: 'code', label: 'Config' },
}

const EXTENSION_MIME_OVERRIDES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  pjpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
  apng: 'image/apng',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  mpg: 'video/mpeg',
  mpeg: 'video/mpeg',
  '3gp': 'video/3gpp',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  opus: 'audio/opus',
  weba: 'audio/webm',
  mid: 'audio/midi',
  midi: 'audio/midi',
  wma: 'audio/x-ms-wma',
  amr: 'audio/amr',
  aiff: 'audio/aiff',
  aif: 'audio/aiff',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  docm: 'application/vnd.ms-word.document.macroenabled.12',
  dotx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  dotm: 'application/vnd.ms-word.template.macroenabled.12',
  odt: 'application/vnd.oasis.opendocument.text',
  rtf: 'application/rtf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsm: 'application/vnd.ms-excel.sheet.macroenabled.12',
  xltx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  xltm: 'application/vnd.ms-excel.template.macroenabled.12',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pptm: 'application/vnd.ms-powerpoint.presentation.macroenabled.12',
  ppsx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  ppsm: 'application/vnd.ms-powerpoint.slideshow.macroenabled.12',
  potx: 'application/vnd.openxmlformats-officedocument.presentationml.template',
  potm: 'application/vnd.ms-powerpoint.template.macroenabled.12',
  odp: 'application/vnd.oasis.opendocument.presentation',
  md: 'text/markdown',
  markdown: 'text/markdown',
  mdx: 'text/markdown',
  json: 'application/json',
  jsonc: 'application/json',
  json5: 'application/json',
  geojson: 'application/geo+json',
  webmanifest: 'application/manifest+json',
  xml: 'application/xml',
  xsl: 'application/xml',
  xslt: 'application/xml',
  xsd: 'application/xml',
  svgz: 'application/gzip',
  html: 'text/html',
  htm: 'text/html',
  xhtml: 'application/xhtml+xml',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
  zip: 'application/zip',
  jar: 'application/java-archive',
  epub: 'application/epub+zip',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  tgz: 'application/gzip',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  txt: 'text/plain',
  log: 'text/plain',
}

const extensionMap = new Map<string, { kind: FileViewerKind; label: string }>()
const extensionMimeMap = new Map<string, string>(Object.entries(EXTENSION_MIME_OVERRIDES))
const mimeKindMap = new Map<string, { kind: FileViewerKind; label: string }>()
const kindMimeDefaults = new Map<FileViewerKind, string>()

for (const format of FORMATS) {
  const info = { kind: format.kind, label: format.label }
  for (const extension of format.extensions) {
    if (!extensionMap.has(extension)) extensionMap.set(extension, info)
  }
  for (const mime of format.mimes ?? []) {
    if (!mimeKindMap.has(mime)) mimeKindMap.set(mime, info)
    for (const extension of format.extensions) {
      if (!extensionMimeMap.has(extension)) extensionMimeMap.set(extension, mime)
    }
  }
  const defaultMime = format.mimes?.[0]
  if (defaultMime && !kindMimeDefaults.has(format.kind)) {
    kindMimeDefaults.set(format.kind, defaultMime)
  }
}

// Formats whose MIME type is more precise than the extension.
const AMBIGUOUS_EXTENSIONS = new Set(['ogg', 'ts', 'm', 'r', 'pl'])

function kindFromMime(mime: string): { kind: FileViewerKind; label: string } | undefined {
  const normalized = mime.split(';', 1)[0]?.trim().toLowerCase() ?? ''
  const exact = mimeKindMap.get(normalized)
  if (exact) return exact

  if (normalized.startsWith('image/')) return { kind: 'image', label: 'Image' }
  if (normalized.startsWith('video/')) return { kind: 'video', label: 'Video' }
  if (normalized.startsWith('audio/')) return { kind: 'audio', label: 'Audio' }
  if (normalized.startsWith('font/')) return { kind: 'font', label: 'Font' }
  if (normalized === 'application/vnd.apple.mpegurl') return { kind: 'video', label: 'Video' }
  if (normalized.startsWith('text/')) return { kind: 'text', label: 'Text' }
  if (normalized.endsWith('+json')) return { kind: 'json', label: 'JSON' }
  if (normalized.endsWith('+xml')) return { kind: 'xml', label: 'XML' }
  return undefined
}

export interface DetectedFormat {
  name: string
  extension: string
  mime: string
  kind: FileViewerKind
  label: string
  supported: boolean
}

export function detectFormat(name: string, mime?: string): DetectedFormat {
  const safeName = (name || 'file').trim() || 'file'
  const base = baseNameOf(safeName).toLowerCase()
  const extension = extensionOf(safeName)
  const normalizedMime = (mime ?? '').split(';', 1)[0]?.trim().toLowerCase() ?? ''

  let info = extensionMap.get(extension)
  const special = specialFilename(base)
  if (special) info = special

  if (!info && normalizedMime) {
    info = kindFromMime(normalizedMime)
  }

  if (info && extension && AMBIGUOUS_EXTENSIONS.has(extension) && normalizedMime) {
    const fromMime = kindFromMime(normalizedMime)
    // Generic text MIME must not turn `.ts` / `.m` source files into plain text.
    if (fromMime && fromMime.kind !== 'text' && fromMime.kind !== info.kind) {
      info = fromMime
    }
  }

  const resolvedMime =
    normalizedMime ||
    extensionMimeMap.get(extension) ||
    mimeForKind(info?.kind) ||
    'application/octet-stream'
  const label = info?.label ?? (extension ? extension.toUpperCase() : 'File')
  const kind = info?.kind ?? 'unsupported'

  return {
    name: safeName,
    extension,
    mime: resolvedMime,
    kind,
    label,
    supported: kind !== 'unsupported',
  }
}

function specialFilename(base: string): { kind: FileViewerKind; label: string } | undefined {
  return SPECIAL_FILES[base] ?? SPECIAL_FILES[base.replace(/^\./, '')]
}

function mimeForKind(kind: FileViewerKind | undefined): string | undefined {
  if (!kind) return undefined
  return kindMimeDefaults.get(kind)
}

export function toFileViewerMeta(
  name: string,
  mime: string | undefined,
  size: number | undefined,
): FileViewerMeta {
  const detected = detectFormat(name, mime)
  return {
    name: detected.name,
    extension: detected.extension,
    mime: mime?.trim() || detected.mime,
    size,
    kind: detected.kind,
    label: detected.label,
    supported: detected.supported,
  }
}

export function detectFileViewerKind(name: string, mime?: string): FileViewerKind {
  return detectFormat(name, mime).kind
}

export function detectMimeType(name: string): string | undefined {
  return extensionMimeMap.get(extensionOf(name))
}

/** Public catalog of supported extensions, grouped by kind. */
export const fileViewerFormatCatalog = FORMATS.map((format) => ({
  kind: format.kind,
  label: format.label,
  extensions: [...format.extensions],
  mimes: [...(format.mimes ?? [])],
}))
