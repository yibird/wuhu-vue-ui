# Sliding Highlight 滑块高亮

高亮块会跟随鼠标悬浮的**直接子元素**平滑移动。子项结构完全由默认插槽决定，组件只负责测量与动画。

## 横向导航

通过 `as="ul"` 保持列表语义，高亮层会渲染为 `li`。配合 `highlight()` 可以在键盘聚焦时同步高亮。

<demo vue="../demos/sliding-highlight/line.vue" />

> 高亮层渲染在子项内容下方，因此子项需要保持透明背景，文字与图标才能显示在高亮层之上。若使用第三方按钮（如 antdv 的 text button），需要关闭其 hover / active 背景色，否则会覆盖高亮块。

## 卡片网格

任意直接子元素都可以作为高亮目标，`inset` 控制滑块相对子项的外扩距离。

> `inset` 为正值时高亮块会向左右外扩。容器需要预留不小于 `inset` 的 `padding`，否则首 / 末项的高亮会贴边或溢出；希望高亮与子项等宽时设置 `inset="0"`。

<demo vue="../demos/sliding-highlight/pill.vue" />

## 纵向列表

排列方向由外部布局决定，滑块会自动适配每个子项的实际尺寸。

<demo vue="../demos/sliding-highlight/vertical.vue" />

## 语义化类名与样式

`classes` 与 `styles` 仅包含 `container`（定位层）和 `pill`（高亮块）两个部件，不依赖组件内部类名：

```vue
<SlidingHighlight
  :classes="{ pill: 'my-pill' }"
  :styles="{ container: { borderRadius: '8px' }, pill: { opacity: 0.9 } }"
>
  <!-- 子项 -->
</SlidingHighlight>
```

## API

### Props

| 属性      | 类型                      | 默认值  | 说明                                    |
| --------- | ------------------------- | ------- | --------------------------------------- |
| `as`      | `'div' \| 'ul'`           | `'div'` | 根元素标签；为 `ul` 时高亮层渲染为 `li` |
| `inset`   | `number`                  | `20`    | 高亮块相对子项的横向外扩距离（px）      |
| `classes` | `SlidingHighlightClasses` | —       | 语义化类名：`container`、`pill`         |
| `styles`  | `SlidingHighlightStyles`  | —       | 语义化内联样式：`container`、`pill`     |

### Emits

无。

### Slots

| 插槽      | 参数 | 说明                                         |
| --------- | ---- | -------------------------------------------- |
| `default` | —    | 列表内容；指针悬浮其直接子项时高亮块跟随移动 |

### 实例方法

| 方法                 | 类型                             | 说明                                   |
| -------------------- | -------------------------------- | -------------------------------------- |
| `highlight(element)` | `(element: HTMLElement) => void` | 高亮指定元素，用于键盘导航等非指针场景 |
| `clear()`            | `() => void`                     | 清除当前高亮                           |

### CSS 变量

| 变量                           | 默认值                                                      | 说明         |
| ------------------------------ | ----------------------------------------------------------- | ------------ |
| `--w-sliding-highlight-bg`     | `rgba(79, 70, 229, .16)`（暗色 `rgba(148, 163, 184, .18)`） | 高亮块背景色 |
| `--w-sliding-highlight-radius` | `8px`                                                       | 高亮块圆角   |

### 类名

| 类名                                                                                | 说明                                               |
| ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| `.w-sliding-highlight`                                                              | 根元素，`position: relative`、`isolation: isolate` |
| `.w-sliding-highlight__container`                                                   | 绝对定位的移动容器                                 |
| `.w-sliding-highlight__pill`                                                        | 高亮块本身                                         |
| `.w-sliding-highlight-enter-from` / `-enter-active` / `-leave-to` / `-leave-active` | 进出场过渡类                                       |
