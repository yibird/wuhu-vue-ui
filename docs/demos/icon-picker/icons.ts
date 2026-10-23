import { h } from 'vue'
import type { IconPickerGroup } from '@wuhu-vue-ui/icon-picker'

function glyph(path: string, rotation = 0) {
  return h('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' }, [
    h('path', {
      d: path,
      transform: rotation ? `rotate(${rotation} 12 12)` : undefined,
      stroke: 'currentColor',
      'stroke-width': 1.7,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  ])
}

const arrowPaths = [
  'M5 12h14M13 6l6 6-6 6',
  'M19 12H5M11 6l-6 6 6 6',
  'M12 5v14M6 13l6 6 6-6',
  'M12 19V5M6 11l6-6 6 6',
  'M6 9l6-6 6 6M6 15l6 6 6-6',
  'M6 15l6 6 6-6M6 9l6-6 6 6',
  'M4 12h4l3-7 3 14 3-7h3',
  'M5 7h14M5 17h14M9 3l-4 4 4 4M15 13l4 4-4 4',
  'M7 7l10 10M17 7 7 17',
  'M4 10h16M4 14h16M10 4v16M14 4v16',
  'M5 12a7 7 0 1 0 14 0M5 12H2M22 12h-3',
  'M12 4a8 8 0 1 0 0 16M12 4v16',
]

const interfacePaths = [
  'M4 4h16v16H4zM4 9h16M9 9v11',
  'M4 5h16v14H4zM8 9h8M8 13h5',
  'M5 5h14v14H5zM9 2v3M15 2v3M9 19v3M15 19v3',
  'M4 6h16M4 12h16M4 18h16',
  'M9 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM15 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  'M12 3v18M3 12h18M6 6l12 12M18 6 6 18',
  'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  'M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10',
  'M5 8h14M5 16h14M8 5v6M16 13v6',
  'M4 12h4l2-5 4 10 2-5h4',
  'M6 4h12v16H6zM9 8h6M9 12h6M9 16h4',
  'M12 4v6M12 14v6M4 12h6M14 12h6',
]

const mediaPaths = [
  'M8 5v14l11-7z',
  'M8 5v14M16 5v14',
  'M6 9v6h3l5 4V5l-5 4zM17 9a4 4 0 0 1 0 6',
  'M4 7h16v10H4zM9 7l3-3 3 3M8 12h.01M16 12h.01',
  'M4 6h16v12H4zM8 10l3 2-3 2zM16 10h2M16 14h2',
  'M5 5h14v14H5zM9 9l6 3-6 3z',
  'M4 18V8l4-3 4 3 4-3 4 3v10zM8 12h8',
  'M12 3v12M7 10l5 5 5-5M5 19h14',
  'M4 5h16v10H4zM8 19h8M12 15v4',
  'M6 4h12v16H6zM10 9l5 3-5 3z',
  'M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0zM10 9l5 3-5 3z',
  'M5 6h14v12H5zM5 9h14M9 6v12',
]

const filePaths = [
  'M6 3h8l4 4v14H6zM14 3v4h4',
  'M3 7h7l2 2h9v10H3z',
  'M4 6h16v12H4zM4 10h16',
  'M12 3v12M7 10l5 5 5-5M5 19h14',
  'M12 15V3M7 8l5-5 5 5M5 21h14',
  'M6 4h9l3 3v13H6zM9 9h6M9 13h6M9 17h4',
  'M4 4h7v16H4zM13 4h7v16h-7zM6 8h3M15 8h3',
  'M4 6h16v4H4zM6 10v8h12v-8M10 14h4',
  'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
  'M4 7l8-3 8 3v10l-8 3-8-3zM4 7l8 3 8-3M12 10v10',
  'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5',
  'M4 5h16v14H4zM8 9h8M8 13h5',
]

const chatPaths = [
  'M4 5h16v11H9l-5 4z',
  'M4 6h16v9H4zM4 19l4-4M8 10h8M8 13h5',
  'M3 6h16v8H8l-5 4zM19 8h2v8h-3',
  'M4 5h16v12H8l-4 3zM8 9h8M8 13h5',
  'M4 7h16v10H4zM4 7l8 6 8-6',
  'M12 3a6 6 0 0 0-6 6c0 4 6 11 6 11s6-7 6-11a6 6 0 0 0-6-6zM9 9h6M12 6v6',
  'M12 4a6 6 0 0 0-6 6v6l3-2h6a6 6 0 0 0 0-12z',
  'M5 4h14v12H9l-4 4zM8 8h8M8 12h5',
  'M4 5h16v13H4zM8 9h8M8 13h8M8 17h4',
  'M12 3a7 7 0 0 0-7 7c0 3 2 5 2 8h10c0-3 2-5 2-8a7 7 0 0 0-7-7zM9 21h6',
  'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  'M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5',
]

function group(key: string, label: string, prefix: string, paths: string[]): IconPickerGroup {
  // Four rotations per path keep the demo dataset large enough to exercise
  // virtual scrolling while still showing visually distinct glyphs.
  const rotations = [0, 90, 180, 270]

  return {
    key,
    label,
    items: paths.flatMap((path, pathIndex) =>
      rotations.map((rotation, variantIndex) => {
        const index = pathIndex * rotations.length + variantIndex
        return {
          key: `${key}-${index}`,
          label: `${prefix} ${index + 1}`,
          icon: glyph(path, rotation),
        }
      }),
    ),
  }
}

export const iconGroups: IconPickerGroup[] = [
  group('arrows', '箭头', 'Arrow', arrowPaths),
  group('interface', '界面', 'UI', interfacePaths),
  group('media', '媒体', 'Media', mediaPaths),
  group('files', '文件', 'File', filePaths),
  group('chat', '沟通', 'Chat', chatPaths),
]
