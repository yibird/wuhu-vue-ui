# @wuhu-vue-ui/context-menu

Imperative right-click menu with keyboard navigation and viewport clamping for Vue 3.

Wuhu Vue UI 组件库的一部分。

## 安装

```bash
pnpm add @wuhu-vue-ui/context-menu
# 或
npm install @wuhu-vue-ui/context-menu
```

## 使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ContextMenu } from '@wuhu-vue-ui/context-menu'
import type { ContextMenuExpose } from '@wuhu-vue-ui/context-menu'

const menu = ref<ContextMenuExpose>()
const items = [
  { key: 'edit', label: '编辑' },
  { key: 'delete', label: '删除', danger: true },
]
</script>

<template>
  <div @contextmenu.prevent="menu?.open($event)">右键打开菜单</div>
  <ContextMenu ref="menu" :items="items" @select="({ item }) => console.log(item.key)" />
</template>
```

浏览器入口会自动引入样式；也可以单独引入 `@wuhu-vue-ui/context-menu/style.css`。

完整文档与示例：[docs/components/context-menu.md](https://github.com/yibird/wuhu-vue-ui/blob/main/docs/components/context-menu.md)

## License

MIT
