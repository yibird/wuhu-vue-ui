import { firstDescendant, parseXml } from './xml'
import type { ZipReaderLike } from './zip'

const ROMAN_TABLE: Array<[number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

/** Converts a positive integer to an uppercase Roman numeral. */
export function roman(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''

  let remaining = value
  let output = ''
  for (const [amount, symbol] of ROMAN_TABLE) {
    while (remaining >= amount) {
      output += symbol
      remaining -= amount
    }
  }
  return output
}

/** Reads `docProps/core.xml` title for Office/ODF archives. */
export async function readOfficeTitle(zip: ZipReaderLike): Promise<string | undefined> {
  if (!zip.has('docProps/core.xml')) return undefined
  try {
    const document = parseXml(await zip.text('docProps/core.xml'))
    const title = firstDescendant(document, 'title')?.textContent?.trim()
    return title || undefined
  } catch {
    return undefined
  }
}
