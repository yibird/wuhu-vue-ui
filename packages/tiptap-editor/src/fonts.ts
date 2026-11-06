export interface TiptapFontFamilyOption {
  /** Display name shown in the toolbar menu. */
  label: string
  /** CSS `font-family` value. An empty string resets to the editor default. */
  value: string
}

/**
 * Built-in font stacks. Each value lists a Windows, macOS and generic fallback
 * so the chosen family degrades predictably across platforms.
 */
export const TIPTAP_FONT_FAMILIES: readonly TiptapFontFamilyOption[] = [
  { label: '默认字体', value: '' },
  { label: '微软雅黑', value: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif' },
  { label: '宋体', value: 'SimSun, "Songti SC", "Noto Serif SC", serif' },
  { label: '楷体', value: 'KaiTi, "Kaiti SC", "Noto Serif SC", serif' },
  { label: '仿宋', value: 'FangSong, "FangSong_GB2312", serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: '等宽', value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
]
