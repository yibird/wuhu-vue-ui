export interface IconProps {
  /**
   * Icon name. Supports plain names (`chevron-up`) and Iconify-style names
   * (`i-lucide:chevron-up`).
   */
  name: string
  /** Icon size. Numbers are pixels. Defaults to 16. */
  size?: number | string
  /** Stroke color. Defaults to `currentColor`. */
  color?: string
  /** SVG stroke width. Defaults to 2. */
  strokeWidth?: number
  /** Accessible label. When omitted the icon is hidden from assistive technology. */
  label?: string
  /** Rotate the icon continuously. */
  spin?: boolean
}
