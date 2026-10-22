export interface SubtitleCue {
  index: number
  start: string
  end: string
  text: string
}

function stripMarkup(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function normalizeTimestamp(value: string): string {
  return value.trim().replace(',', '.')
}

function parseSrtVtt(source: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  const blocks = source
    .replace(/\r\n?/g, '\n')
    .replace(/^\uFEFF/, '')
    .split(/\n{2,}/)

  for (const block of blocks) {
    const lines = block.split('\n').filter((line) => line.trim().length > 0)
    if (lines.length === 0) continue
    if (/^WEBVTT/i.test(lines[0] ?? '')) continue

    let timeLineIndex = 0
    if (/^\d+$/.test(lines[0]?.trim() ?? '')) timeLineIndex = 1
    const timeLine = lines[timeLineIndex] ?? ''
    const match =
      /^(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})/.exec(
        timeLine.trim(),
      )
    if (!match) continue

    const text = stripMarkup(lines.slice(timeLineIndex + 1).join('\n'))
    if (!text) continue
    cues.push({
      index: cues.length + 1,
      start: normalizeTimestamp(match[1] ?? ''),
      end: normalizeTimestamp(match[2] ?? ''),
      text,
    })
  }

  return cues
}

function parseAss(source: string): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    if (!/^Dialogue:\s*/i.test(line)) continue
    const payload = line.replace(/^Dialogue:\s*/i, '')
    const parts = payload.split(',')
    if (parts.length < 10) continue
    const start = parts[1]?.trim() ?? ''
    const end = parts[2]?.trim() ?? ''
    const text = stripMarkup(
      parts
        .slice(9)
        .join(',')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\\N/gi, '\n'),
    )
    if (!text) continue
    cues.push({
      index: cues.length + 1,
      start: normalizeTimestamp(start),
      end: normalizeTimestamp(end),
      text,
    })
  }
  return cues
}

function parseLrc(source: string): SubtitleCue[] {
  const entries: Array<{ time: number; text: string }> = []
  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const matches = Array.from(line.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g))
    if (matches.length === 0) continue
    const text = line.replace(/\[[^\]]*\]/g, '').trim()
    if (!text) continue
    for (const match of matches) {
      const minutes = Number.parseInt(match[1] ?? '0', 10)
      const seconds = Number.parseInt(match[2] ?? '0', 10)
      const fraction = match[3] ? Number.parseInt(match[3], 10) / 10 ** match[3].length : 0
      entries.push({ time: minutes * 60 + seconds + fraction, text })
    }
  }

  entries.sort((a, b) => a.time - b.time)
  return entries.map((entry, index) => {
    const next = entries[index + 1]?.time ?? entry.time + 4
    return {
      index: index + 1,
      start: formatSeconds(entry.time),
      end: formatSeconds(next),
      text: entry.text,
    }
  })
}

function formatSeconds(value: number): string {
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  const milliseconds = Math.round((value - Math.floor(value)) * 1000)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(
    milliseconds,
  ).padStart(3, '0')}`
}

export function parseSubtitles(source: string, extension: string): SubtitleCue[] {
  const format = extension.toLowerCase()
  if (format === 'ass' || format === 'ssa') return parseAss(source)
  if (format === 'lrc') return parseLrc(source)
  return parseSrtVtt(source)
}
