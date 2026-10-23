<script setup lang="ts">
import { h, ref } from 'vue'
import { IconPicker } from '@wuhu-vue-ui/icon-picker'
import type { IconPickerGroup, IconPickerItem } from '@wuhu-vue-ui/icon-picker'
import DemoCard from '../components/demo-card.vue'

function glyph(path: string) {
  return h('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' }, [
    h('path', {
      d: path,
      stroke: 'currentColor',
      'stroke-width': 1.7,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  ])
}

const paths = [
  'M5 12h14M13 6l6 6-6 6',
  'M19 12H5M11 6l-6 6 6 6',
  'M12 5v14M6 13l6 6 6-6',
  'M12 19V5M6 11l6-6 6 6',
  'M4 6h16M4 12h16M4 18h16',
  'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  'M8 5v14l11-7z',
  'M6 9v6h3l5 4V5l-5 4z',
  'M4 5h16v10H4zM8 19h8M12 15v4',
  'M6 3h8l4 4v14H6zM14 3v4h4',
  'M3 7h7l2 2h9v10H3z',
  'M4 5h16v11H9l-5 4z',
  'M4 7h16v10H4zM4 7l8 6 8-6',
]

const iconGroups: IconPickerGroup[] = [
  {
    key: 'common',
    label: '常用',
    items: paths.slice(0, 7).map((path, index) => ({
      key: `common-${index}`,
      label: `Common ${index + 1}`,
      icon: glyph(path),
    })),
  },
  {
    key: 'media',
    label: '媒体',
    items: paths.slice(7, 10).map((path, index) => ({
      key: `media-${index}`,
      label: `Media ${index + 1}`,
      icon: glyph(path),
    })),
  },
  {
    key: 'files',
    label: '文件',
    items: paths.slice(10).map((path, index) => ({
      key: `file-${index}`,
      label: `File ${index + 1}`,
      icon: glyph(path),
    })),
  },
]

const emptyGroups: IconPickerGroup[] = [{ key: 'empty', label: '空分组', items: [] }]

const selected = ref<string | null>(null)
const lastSelected = ref<IconPickerItem | null>(null)

function handleSelect(item: IconPickerItem) {
  lastSelected.value = item
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="图标选择器"
      description="分组、搜索与虚拟滚动；icon 支持类名或 Vue 虚拟节点。"
      wide
    >
      <IconPicker
        v-model="selected"
        :items="iconGroups"
        aria-label="图标选择"
        @select="handleSelect"
      />
      <p class="hint">
        当前：{{ selected ?? '（未选择）' }} · 最近选择：{{ lastSelected?.label ?? '（无）' }}
      </p>
    </DemoCard>

    <DemoCard title="隐藏搜索" description="showSearch=false 时隐藏顶部工具栏。">
      <IconPicker
        v-model="selected"
        :items="iconGroups"
        :show-search="false"
        :height="280"
        aria-label="无搜索图标选择"
      />
    </DemoCard>

    <DemoCard
      title="空分组与空状态"
      description="items 中的空分组会自动隐藏；没有可选项时展示 empty 插槽。"
      wide
    >
      <IconPicker :items="emptyGroups" :height="240" aria-label="空分组图标选择">
        <template #empty>
          <p class="hint">该分组暂无图标，请先配置 items。</p>
        </template>
      </IconPicker>
    </DemoCard>
  </div>
</template>
