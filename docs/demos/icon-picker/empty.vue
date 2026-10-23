<script setup lang="ts">
import { IconPicker } from '@wuhu-vue-ui/icon-picker'
import type { IconPickerGroup } from '@wuhu-vue-ui/icon-picker'

const emptyGroups: IconPickerGroup[] = [{ key: 'empty', label: '空分组', items: [] }]
</script>

<template>
  <div class="icon-picker-demo">
    <IconPicker :items="emptyGroups" :height="260" aria-label="空分组图标选择">
      <template #empty>
        <p class="hint">该分组暂无图标，请先配置 items。</p>
      </template>
    </IconPicker>
    <p class="icon-picker-demo__hint">
      `items` 中的空分组会自动从侧边栏隐藏；当没有任何可选项时，可通过 `empty`
      插槽替换默认的空状态文本。
    </p>
  </div>
</template>
