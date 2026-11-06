import { bytesToBlob, decodeText } from './format'

export interface ArchiveEntry {
  name: string
  size: number
  compressedSize: number
  date?: Date
  directory: boolean
  encrypted: boolean
  method: number
}

export interface ArchiveReader {
  readonly entries: readonly ArchiveEntry[]
  readonly format: 'zip' | 'tar' | 'gzip'
  has(name: string): boolean
  read(name: string): Promise<Uint8Array>
  text(name: string): Promise<string>
  blob(name: string, type?: string): Promise<Blob>
}

/** Minimal interface consumed by the Office / EPUB parsers. */
export interface ZipReaderLike {
  has(name: string): boolean
  read(name: string): Promise<Uint8Array>
  text(name: string): Promise<string>
}

interface ZipEntryInternal extends ArchiveEntry {
  localOffset: number
  utf8: boolean
}

export interface ArchiveOpenOptions {
  /** Maximum number of archive entries parsed. Defaults to 10000. */
  maxEntries?: number
  /** Maximum uncompressed bytes allowed for a single entry. Defaults to 64 MiB. */
  maxEntryBytes?: number
}

const DEFAULT_MAX_ENTRIES = 10_000
const DEFAULT_MAX_ENTRY_BYTES = 64 * 1024 * 1024
const MAX_CACHE_BYTES = 32 * 1024 * 1024

const EOCD_SIGNATURE = 0x06054b50
const ZIP64_EOCD_SIGNATURE = 0x06064b50
const ZIP64_LOCATOR_SIGNATURE = 0x07064b50
const CENTRAL_SIGNATURE = 0x02014b50
const LOCAL_SIGNATURE = 0x04034b50

export function decodeZipHref(href: string): string {
  try {
    return decodeURIComponent(href)
  } catch {
    return href
  }
}

export function resolveZipPath(fromFile: string, target: string): string {
  const clean = decodeZipHref(target).split('#')[0]?.split('?')[0] ?? ''
  if (!clean) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean)) return clean

  const base = fromFile.replace(/\\/g, '/').split('/')
  base.pop()

  const parts = clean.replace(/\\/g, '/').split('/')
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') base.pop()
    else base.push(part)
  }

  return base.filter(Boolean).join('/')
}

function parseDosDate(time: number, date: number): Date | undefined {
  if (!time && !date) return undefined
  const year = 1980 + ((date >> 9) & 0x7f)
  const month = ((date >> 5) & 0x0f) - 1
  const day = date & 0x1f
  const hours = (time >> 11) & 0x1f
  const minutes = (time >> 5) & 0x3f
  const seconds = (time & 0x1f) * 2
  if (month < 0 || day < 1) return undefined
  const value = new Date(year, month, day, hours, minutes, seconds)
  return Number.isNaN(value.getTime()) ? undefined : value
}

function decodeName(bytes: Uint8Array, utf8: boolean): string {
  try {
    return new TextDecoder(utf8 ? 'utf-8' : 'windows-1252', { fatal: false }).decode(bytes)
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  }
}

async function decompress(
  data: Uint8Array,
  format: 'deflate-raw' | 'gzip',
  maxBytes = DEFAULT_MAX_ENTRY_BYTES,
): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error(
      'This browser does not support DecompressionStream required to read the archive.',
    )
  }

  const reader = bytesToBlob(data).stream().pipeThrough(new DecompressionStream(format)).getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        throw new Error(`Archive entry exceeds the ${maxBytes} byte decompression limit.`)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }
  return output.buffer
}

export class ZipArchive implements ArchiveReader {
  readonly format = 'zip' as const
  readonly entries: ArchiveEntry[]

  private readonly internalEntries: ZipEntryInternal[]
  private readonly byName = new Map<string, ZipEntryInternal>()
  private readonly byLowerName = new Map<string, ZipEntryInternal>()
  private readonly data: Uint8Array
  private readonly cache = new Map<string, Promise<Uint8Array>>()
  private readonly maxEntryBytes: number
  private cachedBytes = 0

  private constructor(data: Uint8Array, entries: ZipEntryInternal[], options: ArchiveOpenOptions) {
    this.data = data
    this.maxEntryBytes = options.maxEntryBytes ?? DEFAULT_MAX_ENTRY_BYTES
    this.internalEntries = entries
    this.entries = entries.map(({ localOffset: _localOffset, utf8: _utf8, ...entry }) => entry)
    for (const entry of entries) {
      this.byName.set(entry.name, entry)
      if (!this.byLowerName.has(entry.name.toLowerCase())) {
        this.byLowerName.set(entry.name.toLowerCase(), entry)
      }
    }
  }

