import { isSafeExternalUrl } from './download'
import { escapeHtml } from './format'

export const PRINT_STYLES = `
  @page { margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #111827;
    background: #fff;
    font-family: 'Inter', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
    font-size: 13px;
    line-height: 1.6;
  }
  h1, h2, h3, h4, h5, h6 { line-height: 1.3; margin: 1.2em 0 0.5em; }
  p { margin: 0 0 0.75em; }
  a { color: #1d4ed8; text-decoration: underline; }
  img { max-width: 100%; height: auto; }
  pre {
    margin: 0 0 12px;
    padding: 12px;
    border: 1px solid #d8dee9;
    border-radius: 6px;
    background: #f8fafc;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { padding: 5px 7px; border: 1px solid #cbd5e1; vertical-align: top; text-align: left; }
  th { background: #f1f5f9; }
  blockquote { margin: 12px 0; padding: 4px 14px; border-left: 3px solid #cbd5e1; color: #475569; }
  hr { border: 0; border-top: 1px solid #e2e8f0; margin: 18px 0; }
  .w-file-viewer__token { color: inherit !important; }
  .w-file-viewer__docx-page,
  .w-file-viewer__xlsx-sheet,
  .w-file-viewer__md-body,
  .w-file-viewer__text-body {
    margin: 0 auto;
    border: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    color: #111 !important;
  }
  .w-file-viewer__docx-page + .w-file-viewer__docx-page { page-break-before: always; }
  .w-file-viewer__pptx-slide { page-break-after: always; break-after: page; }
`

export function printHtml(title: string, bodyHtml: string, extraStyles = ''): boolean {
  if (typeof window === 'undefined') return false
  const win = window.open('', '_blank')
  if (!win) return false

  win.opener = null
  win.document.open()
  win.document.write(
    `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(
      title,
    )}</title><style>${PRINT_STYLES}\n${extraStyles}</style></head><body>${bodyHtml}</body></html>`,
  )
  win.document.close()
  win.focus()

  const trigger = () => {
    try {
      win.print()
    } catch {
      // The user can still print from the opened window.
    }
  }
  setTimeout(trigger, 350)
  return true
}

export function printUrl(url: string): boolean {
  if (typeof window === 'undefined' || !url || !isSafeExternalUrl(url)) return false
  const win = window.open(url, '_blank')
  if (!win) return false
  win.opener = null
  return true
}
