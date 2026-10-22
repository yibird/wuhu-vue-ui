import type { ZipReaderLike } from './zip'
import { resolveZipPath } from './zip'
import { attribute, descendants, parseXml } from './xml'

export interface Relationship {
  id: string
  type: string
  target: string
  external: boolean
}

export function relationshipsPath(sourcePath: string): string {
  const normalized = sourcePath.replace(/\\/g, '/').replace(/^\/+/, '')
  const slash = normalized.lastIndexOf('/')
  const directory = slash >= 0 ? normalized.slice(0, slash + 1) : ''
  const fileName = normalized.slice(slash + 1)
  return `${directory}_rels/${fileName}.rels`
}

export async function readRelationships(
  zip: ZipReaderLike,
  sourcePath: string,
): Promise<Map<string, Relationship>> {
  const result = new Map<string, Relationship>()
  const path = relationshipsPath(sourcePath)
  if (!zip.has(path)) return result

  let document: Document
  try {
    document = parseXml(await zip.text(path))
  } catch {
    return result
  }

  for (const element of descendants(document, 'Relationship')) {
    const id = attribute(element, 'Id')
    const target = attribute(element, 'Target')
    if (!id || !target) continue

    const external = attribute(element, 'TargetMode') === 'External'
    result.set(id, {
      id,
      type: attribute(element, 'Type') ?? '',
      external,
      target: external ? target : resolveZipPath(sourcePath, target),
    })
  }

  return result
}
