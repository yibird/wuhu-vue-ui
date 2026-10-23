# Icon 图标

轻量级内联 SVG 图标组件，内置一组 Lucide 路径，支持 Iconify 风格名称与自定义注册。

## 基础用法

```vue
<script setup lang="ts">
import { Icon } from '@wuhu-vue-ui/icon'
</script>

<template>
  <Icon name="i-lucide:chevron-up" :size="16" />
</template>
```

<demo vue="../demos/icon/basic.vue" />

## 名称格式

以下写法等价：

```ts
'chevron-up'
'lucide:chevron-up'
'i-lucide:chevron-up'
```

未知图标会渲染为空 SVG，不会抛错。

## 自定义图标

```ts
import { registerIcon } from '@wuhu-vue-ui/icon'

registerIcon(
  'custom-star',
  'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z',
)
```

也可以传入多个 path：

```ts
registerIcon('custom-icon', ['M4 4h16', 'M4 12h16', 'M4 20h16'])
```

## API

### Props

| 属性          | 类型               | 默认值         | 说明                             |
| ------------- | ------------------ | -------------- | -------------------------------- |
| `name`        | `string`           | —（必填）      | 图标名称，支持 `i-lucide:*` 格式 |
| `size`        | `string \| number` | `16`           | 尺寸，数字按像素处理             |
| `color`       | `string`           | `currentColor` | 描边颜色                         |
| `strokeWidth` | `number`           | `2`            | SVG 描边宽度                     |
| `label`       | `string`           | —              | 无障碍名称；省略时对辅助技术隐藏 |
| `spin`        | `boolean`          | `false`        | 持续旋转                         |

### 方法

| 方法                        | 说明                       |
| --------------------------- | -------------------------- |
| `registerIcon(name, paths)` | 注册或覆盖图标路径         |
| `resolveIcon(name)`         | 解析名称对应的 path 数组   |
| `normalizeIconName(name)`   | 规范化 `i-lucide:*` 等名称 |
