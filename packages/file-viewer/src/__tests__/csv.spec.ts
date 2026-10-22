import { describe, expect, it } from 'vite-plus/test'
import { detectCsvDelimiter, parseCsv } from '../core/csv'

describe('CSV parser', () => {
  it('parses quoted cells, escapes and embedded newlines', () => {
    const source = 'name,note\n"Ada","line 1\nline 2"\n"Grace","a ""quote"""'
    const result = parseCsv(source)
    expect(result.rows).toEqual([
      ['name', 'note'],
      ['Ada', 'line 1\nline 2'],
      ['Grace', 'a "quote"'],
    ])
  })

  it('auto-detects common delimiters', () => {
    expect(detectCsvDelimiter('a;b;c\n1;2;3')).toBe(';')
    expect(detectCsvDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t')
    expect(detectCsvDelimiter('a|b\n1|2')).toBe('|')
  })

  it('honours an explicit delimiter and max rows', () => {
    const result = parseCsv('a,b\n1,2\n3,4', { delimiter: ',', maxRows: 2 })
    expect(result.rows).toHaveLength(2)
    expect(result.truncated).toBe(true)
  })

  it('supports Excel sep= declarations', () => {
    const result = parseCsv('sep=;\na;b\n1;2')
    expect(result.delimiter).toBe(';')
    expect(result.rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('returns no rows for empty input', () => {
    expect(parseCsv('').rows).toEqual([])
  })
})
