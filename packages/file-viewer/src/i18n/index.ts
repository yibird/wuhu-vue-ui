import type { FileViewerMessages, FileViewerMessagesInput } from '../types'
import { en } from './en'
import { zhCN } from './zh-CN'

const localeRegistry = new Map<string, FileViewerMessages>()

export function normalizeFileViewerLocale(locale: string): string {
  return locale.trim().replace(/_/g, '-').toLowerCase()
}

export function registerFileViewerLocale(locale: string, messages: FileViewerMessages): void {
  localeRegistry.set(normalizeFileViewerLocale(locale), messages)
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = cloneValue(item)
    }
    return result as T
  }
  return value
}

function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return cloneValue(base)

  if (Array.isArray(base)) {
    return (Array.isArray(override) ? override : cloneValue(base)) as T
  }

  if (base && typeof base === 'object' && typeof override === 'object') {
    const result: Record<string, unknown> = cloneValue(base as Record<string, unknown>)
    for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
      if (value === undefined) continue
      if (key in result) {
        result[key] = deepMerge(result[key], value)
      } else {
        result[key] = cloneValue(value)
      }
    }
    return result as T
  }

  return override as T
}

function findLocale(locale: string): FileViewerMessages | undefined {
  const normalized = normalizeFileViewerLocale(locale)
  const exact = localeRegistry.get(normalized)
  if (exact) return exact

  const language = normalized.split('-')[0]
  if (language) {
    const languageMatch = localeRegistry.get(language)
    if (languageMatch) return languageMatch
    for (const [key, messages] of localeRegistry) {
      if (key.split('-')[0] === language) return messages
    }
  }

  return undefined
}

/**
 * Resolve a locale into a complete message tree. Unknown locales fall back to
 * English. Partial overrides are deep-merged on top of the locale.
 */
export function resolveFileViewerMessages(
  locale = 'en',
  overrides?: FileViewerMessagesInput,
): FileViewerMessages {
  const base = findLocale(locale) ?? en
  return overrides ? deepMerge(base, overrides) : cloneValue(base)
}

export function hasFileViewerLocale(locale: string): boolean {
  return Boolean(findLocale(locale))
}

/**
 * Replace `{name}` placeholders in a message.
 */
export function formatFileViewerMessage(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}

registerFileViewerLocale('en', en)
registerFileViewerLocale('zh-CN', zhCN)
registerFileViewerLocale('zh', zhCN)

/** Built-in message catalogs. */
export const fileViewerLocales = {
  en,
  'zh-CN': zhCN,
} as const

export { en, zhCN }
