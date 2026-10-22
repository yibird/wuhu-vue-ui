# Scrollbar 滚动容器

模拟原生滚动行为并自定义滚动条，支持纵向、横向与原生模式切换。

## 纵向滚动

默认仅在鼠标悬浮容器时显示自定义滚动条，移出容器后自动隐藏。

<demo vue="../demos/scrollbar/vertical.vue" />

## 始终显示

设置 `always` 后滚动条不再随鼠标悬浮状态隐藏，适合需要持续提示可滚动区域的场景。

<demo vue="../demos/scrollbar/always.vue" />

## 原生滚动

通过 `native` 切换为浏览器原生滚动条，行为与系统保持一致。

<demo vue="../demos/scrollbar/native.vue" />

## 横向滚动

内容宽度超出容器时自动出现横向滚动条，适合标签、流程与看板。

<demo vue="../demos/scrollbar/horizontal.vue" />

## 滚动到指定位置

通过实例方法 `scrollTo()` 传入 `ScrollToOptions` 可以平滑滚动到指定距离；`setScrollLeft()` 则用于无动画地直接跳转。

<demo vue="../demos/scrollbar/scroll-to.vue" />

## 自定义样式

通过 `--w-scrollbar-*` CSS 变量调整粗细与颜色，也可以直接覆盖 `.w-scrollbar__bar` 和 `.w-scrollbar__thumb`，实现轨道背景与渐变滑块。

<demo vue="../demos/scrollbar/custom-style.vue" />

## 在 Flex / Grid 布局中使用

不需要设置 `height`。组件根节点与滚动容器的默认样式都是 `height: 100%`，把 `flex: 1` 直接加在 `<Scrollbar>` 上即可填满剩余空间：

<demo vue="../demos/scrollbar/flex-grid.vue" />

- 父级必须有确定高度（`height`、`100vh` 或 grid 的 `1fr` 轨道），否则内容会把容器自然撑高，不会产生内部滚动。
- `flex: 1` 直接加在组件上时无需额外设置；如果再加一层包装 `div` 并把 `flex: 1` 加在包装层，需要同时给包装层设置 `min-height: 0`，否则其默认的自动最小高度会按内容撑开。
- 横向 flex 与 grid 布局同样适用。

## API

### Props

| 属性        | 类型                                           | 默认值  | 说明                                         |
| ----------- | ---------------------------------------------- | ------- | -------------------------------------------- |
| `height`    | `string \| number`                             | `''`    | 视口高度，数字按 px 处理                     |
| `maxHeight` | `string \| number`                             | `''`    | 视口最大高度，内容超出时才显示滚动条         |
| `native`    | `boolean`                                      | `false` | 使用浏览器原生滚动条                         |
| `always`    | `boolean`                                      | `false` | 始终显示自定义滚动条                         |
| `minSize`   | `number`                                       | `20`    | 滑块最小像素长度                             |
| `distance`  | `number`                                       | `0`     | 距边缘多少像素时触发 `end`                   |
| `noresize`  | `boolean`                                      | `false` | 关闭自动尺寸监听，仍可手动调用 `update()`    |
| `tag`       | `string`                                       | `'div'` | 内容容器标签                                 |
| `id`        | `string`                                       | —       | 内容容器 id                                  |
| `classes`   | `{ wrap?:string, view?:string }`               | —       | 语义化类名，分别作用于滚动容器与内容视图     |
| `styles`    | `{ wrap?:CssProperties, view?:CssProperties }` | —       | 语义化内联样式，分别作用于滚动容器与内容视图 |

### Emits

| 事件     | 参数                                        | 说明               |
| -------- | ------------------------------------------- | ------------------ |
| `scroll` | `{ scrollTop: number; scrollLeft: number }` | 滚动时触发         |
| `end`    | `'top' \| 'bottom' \| 'left' \| 'right'`    | 到达指定边缘时触发 |

### Slots

| 插槽      | 参数 | 说明     |
| --------- | ---- | -------- |
| `default` | —    | 滚动内容 |

### 实例方法

| 方法              | 类型                                                                      | 说明                   |
| ----------------- | ------------------------------------------------------------------------- | ---------------------- |
| `wrapRef`         | `Ref<HTMLDivElement \| undefined>`                                        | 可滚动容器元素引用     |
| `update()`        | `() => void`                                                              | 重新计算滑块尺寸与位置 |
| `scrollTo()`      | `(x: number, y?: number) => void` 或 `(options: ScrollToOptions) => void` | 滚动到指定坐标或配置   |
| `setScrollTop()`  | `(value: number) => void`                                                 | 设置纵向滚动位置       |
| `setScrollLeft()` | `(value: number) => void`                                                 | 设置横向滚动位置       |
| `handleScroll()`  | `() => void`                                                              | 同步滚动状态与滚动条   |

### CSS 变量

| 变量                          | 默认值                      | 说明           |
| ----------------------------- | --------------------------- | -------------- |
| `--w-scrollbar-size`          | `6px`                       | 滚动条粗细     |
| `--w-scrollbar-thumb`         | `rgba(100, 116, 139, 0.38)` | 滑块颜色       |
| `--w-scrollbar-thumb-hover`   | `rgba(100, 116, 139, 0.62)` | 滑块悬停颜色   |
| `--w-scrollbar-opacity`       | `0.3`                       | 滑块默认透明度 |
| `--w-scrollbar-hover-opacity` | `0.5`                       | 滑块悬停透明度 |

### 类名

| 类名                                 | 说明                                               |
| ------------------------------------ | -------------------------------------------------- |
| `.w-scrollbar`                       | 根元素                                             |
| `.w-scrollbar__wrap`                 | 可滚动容器                                         |
| `.w-scrollbar__wrap--hidden-default` | 非原生模式下隐藏系统滚动条                         |
| `.w-scrollbar__view`                 | 内容视图                                           |
| `.w-scrollbar__bar`                  | 滚动条轨道，配合 `.is-vertical` / `.is-horizontal` |
| `.w-scrollbar__thumb`                | 滑块                                               |
