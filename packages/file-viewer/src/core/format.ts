const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character)
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value)
}

export interface SanitizeUrlOptions {
  /** Resolve relative URLs against this base. */
  base?: string
  /** Allow `blob:` URLs (used for extracted archive media). */
  allowBlob?: boolean
  /** Allow base64 bitmap data URLs. */
  allowDataImage?: boolean
}

/**
 * Accept only navigable protocols. Returns `null` for unsafe URLs such as
 * `javascript:` or `vbscript:`.
 */
export function sanitizeUrl(raw: string, options: SanitizeUrlOptions = {}): string | null {
  const value = Array.from(raw.trim())
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0
      return code >= 0x20 && code !== 0x7f
    })
    .join('')
  if (!value) return null
  if (value.startsWith('#')) return value

  if (/^(https?:|mailto:|tel:)/i.test(value)) return value
  if (options.allowBlob && /^blob:/i.test(value)) return value
  if (
    options.allowDataImage &&
    /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);base64,[a-z0-9+/=\s]+$/i.test(value)
  ) {
    return value
  }

  // Any other explicit protocol is not safe.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null

  if (value.startsWith('//')) {
    return options.base ? resolveUrl(value, options.base) : null
  }

  if (options.base) return resolveUrl(value, options.base)
  return value
}

function absoluteBaseUrl(base: string): string | undefined {
  try {
    return new URL(base).href
  } catch {
    // A relative base (for example `/samples/`) must be resolved against the
    // current document before it can be used as a URL base.
    if (typeof window === 'undefined' || !window.location?.href) return undefined
    try {
      return new URL(base, window.location.href).href
    } catch {
      return undefined
    }
  }
}

export function resolveUrl(value: string, base: string): string | null {
  const resolvedBase = absoluteBaseUrl(base)
  if (!resolvedBase) {
    // Without a document context, root-relative URLs are still navigable.
    return value.startsWith('/') ? value : null
  }
  try {
    return new URL(value, resolvedBase).href
  } catch {
    return null
  }
}

export function formatBytes(bytes: number | undefined, locale = 'en'): string | undefined {
  if (bytes === undefined || bytes === null || !Number.isFinite(bytes) || bytes < 0)
    return undefined
  if (bytes < 1024) return `${bytes} B`

  const units = ['KB', 'MB', 'GB', 'TB', 'PB']
  let value = bytes / 1024
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }

  let formatter: Intl.NumberFormat
  try {
    formatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: value >= 100 ? 0 : 1,
      minimumFractionDigits: 0,
    })
  } catch {
    formatter = new Intl.NumberFormat('en', {
      maximumFractionDigits: value >= 100 ? 0 : 1,
      minimumFractionDigits: 0,
    })
  }

  return `${formatter.format(value)} ${units[index]}`
}

export function formatDateTime(
  value: number | Date | undefined,
  locale = 'en',
): string | undefined {
  if (value === undefined) return undefined
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return date.toLocaleString()
  }
}

export function formatNumber(
  value: number,
  locale = 'en',
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value)
  } catch {
    return new Intl.NumberFormat('en', options).format(value)
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function toCssSize(value: string | number | undefined): string | undefined {
  if (value === undefined || value === '') return undefined
  return typeof value === 'number' ? `${value}px` : value
}

/** Decode text with BOM detection. */
export function decodeText(source: ArrayBuffer | Uint8Array): string {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source)

  try {
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      return new TextDecoder('utf-8').decode(bytes.subarray(3))
    }
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder('utf-16le').decode(bytes.subarray(2))
    }
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder('utf-16be').decode(bytes.subarray(2))
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  } catch {
    return ''
  }
}

/** Create a Blob from bytes without SharedArrayBuffer typing issues. */
export function bytesToBlob(bytes: Uint8Array, type = 'application/octet-stream'): Blob {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy.buffer], { type })
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result as ArrayBuffer))
    reader.addEventListener('error', () => reject(reader.error ?? new Error('Unable to read blob')))
    reader.readAsArrayBuffer(blob)
  })
}

export function blobToText(blob: Blob): Promise<string> {
  return blobToArrayBuffer(blob).then(decodeText)
}

export function toError(value: unknown): Error {
  if (value instanceof Error) return value
  if (typeof value === 'string') return new Error(value)
  try {
    return new Error(JSON.stringify(value))
  } catch {
    return new Error('Unknown error')
  }
}

export interface ObjectUrlPool {
  create(blob: Blob): string
  revoke(url: string): void
  clear(): void
  readonly size: number
}

/** Track object URLs and release them deterministically. */
export function createObjectUrlPool(): ObjectUrlPool {
  const urls = new Set<string>()

  return {
    create(blob: Blob): string {
      const url = URL.createObjectURL(blob)
      urls.add(url)
      return url
    },
    revoke(url: string): void {
      if (!urls.delete(url)) return
      URL.revokeObjectURL(url)
    },
    clear(): void {
      for (const url of urls) URL.revokeObjectURL(url)
      urls.clear()
    },
    get size(): number {
      return urls.size
    },
  }
}

export function extensionOf(name: string): string {
  const clean = name.split(/[?#]/, 1)[0] ?? ''
  const base = clean.split(/[\\/]/).pop() ?? ''
  const dot = base.lastIndexOf('.')
  if (dot <= 0 || dot === base.length - 1) return ''
  return base.slice(dot + 1).toLowerCase()
}

export function baseNameOf(name: string): string {
  const clean = name.split(/[?#]/, 1)[0] ?? ''
  return clean.split(/[\\/]/).pop() ?? clean
}
