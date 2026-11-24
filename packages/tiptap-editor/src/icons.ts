export type ToolbarIconName =
  | 'undo'
  | 'redo'
  | 'font'
  | 'bullet-list'
  | 'ordered-list'
  | 'task-list'
  | 'code-block'
  | 'link'
  | 'image'
  | 'table'
  | 'highlight'
  | 'horizontal-rule'
  | 'emoji'
  | 'indent'
  | 'outdent'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'fullscreen'
  | 'fullscreen-exit'
  | 'preview'
  | 'clear-formatting'
  | 'format-painter'
  | 'video'
  | 'attachment'
  | 'print'

export const TOOLBAR_ICON_PATHS: Record<ToolbarIconName, string[]> = {
  undo: ['M3 7v6h6', 'M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13'],
  redo: ['M21 7v6h-6', 'M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13'],
  font: ['M4 7V4h16v3', 'M9 20h6', 'M12 4v16'],
  'bullet-list': ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  'ordered-list': [
    'M10 6h11',
    'M10 12h11',
    'M10 18h11',
    'M4 6h1v4',
    'M4 10h2',
    'M6 18H4c0-1 2-2 2-3s-1-1.5-2-1',
  ],
  'task-list': ['m9 11 3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  'code-block': [
    'M10 9l-3 3 3 3',
    'M14 9l3 3-3 3',
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
  ],
  link: [
    'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
    'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  ],
  image: [
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    'm3 16 5-5 5 5 3-3 5 5',
    'M8.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  ],
  table: [
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    'M3 9h18',
    'M3 15h18',
    'M12 3v18',
  ],
  highlight: ['m9 11-6 6v3h9l3-3', 'm22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4'],
  'horizontal-rule': ['M5 12h14'],
  emoji: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    'M8.5 14a4 4 0 0 0 7 0',
    'M9 9h.01',
    'M15 9h.01',
  ],
  indent: ['M3 6h18', 'M3 12h10', 'M3 18h18', 'm17 9 3 3-3 3'],
  outdent: ['M3 6h18', 'M11 12h10', 'M3 18h18', 'm7 9-3 3 3 3'],
  'align-left': ['M21 6H3', 'M15 12H3', 'M17 18H3'],
  'align-center': ['M21 6H3', 'M17 12H7', 'M19 18H5'],
  'align-right': ['M21 6H3', 'M21 12H9', 'M21 18H7'],
  fullscreen: [
    'M8 3H5a2 2 0 0 0-2 2v3',
    'M21 8V5a2 2 0 0 0-2-2h-3',
    'M3 16v3a2 2 0 0 0 2 2h3',
    'M16 21h3a2 2 0 0 0 2-2v-3',
  ],
  'fullscreen-exit': [
    'M8 3v3a2 2 0 0 1-2 2H3',
    'M21 8h-3a2 2 0 0 1-2-2V3',
    'M3 16h3a2 2 0 0 1 2 2v3',
    'M16 21v-3a2 2 0 0 1 2-2h3',
  ],
  preview: [
    'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ],
  'clear-formatting': ['M4 7V4h16v3', 'M5 20h6', 'M13 4 8 20', 'm15 15 6 6', 'm21 15-6 6'],
  'format-painter': ['m14 3 7 7-9 9H5v-7l9-9Z', 'm12 5 7 7', 'M3 21h18'],
  video: [
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    'm10 9 5 3-5 3V9z',
  ],
  attachment: [
    'm21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
  ],
  print: [
    'M6 9V2h12v7',
    'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2',
    'M6 14h12v8H6z',
  ],
}
