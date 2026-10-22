import { computed, ref, watch } from 'vue'

export interface RendererManifest {
  kind: string
  formats: string[]
  lazy: boolean
}

const CACHE = new Map<string, Promise<unknown>>()

/**
 * Load a renderer chunk exactly once and cache the promise so concurrent
 * previews of the same format share the network request.
 */
export function loadRenderer(kind: string): Promise<unknown> {
  const cached = CACHE.get(kind)
  if (cached) return cached

  const promise = import(`./renderers/${kind}.vue`).catch((error: unknown) => {
    CACHE.delete(kind)
    throw error
  })
  CACHE.set(kind, promise)
  return promise
}

export function usePreview(source: { name: string; type: string }) {
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const manifest = ref<RendererManifest | null>(null)

  const isOffice = computed(() => /word|sheet|presentation/.test(manifest.value?.kind ?? ''))

  watch(
    () => source.name,
    async () => {
      loading.value = true
      error.value = null
      try {
        manifest.value = {
          kind: source.type,
          formats: source.name.split('.').slice(1),
          lazy: true,
        }
      } catch (cause) {
        error.value = cause instanceof Error ? cause : new Error('Unknown error')
      } finally {
        loading.value = false
      }
    },
    { immediate: true },
  )

  return { loading, error, manifest, isOffice }
}

// A tiny tokenizer used by the syntax demo.
export const KEYWORDS = new Set([
  'const',
  'let',
  'export',
  'import',
  'function',
  'return',
  'if',
  'else',
])

export function tokenize(line: string): Array<{ value: string; kind: string }> {
  return line
    .split(/(\s+|[()[\]{}.,;:=<>+*/-])/)
    .filter(Boolean)
    .map((value) => ({
      value,
      kind: KEYWORDS.has(value) ? 'keyword' : /^\d+$/.test(value) ? 'number' : 'plain',
    }))
}