  static async open(
    source: ArrayBuffer | Uint8Array,
    options: ArchiveOpenOptions = {},
  ): Promise<ZipArchive> {
    const data = source instanceof Uint8Array ? source : new Uint8Array(source)
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const entries = readCentralDirectory(data, view, options.maxEntries ?? DEFAULT_MAX_ENTRIES)
    return new ZipArchive(data, entries, options)
  }

  private findInternal(name: string): ZipEntryInternal | undefined {
    const normalized = name.replace(/^\/+/, '').replace(/\\/g, '/')
    return this.byName.get(normalized) ?? this.byLowerName.get(normalized.toLowerCase())
  }

  get(name: string): ArchiveEntry | undefined {
    return this.findInternal(name)
  }

  has(name: string): boolean {
    return Boolean(this.findInternal(name))
  }

  async read(name: string): Promise<Uint8Array> {
    const entry = this.findInternal(name)
    if (!entry) throw new Error(`Archive entry not found: ${name}`)
    if (entry.directory) return new Uint8Array()
    if (entry.encrypted) throw new Error('Encrypted archive entries are not supported.')

    const cached = this.cache.get(entry.name)
    if (cached) return cached

    const promise = this.extract(entry)
      .then((result) => {
        if (this.cachedBytes + result.byteLength > MAX_CACHE_BYTES) {
          this.cache.delete(entry.name)
        } else {
          this.cachedBytes += result.byteLength
        }
        return result
      })
      .catch((error: unknown) => {
        this.cache.delete(entry.name)
        throw error
      })

    this.cache.set(entry.name, promise)
    return promise
  }

  async text(name: string): Promise<string> {
    return decodeText(await this.read(name))
  }

  async blob(name: string, type = 'application/octet-stream'): Promise<Blob> {
    return bytesToBlob(await this.read(name), type)
  }

  private async extract(entry: ZipEntryInternal): Promise<Uint8Array> {
    const view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength)
    const offset = entry.localOffset
    if (offset + 30 > this.data.length || view.getUint32(offset, true) !== LOCAL_SIGNATURE) {
      throw new Error(`Invalid local header for archive entry: ${entry.name}`)
    }

    const nameLength = view.getUint16(offset + 26, true)
    const extraLength = view.getUint16(offset + 28, true)
    const dataStart = offset + 30 + nameLength + extraLength
    const dataEnd = dataStart + entry.compressedSize

    if (dataStart > this.data.length || dataEnd > this.data.length) {
      throw new Error(`Truncated archive entry: ${entry.name}`)
    }
    if (entry.size > this.maxEntryBytes) {
      throw new Error(
        `Archive entry "${entry.name}" exceeds the ${this.maxEntryBytes} byte preview limit.`,
      )
    }

    const compressed = this.data.subarray(dataStart, dataEnd)
    if (entry.method === 0) return compressed
    if (entry.method === 8) {
      const buffer = await decompress(compressed, 'deflate-raw', this.maxEntryBytes)
      return new Uint8Array(buffer)
    }
    throw new Error(`Unsupported ZIP compression method: ${entry.method}`)
  }

  get size(): number {
    return this.internalEntries.length
  }
}

function readZip64Extra(
  view: DataView,
  extraOffset: number,
  extraLength: number,
  entry: { size: number; compressedSize: number; localOffset: number },
) {
  let cursor = extraOffset
  const end = extraOffset + extraLength
  while (cursor + 4 <= end) {
    const id = view.getUint16(cursor, true)
    const size = view.getUint16(cursor + 2, true)
    const dataStart = cursor + 4
    if (id === 0x0001) {
      let position = dataStart
      if (entry.size === 0xffffffff && position + 8 <= dataStart + size) {
        entry.size = Number(view.getBigUint64(position, true))
        position += 8
      }
      if (entry.compressedSize === 0xffffffff && position + 8 <= dataStart + size) {
        entry.compressedSize = Number(view.getBigUint64(position, true))
        position += 8
      }
      if (entry.localOffset === 0xffffffff && position + 8 <= dataStart + size) {
        entry.localOffset = Number(view.getBigUint64(position, true))
      }
      return
    }
    cursor = dataStart + size
  }
}

