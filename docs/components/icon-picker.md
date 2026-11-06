# Icon Picker 图标选择器

分组、可搜索、虚拟滚动的图标选择器，支持 CSS 类名与 Vue 虚拟节点两种图标数据。

## 基础用法

传入 `items` 与 `v-model` 即可使用。侧边栏按分组过滤，搜索基于图标 `label`，列表使用 `@tanstack/vue-virtual` 虚拟滚动。

<demo vue="../demos/icon-picker/basic.vue" />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { IconPicker } from '@wuhu-vue-ui/icon-picker'
import type { IconPickerGroup } from '@wuhu-vue-ui/icon-picker'

const iconGroups: IconPickerGroup[] = [
  {
    key: 'arrows',
    label: '箭头',
    items: [
      { key: 'arrow-left', label: 'Arrow Left', icon: 'iconfont icon-arrow-left' },
      { key: 'arrow-right', label: 'Arrow Right', icon: h(ArrowRightIcon) },
    ],
  },
]

const selected = ref<string | null>(null)
</script>

<template>
  <IconPicker v-model="selected" :items="iconGroups" />
</template>
```

`items[].icon` 支持：

- `string`：作为 `<i>` 的 class 渲染，适合图标字体或 iconfont；
- `VNode`：通过 `h(Component)` / `h('svg', ...)` 创建，组件或原生 SVG 均可。

## 类名图标

字符串图标会渲染为 `<i class="...">`，可直接复用现有图标字体或原子化图标类名。

<demo vue="../demos/icon-picker/class-names.vue" />

## 隐藏搜索

`showSearch` 默认为 `true`，设为 `false` 后隐藏搜索框与工具栏。

<demo vue="../demos/icon-picker/no-search.vue" />

## 空分组与空状态

`items` 中的空分组会被自动隐藏；当没有任何可选项时，默认展示 `emptyText`，也可以通过 `empty` 插槽自定义空状态。

<demo vue="../demos/icon-picker/empty.vue" />

## 虚拟列表

组件基于 `@tanstack/vue-virtual` 只渲染可视区域附近的行：

- 列数由容器宽度与 `itemMinWidth` 自动计算，也可通过 `columns` 固定；
- `itemHeight` 控制单元格高度，`overscan` 控制上下额外渲染的行数；
- 切换分组或搜索条件时会自动滚回顶部；
- 行内容使用绝对定位的 `translateY` 渲染，不会一次性挂载全部图标；
- 图标支持 roving tabindex：`Tab` 进入列表后可用方向键移动焦点，`Home` / `End` 跳到首尾，焦点移动到未渲染区域时会自动滚动。

## API

### Props

| 属性           | 类型                | 默认值             | 说明                                     |
| -------------- | ------------------- | ------------------ | ---------------------------------------- |
| `items`        | `IconPickerGroup[]` | —（必填）          | 分组图标数据，空分组自动隐藏             |
| `modelValue`   | `string \| null`    | —                  | 选中图标 key，支持 `v-model`             |
| `showSearch`   | `boolean`           | `true`             | 是否显示搜索框                           |
| `placeholder`  | `string`            | `'搜索图标'`       | 搜索框占位文本与无障碍名称               |
| `emptyText`    | `string`            | `'没有匹配的图标'` | 空结果文本                               |
| `allLabel`     | `string`            | `'全部图标'`       | 侧边栏「全部图标」文案                   |
| `groupsLabel`  | `string`            | `'按用途浏览'`     | 侧边栏分组区域标题                       |
| `libraryLabel` | `string`            | `'图标库'`         | 侧边栏标题                               |
| `countLabel`   | `(count) => string` | `n 个`             | 主区域结果数量文案                       |
| `ariaLabel`    | `string`            | `'图标选择器'`     | 根元素无障碍名称                         |
| `columns`      | `number`            | —                  | 固定列数；未传时按 `itemMinWidth` 自适应 |
| `itemMinWidth` | `number`            | `72`               | 自动计算列数时的最小单元格宽度           |
| `itemHeight`   | `number`            | `72`               | 单元格高度（px）                         |
| `height`       | `string \| number`  | `420`              | 容器高度，数字按 px 处理                 |
| `overscan`     | `number`            | `4`                | 虚拟列表上下额外渲染的行数               |
| `disabled`     | `boolean`           | `false`            | 禁用选择                                 |

### IconPickerGroup

| 字段    | 类型               | 说明                   |
| ------- | ------------------ | ---------------------- |
| `key`   | `string`           | 分组唯一 key           |
| `label` | `string`           | 分组名称，显示在侧边栏 |
| `items` | `IconPickerItem[]` | 该分组下的图标         |

### IconPickerItem

| 字段    | 类型              | 说明                             |
| ------- | ----------------- | -------------------------------- |
| `key`   | `string`          | 全局唯一图标 key                 |
| `label` | `string`          | 图标名称，同时用于搜索与悬浮提示 |
| `icon`  | `string \| VNode` | CSS 类名或 Vue 虚拟节点          |

### Emits

| 事件                | 参数                                           | 说明         |
| ------------------- | ---------------------------------------------- | ------------ |
| `update:modelValue` | `key: string \| null`                          | 选中图标变化 |
| `select`            | `item: IconPickerItem, group: IconPickerGroup` | 选中某个图标 |

### Slots

| 插槽    | 参数 | 说明         |
| ------- | ---- | ------------ |
| `empty` | —    | 自定义空结果 |

### 类名

| 类名                                               | 说明                     |
| -------------------------------------------------- | ------------------------ |
| `.w-icon-picker`                                   | 根容器                   |
| `.w-icon-picker__search` / `__search-clear`        | 搜索框与清除搜索按钮     |
| `.w-icon-picker__sidebar` / `__groups` / `__group` | 侧边栏、分组容器与分组项 |
| `.w-icon-picker__head`                             | 右侧列表标题             |
| `.w-icon-picker__scroll` / `__row` / `__item`      | 虚拟滚动容器、行与单元格 |
| `.w-icon-picker__glyph` / `__label`                | 图标与标签               |
| `.w-icon-picker__empty`                            | 空状态                   |

### CSS 变量

| 变量                          | 默认值                     | 说明       |
| ----------------------------- | -------------------------- | ---------- |
| `--w-icon-picker-height`      | `420px`                    | 容器高度   |
| `--w-icon-picker-radius`      | `var(--w-radius-lg, 12px)` | 容器圆角   |
| `--w-icon-picker-item-radius` | `var(--w-radius-md, 8px)`  | 单元格圆角 |
| `--w-icon-picker-gap`         | `6px`                      | 单元格间距 |
