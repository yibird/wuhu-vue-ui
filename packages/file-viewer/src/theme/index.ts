import type { FileViewerResolvedTheme } from '../types'

/**
 * CSS variables used by the viewer. Every value can be overridden through the
 * `themeVars` prop or by targeting `.w-file-viewer` in your stylesheet.
 *
 * Keep these maps in sync with `src/style/token.less`, which owns the runtime
 * palette. The maps exist so consumers can compute / serialize the same theme
 * in JavaScript (SSR, `createFileViewerTheme`, `themeVars`).
 */
export const fileViewerLightTheme: Record<string, string> = {
  '--w-file-viewer-bg': '#f8fafc',
  '--w-file-viewer-surface': '#ffffff',
  '--w-file-viewer-surface-subtle': '#f1f5f9',
  '--w-file-viewer-surface-hover': '#f1f5f9',
  '--w-file-viewer-surface-active': '#e2e8f0',
  '--w-file-viewer-border': '#e2e8f0',
  '--w-file-viewer-border-subtle': '#f1f5f9',
  '--w-file-viewer-text': '#0f172a',
  '--w-file-viewer-text-secondary': '#475569',
  '--w-file-viewer-text-tertiary': '#5b6678',
  '--w-file-viewer-primary': '#4f46e5',
  '--w-file-viewer-on-primary': '#ffffff',
  '--w-file-viewer-primary-soft': 'rgba(79, 70, 229, 0.1)',
  '--w-file-viewer-success': '#047857',
  '--w-file-viewer-warning': '#b45309',
  '--w-file-viewer-warning-soft': 'rgba(180, 83, 9, 0.12)',
  '--w-file-viewer-danger': '#dc2626',
  '--w-file-viewer-danger-soft': 'rgba(220, 38, 38, 0.1)',
  '--w-file-viewer-content-bg': '#eef2f7',
  '--w-file-viewer-page-bg': '#ffffff',
  '--w-file-viewer-page-shadow':
    '0 1px 2px rgba(15, 23, 42, 0.08), 0 12px 32px -12px rgba(15, 23, 42, 0.18)',
  '--w-file-viewer-mask': 'rgba(15, 23, 42, 0.46)',
  '--w-file-viewer-code-bg': '#f8fafc',
  '--w-file-viewer-code-text': '#1e293b',
  '--w-file-viewer-code-gutter': '#5b6678',
  '--w-file-viewer-scrollbar': 'rgba(100, 116, 139, 0.4)',
  '--w-file-viewer-radius': '16px',
  '--w-file-viewer-mono': 'ui-monospace, SFMono-Regular, Consolas, monospace',
  '--w-file-viewer-watermark-color': '#0f172a',
  '--w-file-viewer-token-comment': '#64748b',
  '--w-file-viewer-token-string': '#0f766e',
  '--w-file-viewer-token-number': '#b45309',
  '--w-file-viewer-token-keyword': '#7c3aed',
  '--w-file-viewer-token-literal': '#0369a1',
  '--w-file-viewer-token-builtin': '#c026d3',
  '--w-file-viewer-token-function': '#1d4ed8',
  '--w-file-viewer-token-tag': '#be123c',
  '--w-file-viewer-token-attr': '#a16207',
  '--w-file-viewer-token-operator': '#475569',
  '--w-file-viewer-token-decorator': '#0d9488',
  '--w-file-viewer-token-regex': '#c2410c',
}

export const fileViewerDarkTheme: Record<string, string> = {
  '--w-file-viewer-bg': '#080c14',
  '--w-file-viewer-surface': '#1e293b',
  '--w-file-viewer-surface-subtle': '#141d2f',
  '--w-file-viewer-surface-hover': '#24334d',
  '--w-file-viewer-surface-active': '#2a3a55',
  '--w-file-viewer-border': '#2a3a55',
  '--w-file-viewer-border-subtle': '#1e2c42',
  '--w-file-viewer-text': '#e2e8f0',
  '--w-file-viewer-text-secondary': '#cbd5e1',
  '--w-file-viewer-text-tertiary': '#94a3b8',
  '--w-file-viewer-primary': '#818cf8',
  '--w-file-viewer-on-primary': '#0f172a',
  '--w-file-viewer-primary-soft': 'rgba(129, 140, 248, 0.16)',
  '--w-file-viewer-success': '#34d399',
  '--w-file-viewer-warning': '#fbbf24',
  '--w-file-viewer-warning-soft': 'rgba(251, 191, 36, 0.14)',
  '--w-file-viewer-danger': '#f87171',
  '--w-file-viewer-danger-soft': 'rgba(248, 113, 113, 0.14)',
  '--w-file-viewer-content-bg': '#060a12',
  '--w-file-viewer-page-bg': '#0f172a',
  '--w-file-viewer-page-shadow':
    '0 1px 2px rgba(0, 0, 0, 0.4), 0 16px 40px -16px rgba(0, 0, 0, 0.72)',
  '--w-file-viewer-mask': 'rgba(2, 6, 23, 0.72)',
  '--w-file-viewer-code-bg': '#0b1220',
  '--w-file-viewer-code-text': '#dbe4f0',
  '--w-file-viewer-code-gutter': '#7c8aa5',
  '--w-file-viewer-scrollbar': 'rgba(148, 163, 184, 0.36)',
  '--w-file-viewer-radius': '16px',
  '--w-file-viewer-mono': 'ui-monospace, SFMono-Regular, Consolas, monospace',
  '--w-file-viewer-watermark-color': '#e2e8f0',
  '--w-file-viewer-token-comment': '#7c8aa5',
  '--w-file-viewer-token-string': '#5eead4',
  '--w-file-viewer-token-number': '#fbbf24',
  '--w-file-viewer-token-keyword': '#c4b5fd',
  '--w-file-viewer-token-literal': '#7dd3fc',
  '--w-file-viewer-token-builtin': '#f0abfc',
  '--w-file-viewer-token-function': '#93c5fd',
  '--w-file-viewer-token-tag': '#fda4af',
  '--w-file-viewer-token-attr': '#fcd34d',
  '--w-file-viewer-token-operator': '#94a3b8',
  '--w-file-viewer-token-decorator': '#5eead4',
  '--w-file-viewer-token-regex': '#fdba74',
}

export function getFileViewerThemeVars(theme: FileViewerResolvedTheme): Record<string, string> {
  return theme === 'dark' ? fileViewerDarkTheme : fileViewerLightTheme
}

/** Build a complete custom theme from a base plus overrides. */
export function createFileViewerTheme(
  base: FileViewerResolvedTheme,
  overrides: Record<string, string> = {},
): Record<string, string> {
  return { ...getFileViewerThemeVars(base), ...overrides }
}
