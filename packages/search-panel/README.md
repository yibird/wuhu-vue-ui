# @wuhu-vue-ui/search-panel

Modal search panel built on `CommandMenu` for Vue 3.

Wuhu Vue UI 组件库的一部分。

## 安装

```bash
pnpm add @wuhu-vue-ui/search-panel
# 或
npm install @wuhu-vue-ui/search-panel
```

## 使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SearchPanel } from '@wuhu-vue-ui/search-panel'

const open = ref(false)
const items = [
  { key: 'dashboard', label: '工作台', group: '导航' },
  { key: 'settings', label: '系统设置', group: '导航' },
]
</script>

<template>
  <button type="button" @click="open = true">搜索</button>
  <SearchPanel v-model:open="open" :items="items" shortcut="Mod+K" />
</template>
```

浏览器入口会自动引入样式；也可以单独引入 `@wuhu-vue-ui/search-panel/style.css`。

完整文档与示例：[docs/components/search-panel.md](https://github.com/yibird/wuhu-vue-ui/blob/main/docs/components/search-panel.md)

## License

MIT
