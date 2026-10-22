import { onBeforeUnmount, ref } from 'vue'
import { toRendererError } from '../core/errors'
import { blobToArrayBuffer, decodeText } from '../core/format'
import type { FileViewerRendererProps } from '../types'

export interface UseTextSourceOptions {
  /** Maximum number of bytes to decode per load. */
  maxBytes: () => number
  /** Localized prefix used when reading fails. */
  errorMessage: () => string
  onReady?: () => void
  onError?: (error: Error) => void
}

/**
 * Shared blob → byte limit → text decoding pipeline for text-like renderers.
 * Keeps truncation, BOM handling and error wrapping consistent.
 */
export function useTextSource(props: FileViewerRendererProps, options: UseTextSourceOptions) {
  const text = ref('')
  const truncated = ref(false)
  const loaded = ref(false)
  let disposed = false

  async function load(limit = options.maxBytes()): Promise<string> {
    try {
      const blob = await props.source.getBlob()
      const clipped = Number.isFinite(limit) && blob.size > limit
      const buffer = await blobToArrayBuffer(clipped ? blob.slice(0, limit) : blob)
      if (disposed) return text.value

      text.value = decodeText(buffer)
      truncated.value = clipped
      loaded.value = true
      options.onReady?.()
      return text.value
    } catch (cause) {
      if (!disposed) options.onError?.(toRendererError(options.errorMessage(), cause))
      return text.value
    }
  }

  async function loadFull(): Promise<string> {
    return load(Number.POSITIVE_INFINITY)
  }

  onBeforeUnmount(() => {
    disposed = true
  })

  return { text, truncated, loaded, load, loadFull }
}
