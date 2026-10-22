import { describe, expect, it } from 'vite-plus/test'
import { parseRtf } from '../core/rtf'

describe('RTF parser', () => {
  it('renders character styles, colors, fonts, alignment and unicode', () => {
    const html = parseRtf(
      String.raw`{\rtf1\ansi\ansicpg1252
{\fonttbl{\f0\fnil\fcharset0 Calibri;}}
{\colortbl;\red255\green0\blue0;}
\pard\qc\f0\fs32\b Hello \i RTF\i0\b0\par
\pard\cf1 Red text\cf0 and \ul underlined\ulnone.\par
Unicode: \u20320?\u22909?\par
}`,
    )
    expect(html).toContain('text-align:center')
    expect(html).toContain('font-weight:700')
    expect(html).toContain('font-style:italic')
    expect(html).toContain('text-decoration:underline')
    expect(html).toContain('color:#ff0000')
    expect(html).toContain('Calibri')
    expect(html).toContain('Hello')
    expect(html).toContain('Red text')
    expect(html).toContain('你好')
    expect(html.match(/rtf-paragraph/g)).toHaveLength(3)
  })

  it('skips destinations such as font tables and metadata', () => {
    const html = parseRtf(
      String.raw`{\rtf1{\fonttbl{\f0 Arial;}}{\info{\title Hidden title}}Visible \b bold\b0 text}`,
    )
    expect(html).toContain('Visible')
    expect(html).not.toContain('Hidden title')
    expect(html).not.toContain('f0 Arial')
  })

  it('escapes raw HTML characters', () => {
    const html = parseRtf(String.raw`{\rtf1 <script>alert(1)</script> & "quotes"}`)
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&amp;')
  })

  it('decodes code page escapes', () => {
    const html = parseRtf(String.raw`{\rtf1\ansicpg1252 caf\'e9}`)
    expect(html).toContain('café')
  })
})
