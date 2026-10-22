import { describe, expect, it } from 'vite-plus/test'
import { parseSubtitles } from '../core/subtitle'

describe('subtitle parsing', () => {
  it('parses SRT cues', () => {
    const cues = parseSubtitles(
      '1\n00:00:01,000 --> 00:00:03,500\nHello\nworld\n\n2\n00:00:04,000 --> 00:00:05,000\n<i>Bye</i>',
      'srt',
    )
    expect(cues).toHaveLength(2)
    expect(cues[0]).toMatchObject({
      start: '00:00:01.000',
      end: '00:00:03.500',
      text: 'Hello\nworld',
    })
    expect(cues[1]?.text).toBe('Bye')
  })

  it('parses WebVTT without a cue identifier', () => {
    const cues = parseSubtitles(
      'WEBVTT\n\n00:00:01.000 --> 00:00:02.000 align:middle\nCaption',
      'vtt',
    )
    expect(cues).toHaveLength(1)
    expect(cues[0]?.text).toBe('Caption')
  })

  it('parses ASS dialogues', () => {
    const cues = parseSubtitles(
      '[Events]\nDialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,{\\b1}Hello{\\b0}, world',
      'ass',
    )
    expect(cues).toHaveLength(1)
    expect(cues[0]?.text).toBe('Hello, world')
  })

  it('parses LRC lyrics', () => {
    const cues = parseSubtitles('[00:01.00]First\n[00:05.50]Second', 'lrc')
    expect(cues).toHaveLength(2)
    expect(cues[0]?.text).toBe('First')
    expect(cues[0]?.start).toBe('00:01.000')
  })
})
