import type { FileViewerSource } from '../types'
import { detectFormat } from './detect'
import { blobToArrayBuffer, decodeText } from './format'

export interface CreateFileViewerSourceInput {
  src?: string
  file?: File | Blob | null
  name?: string
  type?: string
  size?: number
}

export function fileNameFromUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('data:')) return ''
  try {
    const parsed = new URL(url, 'http://localhost/')
    const segments = parsed.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1] ?? ''
    try {
      return decodeURIComponent(last)
    } catch {
      return last
    }
  } catch {
    return url.split(/[\\/]/).pop()?.split(/[?#]/)[0] ?? ''
  }
}

function isFile(value: File | Blob): value is File {
  return typeof File !== 'undefined' && value instanceof File
}

export function createFileViewerSource(
  input: CreateFileViewerSourceInput,
): FileViewerSource | null {
  const blob = input.file ?? null
  const src = input.src?.trim() ?? ''
  if (!blob && !src) return null

  const urlName = src ? fileNameFromUrl(src) : ''
  const blobName = blob && isFile(blob) ? blob.name : ''
  const name = (input.name?.trim() || blobName || urlName || 'file').trim() || 'file'
  const typeHint = input.type?.trim() || blob?.type || ''
  const detected = detectFormat(name, typeHint)
  const mime = typeHint || (detected.mime !== 'application/octet-stream' ? detected.mime : '')
  const size = input.size ?? (blob ? blob.size : undefined)
  const lastModified = blob && isFile(blob) ? blob.lastModified : undefined

  let objectUrl = ''
  let isObjectUrl = false
  if (blob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    objectUrl = URL.createObjectURL(blob)
    isObjectUrl = true
  }

  const url = objectUrl || src
  let blobPromise: Promise<Blob> | undefined
  let disposed = false

  function getBlob(): Promise<Blob> {
    if (blob) return Promise.resolve(blob)
    if (!src) return Promise.reject(new Error('No file source was provided.'))
    blobPromise ??= fetch(src)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch the file (${response.status} ${response.statusText}).`)
        }
        return response.blob()
      })
      .catch((error: unknown) => {
        blobPromise = undefined
        throw new Error(
          `Failed to fetch the file. Check the URL and CORS policy. ${
            error instanceof Error ? error.message : ''
          }`.trim(),
        )
      })
    return blobPromise
  }

  return {
    name,
    mime: mime || detected.mime,
    extension: detected.extension,
    size,
    kind: detected.kind,
    url,
    file: blob && isFile(blob) ? blob : undefined,
    lastModified,
    get isObjectUrl() {
      return isObjectUrl
    },
    getBlob,
    getArrayBuffer: () => getBlob().then(blobToArrayBuffer),
    getText: () => getBlob().then(blobToArrayBuffer).then(decodeText),
    dispose(): void {
      if (disposed) return
      disposed = true
      if (isObjectUrl && objectUrl && typeof URL !== 'undefined') {
        URL.revokeObjectURL(objectUrl)
      }
    },
  }
}
