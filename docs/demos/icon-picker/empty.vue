<script setup lang="ts">
import { IconPicker } from '@wuhu-vue-ui/icon-picker'
import type { IconPickerGroup } from '@wuhu-vue-ui/icon-picker'

const emptyGroups: IconPickerGroup[] = [{ key: 'empty', label: '空分组', items: [] }]
</script>

<template>
  <div class="icon-picker-demo">
    <IconPicker :items="emptyGroups" :height="260">
      <template #empty="{ group }">
        <p class="hint">{{ group?.label ?? '当前图标库' }}暂无图标，请先配置 items。</p>
      </template>
    </IconPicker>
    <p class="icon-picker-demo__hint">
      空分组会保留在侧边栏并可选中；`empty` 插槽同时用于空分组与无搜索结果，可拿到 `{ group, query
      }`。
    </p>
  </div>
</template>
