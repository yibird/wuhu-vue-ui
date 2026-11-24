# @wuhu-vue-ui/tooltip

Accessible hover and focus tooltip component and directive for Vue 3.

Wuhu Vue UI 组件库的一部分。

## 安装

```bash
pnpm add @wuhu-vue-ui/tooltip
# 或
npm install @wuhu-vue-ui/tooltip
```

## 使用

组件：

```vue
<script setup lang="ts">
import { Tooltip } from '@wuhu-vue-ui/tooltip'
</script>

<template>
  <Tooltip content="复制链接" placement="top">
    <button type="button" aria-label="复制链接">复制</button>
  </Tooltip>
</template>
```

指令：

```vue
<script setup lang="ts">
import { vTooltip } from '@wuhu-vue-ui/tooltip'
</script>

<template>
  <button type="button" aria-label="复制链接" v-tooltip="'复制链接'">复制</button>
</template>
```

浏览器入口会自动引入样式；也可以单独引入 `@wuhu-vue-ui/tooltip/style.css`。

完整文档与示例：[docs/components/tooltip.md](https://github.com/yibird/wuhu-vue-ui/blob/main/docs/components/tooltip.md)

## License

MIT
