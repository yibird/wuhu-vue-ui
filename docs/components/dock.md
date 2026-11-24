# Dock 应用坞

macOS 风格的停靠导航：支持底部/顶部/左右四个方向，指针靠近时项目会按距离平滑放大。

<demo vue="../../playground/src/demos/dock-demo.vue" />

## 基础用法

`items` 描述所有项目，`icon` 可以是图片 URL 或图标组件。项目设置 `separator: true` 时会渲染为分隔线，`disabled: true` 会阻止激活与放大。

```vue
<script setup lang="ts">
import { Dock } from '@wuhu-vue-ui/dock'
import type { DockItem } from '@wuhu-vue-ui/dock'

const items: DockItem[] = [
  { label: '访达', icon: '/icons/finder.png', url: 'https://example.com' },
  { label: '浏览器', icon: BrowserIcon },
  { label: '分隔线', separator: true },
  { label: '设置', icon: SettingsIcon, command: () => openSettings() },
]
</script>

<template>
  <Dock :items="items" position="bottom" aria-label="应用导航" @select="onSelect" />
</template>
```

## 放大效果

指针在 Dock 内移动时，组件会读取每个项目的中心点，按距离使用 smoothstep 曲线衰减：距离越近放大越明显，最远不超过 `maxScale` 倍。缩放作用于整个 item 内容（背景与图标一起放大），但不会改变 Dock 的布局尺寸；`transform-origin` 始终朝向 Dock 外侧（底部 Dock 向下、顶部 Dock 向上、左右 Dock 分别向左右）。

Tooltip 会根据 `maxScale` 自动外移，避免遮挡放大后的 item。`disabled` 项与分隔线不参与放大。

以下情况会自动复位：

- 指针离开 Dock；
- 设置了 `magnification: false`。

## 定位

Dock 使用 `position: absolute` 贴靠最近的定位祖先：`bottom` / `top` 水平居中贴靠上下边缘，`left` / `right` 垂直居中贴靠左右边缘，贴边距离由 `--w-dock-offset` 控制（默认 `16px`）。

```vue
<div style="position: relative; height: 320px">
  <Dock :items="items" position="top" />
</div>
```

使用方只需为容器设置 `position: relative`，Dock 就会固定在容器顶部。若需要相对视口停靠，覆盖 `.w-dock { position: fixed }`，或让定位祖先铺满视口。

## 激活行为

点击时依次执行：

1. 若存在 `command`，调用 `command(item, event)`；
2. 否则若存在 `url`，通过 `window.open(url, target ?? '_self', 'noopener,noreferrer')` 跳转；
3. 最后触发 `select` 事件。

`disabled` 项不会执行命令、跳转或触发事件。

## API

### Props

| 属性            | 类型                                     | 默认值     | 说明                                            |
| --------------- | ---------------------------------------- | ---------- | ----------------------------------------------- |
| `items`         | `DockItem[]`                             | `[]`       | 项目列表                                        |
| `position`      | `'bottom' \| 'top' \| 'left' \| 'right'` | `'bottom'` | 停靠位置，决定贴边位置、排列方向与 Tooltip 方向 |
| `magnification` | `boolean`                                | `true`     | 是否启用指针放大                                |
| `baseSize`      | `number`                                 | `48`       | 每个项目的基准尺寸（px）                        |
| `maxScale`      | `number`                                 | `1.6`      | 放大后的最大缩放倍数                            |
| `gap`           | `number`                                 | `8`        | 项目间距（px）                                  |

### DockItem

| 字段        | 类型                      | 说明                                   |
| ----------- | ------------------------- | -------------------------------------- |
| `id`        | `string \| number`        | 稳定标识，用于 DOM 复用；缺省用索引    |
| `label`     | `string`                  | 名称，同时作为 `aria-label` 与 Tooltip |
| `icon`      | `string \| Component`     | 图片 URL 或图标组件                    |
| `url`       | `string`                  | 激活后跳转的地址                       |
| `target`    | `string`                  | 跳转目标，默认 `_self`                 |
| `disabled`  | `boolean`                 | 禁用项目                               |
| `separator` | `boolean`                 | 渲染为分隔线                           |
| `command`   | `(item, event) => void`   | 自定义激活回调，优先于 `url`           |
| `meta`      | `Record<string, unknown>` | 业务元数据，不影响组件行为             |

### Emits

| 事件     | 参数            | 说明             |
| -------- | --------------- | ---------------- |
| `select` | `(item, event)` | 项目被激活时触发 |

### Slots

| 插槽      | 参数                      | 说明                                                    |
| --------- | ------------------------- | ------------------------------------------------------- |
| `item`    | `{ item, index, active }` | 完全替换项目内容                                        |
| `icon`    | `{ item }`                | 替换图标区域                                            |
| `tooltip` | `{ item }`                | 替换 Tooltip 内容（Teleport 到 `body`），仅在悬浮时渲染 |

## 样式

### 类名

| 类名                                                    | 说明                       |
| ------------------------------------------------------- | -------------------------- |
| `.w-dock`                                               | 根容器                     |
| `.w-dock--bottom` / `--top` / `--left` / `--right`      | 停靠方向                   |
| `.w-dock__item`                                         | 项目                       |
| `.w-dock__item.is-active`                               | 悬浮中的项目               |
| `.w-dock__item.is-disabled`                             | 禁用项目                   |
| `.w-dock__inner`                                        | 项目内容容器，承载放大变换 |
| `.w-dock__icon`                                         | 图标容器                   |
| `.w-dock__image` / `.w-dock__svg` / `.w-dock__fallback` | 图片 / 组件图标 / 文字兜底 |
| `.w-dock__separator`                                    | 分隔线                     |

### CSS 变量

| 变量                 | 默认值          | 说明             |
| -------------------- | --------------- | ---------------- |
| `--w-dock-size`      | `48px`          | 项目尺寸         |
| `--w-dock-gap`       | `8px`           | 项目间距         |
| `--w-dock-offset`    | `16px`          | 与停靠边缘的距离 |
| `--w-dock-max-scale` | `maxScale` prop | 最大放大倍数     |

其余颜色、圆角与阴影均使用 `--w-*` 设计令牌，可通过主题覆盖。

## 与 PrimeVue v3 Dock 的差异

- 采用组件化 `items` 数组与 Vue 插槽，而不是 `MenuItem` 模板；图标支持图片 URL 或组件。
- 放大基于指针与项目中心的距离并使用 smoothstep 衰减，缩放整个 item 内容，不改变 Dock 的布局宽度；PrimeVue 通过相邻项目缩放实现类似的视觉位移。
- 激活顺序固定为 `command` → `url` → `select`，且 `disabled` 项不参与激活与放大。
- 增加了可访问名称与禁用态支持；不内置键盘导航。
- `position` 同时决定贴边位置、排列方向、放大原点与 Tooltip 方向；Dock 以内置的绝对定位贴靠最近的定位祖先，页面级固定停靠可通过覆盖 `position: fixed` 实现。
