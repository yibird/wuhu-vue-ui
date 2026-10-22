export const fileSamples = [
  { id: 'sample.docx', label: 'Word', extension: 'DOCX' },
  { id: 'sample.rtf', label: 'Rich Text', extension: 'RTF' },
  { id: 'sample.xlsx', label: 'Excel', extension: 'XLSX' },
  { id: 'sample.pptx', label: 'PowerPoint', extension: 'PPTX' },
  { id: 'sample.pdf', label: 'PDF', extension: 'PDF' },
  { id: 'sample.epub', label: 'EPUB', extension: 'EPUB' },
  { id: 'sample.zip', label: 'Archive', extension: 'ZIP' },
  { id: 'readme.md', label: 'Markdown', extension: 'MD' },
  { id: 'code.ts', label: 'TypeScript', extension: 'TS' },
  { id: 'data.json', label: 'JSON', extension: 'JSON' },
  { id: 'table.csv', label: 'CSV', extension: 'CSV' },
  { id: 'diagram.svg', label: 'SVG', extension: 'SVG' },
  { id: 'page.html', label: 'HTML', extension: 'HTML' },
  { id: 'captions.srt', label: 'Subtitles', extension: 'SRT' },
  { id: 'sample.wav', label: 'Audio', extension: 'WAV' },
] as const

export type FileSampleId = (typeof fileSamples)[number]['id']
