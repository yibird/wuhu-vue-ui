interface RgbColor {
  r: number
  g: number
  b: number
}

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)))
}

export function parseColor(value: string): RgbColor | null {
  const color = value.trim()

  const hex = /^#([\da-f]{3,8})$/i.exec(color)
  if (hex) {
    const raw = hex[1]!
    if (raw.length === 3 || raw.length === 4) {
      return {
        r: parseInt(raw[0]! + raw[0]!, 16),
        g: parseInt(raw[1]! + raw[1]!, 16),
        b: parseInt(raw[2]! + raw[2]!, 16),
      }
    }
    if (raw.length === 6 || raw.length === 8) {
      return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16),
      }
    }
    return null
  }

  const rgb = /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i.exec(color)
  if (rgb) {
    return {
      r: clampChannel(Number(rgb[1])),
      g: clampChannel(Number(rgb[2])),
      b: clampChannel(Number(rgb[3])),
    }
  }

  return null
}

export function colorWithAlpha(color: string, alpha: number): string | null {
  const rgb = parseColor(color)
  if (!rgb) return null
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}