function readCentralDirectory(
  data: Uint8Array,
  view: DataView,
  maxEntries: number,
): ZipEntryInternal[] {
  const searchStart = Math.max(0, data.length - 0xffff - 22)
  let eocd = -1
  for (let offset = data.length - 22; offset >= searchStart; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) {
      eocd = offset
      break
    }
  }
  if (eocd < 0) throw new Error('Invalid ZIP archive: end of central directory not found.')

  let totalEntries = view.getUint16(eocd + 10, true)
  let centralOffset = view.getUint32(eocd + 16, true)

  if (
    (totalEntries === 0xffff || centralOffset === 0xffffffff) &&
    eocd >= 20 &&
    view.getUint32(eocd - 20, true) === ZIP64_LOCATOR_SIGNATURE
  ) {
    const zip64Offset = Number(view.getBigUint64(eocd - 20 + 8, true))
    if (
      zip64Offset + 56 <= data.length &&
      view.getUint32(zip64Offset, true) === ZIP64_EOCD_SIGNATURE
    ) {
      totalEntries = Number(view.getBigUint64(zip64Offset + 32, true))
      centralOffset = Number(view.getBigUint64(zip64Offset + 48, true))
    }
  }

  if (centralOffset >= data.length) throw new Error('Invalid ZIP archive: bad central directory.')
  if (totalEntries > maxEntries) {
    throw new Error(
      `ZIP archive contains ${totalEntries} entries, exceeding the ${maxEntries} entry limit.`,
    )
  }

  const entries: ZipEntryInternal[] = []
  let cursor = centralOffset
  for (let index = 0; index < totalEntries; index += 1) {
    if (cursor + 46 > data.length || view.getUint32(cursor, true) !== CENTRAL_SIGNATURE) {
      throw new Error('Invalid ZIP archive: truncated central directory.')
    }

    const flags = view.getUint16(cursor + 8, true)
    const method = view.getUint16(cursor + 10, true)
    const time = view.getUint16(cursor + 12, true)
    const date = view.getUint16(cursor + 14, true)
    const compressedSize = view.getUint32(cursor + 20, true)
    const size = view.getUint32(cursor + 24, true)
    const nameLength = view.getUint16(cursor + 28, true)
    const extraLength = view.getUint16(cursor + 30, true)
    const commentLength = view.getUint16(cursor + 32, true)
    const localOffset = view.getUint32(cursor + 42, true)
    const utf8 = (flags & 0x0800) !== 0

    const nameStart = cursor + 46
    const nameBytes = data.subarray(nameStart, nameStart + nameLength)
    let name = decodeName(nameBytes, utf8).replace(/\\/g, '/').replace(/^\/+/, '')
    if (!name) name = `entry-${index + 1}`

    const entrySizes = { size, compressedSize, localOffset }
    readZip64Extra(view, nameStart + nameLength, extraLength, entrySizes)

    entries.push({
      name,
      size: entrySizes.size,
      compressedSize: entrySizes.compressedSize,
      localOffset: entrySizes.localOffset,
      date: parseDosDate(time, date),
      directory: name.endsWith('/'),
      encrypted: (flags & 0x0001) !== 0,
      method,
      utf8,
    })

    cursor = nameStart + nameLength + extraLength + commentLength
  }

  return entries
}

interface TarEntryInternal extends ArchiveEntry {
  dataOffset: number
}

function readOctal(bytes: Uint8Array, offset: number, length: number): number {
  let text = ''
  for (let index = 0; index < length; index += 1) {
    const code = bytes[offset + index]
    if (code === 0 || code === 32) continue
    if (code < 48 || code > 55) break
    text += String.fromCharCode(code)
  }
  return text ? Number.parseInt(text, 8) : 0
}

function readString(bytes: Uint8Array, offset: number, length: number): string {
  let end = offset
  const limit = offset + length
  while (end < limit && bytes[end] !== 0) end += 1
  return new TextDecoder().decode(bytes.subarray(offset, end))
}

function parsePax(data: Uint8Array): Record<string, string> {
  const text = new TextDecoder().decode(data)
  const result: Record<string, string> = {}
  let cursor = 0
  while (cursor < text.length) {
    const space = text.indexOf(' ', cursor)
    if (space < 0) break
    const length = Number.parseInt(text.slice(cursor, space), 10)
    if (!Number.isFinite(length) || length <= 0) break
    const record = text.slice(space + 1, cursor + length - 1)
    const equals = record.indexOf('=')
    if (equals > 0) result[record.slice(0, equals)] = record.slice(equals + 1)
    cursor += length
  }
  return result
}

export class TarArchive implements ArchiveReader {
  readonly format = 'tar' as const
  readonly entries: ArchiveEntry[]

  private readonly data: Uint8Array
  private readonly internalEntries: TarEntryInternal[]

  private constructor(data: Uint8Array, entries: TarEntryInternal[]) {
    this.data = data
    this.internalEntries = entries
    this.entries = entries.map(({ dataOffset: _dataOffset, ...entry }) => entry)
  }

