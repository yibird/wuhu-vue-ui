<script setup lang="ts">
import { ref } from 'vue'
import { IconPicker } from '@wuhu-ui/icon-picker'
import type { IconPickerGroup } from '@wuhu-ui/icon-picker'

const groups: IconPickerGroup[] = [
  {
    key: 'glyph',
    label: '类名图标',
    items: [
      { key: 'home', label: '首页', icon: 'demo-glyph demo-glyph--home' },
      { key: 'grid', label: '应用', icon: 'demo-glyph demo-glyph--grid' },
      { key: 'star', label: '收藏', icon: 'demo-glyph demo-glyph--star' },
      { key: 'bell', label: '通知', icon: 'demo-glyph demo-glyph--bell' },
      { key: 'gear', label: '设置', icon: 'demo-glyph demo-glyph--gear' },
      { key: 'search', label: '搜索', icon: 'demo-glyph demo-glyph--search' },
    ],
  },
]

const selected = ref<string | null>('star')
</script>

<template>
  <div class="icon-picker-demo">
    <IconPicker v-model="selected" :items="groups" :height="260" aria-label="类名图标选择" />
    <p class="icon-picker-demo__hint">
      传入字符串时渲染为 <code>&lt;i class="..."&gt;</code>，可直接复用项目现有的图标字体类名。
    </p>
  </div>
</template>

<style lang="less">
.icon-picker-demo__hint {
  margin: 0;
  color: var(--w-color-text-tertiary);
  font-size: var(--w-font-size-xs);
  line-height: 1.6;

  code {
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--w-color-surface-subtle);
    font-family: var(--w-font-family-mono);
    font-size: 10px;
  }
}

.demo-glyph {
  font-style: normal;
  font-size: 20px;
  line-height: 1;
}

.demo-glyph--home::before {
  content: '⌂';
}

.demo-glyph--grid::before {
  content: '▦';
}

.demo-glyph--star::before {
  content: '☆';
}

.demo-glyph--bell::before {
  content: '◔';
}

.demo-glyph--gear::before {
  content: '⚙';
}

.demo-glyph--search::before {
  content: '⌕';
}
</style>
