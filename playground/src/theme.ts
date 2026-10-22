import { ref } from 'vue'

export type DocsTheme = 'light' | 'dark'

function initialTheme(): DocsTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const theme = ref<DocsTheme>(initialTheme())

if (typeof document !== 'undefined') {
  document.documentElement.dataset.wTheme = theme.value
}

export function setTheme(next: DocsTheme): void {
  theme.value = next
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.wTheme = next
  }
}

export function toggleTheme(): void {
  setTheme(theme.value === 'light' ? 'dark' : 'light')
}