  static parse(data: ArrayBuffer | Uint8Array, options: ArchiveOpenOptions = {}): TarArchive {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
    const entries: TarEntryInternal[] = []
    const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES
    const maxEntryBytes = options.maxEntryBytes ?? DEFAULT_MAX_ENTRY_BYTES
    let cursor = 0
    let overrideName: string | undefined

    while (cursor + 512 <= bytes.length) {
      const block = bytes.subarray(cursor, cursor + 512)
      if (block.every((byte) => byte === 0)) break

      const name = readString(block, 0, 100)
      const prefix = readString(block, 345, 155)
      const size = readOctal(block, 124, 12)
      const mtime = readOctal(block, 136, 12)
      const type = String.fromCharCode(block[156] || 48)
      const fullName = (prefix ? `${prefix}/${name}` : name).replace(/^\/+/, '')

      const dataOffset = cursor + 512
      const padded = Math.ceil(size / 512) * 512

      if (size < 0 || dataOffset + size > bytes.length) {
        throw new Error(`Truncated or invalid TAR entry: ${fullName || 'unknown'}`)
      }
      if (size > maxEntryBytes) {
        throw new Error(
          `TAR entry "${fullName || 'unknown'}" exceeds the ${maxEntryBytes} byte limit.`,
        )
      }

      const payload = bytes.subarray(dataOffset, dataOffset + size)

      if (type === 'x' || type === 'X') {
        const pax = parsePax(payload)
        if (pax.path) overrideName = pax.path
      } else if (type === 'L') {
        overrideName = readString(payload, 0, payload.length).replace(/\0+$/, '')
      } else if (type === 'g') {
        // Global PAX headers do not change the entry list.
      } else {
        const entryName = (overrideName ?? fullName).replace(/^\/+/, '')
        overrideName = undefined
        const directory = type === '5' || entryName.endsWith('/')
        const regularFile = type === '0' || type === '\0'
        if (entryName && (regularFile || directory)) {
          if (entries.length >= maxEntries) {
            throw new Error(`TAR archive exceeds the ${maxEntries} entry limit.`)
          }
          entries.push({
            name: entryName,
            size,
            compressedSize: size,
            date: mtime > 0 ? new Date(mtime * 1000) : undefined,
            directory,
            encrypted: false,
            method: 0,
            dataOffset,
          })
        }
      }

      cursor = dataOffset + padded
    }

    return new TarArchive(bytes, entries)
  }

  has(name: string): boolean {
    return this.internalEntries.some((entry) => entry.name === name)
  }

  async read(name: string): Promise<Uint8Array> {
    const entry = this.internalEntries.find((candidate) => candidate.name === name)
    if (!entry) throw new Error(`Archive entry not found: ${name}`)
    return this.data.subarray(entry.dataOffset, entry.dataOffset + entry.size)
  }

  async text(name: string): Promise<string> {
    return decodeText(await this.read(name))
  }

  async blob(name: string, type = 'application/octet-stream'): Promise<Blob> {
    return bytesToBlob(await this.read(name), type)
  }
}

class SingleFileArchive implements ArchiveReader {
  readonly format = 'gzip' as const
  readonly entries: ArchiveEntry[]

  constructor(
    private readonly name: string,
    private readonly data: Uint8Array,
  ) {
    this.entries = [
      {
        name,
        size: data.length,
        compressedSize: data.length,
        directory: false,
        encrypted: false,
        method: 0,
      },
    ]
  }

  has(name: string): boolean {
    return name === this.name
  }

  async read(name: string): Promise<Uint8Array> {
    if (name !== this.name) throw new Error(`Archive entry not found: ${name}`)
    return this.data
  }

  async text(name: string): Promise<string> {
    return decodeText(await this.read(name))
  }

  async blob(name: string, type = 'application/octet-stream'): Promise<Blob> {
    return bytesToBlob(await this.read(name), type)
  }
}

export async function openArchive(
  data: ArrayBuffer | Uint8Array,
  name = '',
  options: ArchiveOpenOptions = {},
): Promise<ArchiveReader> {
  const lower = name.toLowerCase()
  if (lower.endsWith('.tar')) {
    return TarArchive.parse(data, options)
  }

  if (lower.endsWith('.gz') || lower.endsWith('.tgz') || lower.endsWith('.tar.gz')) {
    const buffer = await decompress(
      data instanceof Uint8Array ? data : new Uint8Array(data),
      'gzip',
      options.maxEntryBytes ?? DEFAULT_MAX_ENTRY_BYTES,
    )
    const isTar = lower.endsWith('.tgz') || lower.endsWith('.tar.gz')
    if (isTar) return TarArchive.parse(buffer, options)
    const innerName = name.replace(/\.gz$/i, '') || 'file'
    return new SingleFileArchive(innerName, new Uint8Array(buffer))
  }

  return ZipArchive.open(data, options)
}
