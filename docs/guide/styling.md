# 样式与 class 定制

所有组件都支持标准的 `class` 与 `style` 属性。它们会与组件内部的语义类名、样式合并后应用到组件的语义根节点，不会覆盖或丢弃任何一方。

```vue
<Copy class="toolbar-copy" style="margin-left: 8px" text="hello" />
```

渲染结果中同时保留组件自身的 `w-copy` 与传入的 `toolbar-copy`：

```html
<button class="w-copy toolbar-copy" style="margin-left: 8px">…</button>
```

## 动态根标签

支持 `tag` 属性的组件（`Scrollbar`、`Time`、`LazyContainer`、`ResizeContainer`、`ErrorBoundary`、`GradientText`）会把 `class` / `style` 应用到 `tag` 实际渲染出的元素上：

```vue
<Time
  tag="span"
  class="created-at"
  style="color: var(--w-color-text-secondary)"
  :time="createdAt"
/>
```

## 语义化类名

组件内部类名使用 BEM 风格的稳定命名，可以直接用于全局样式覆盖：

- 根节点：`w-<component>`
- 子元素：`w-<component>__<element>`
- 状态或变体：`is-*`、`w-<component>--<modifier>`

例如 `w-copy`、`w-copy__spinner`、`w-command-menu__search`、`w-motion-group--slide`。

## CSS 变量

组件优先通过 CSS 自定义属性定制视觉。设计令牌使用 `--w-*` 命名空间，并支持在任意祖先节点覆盖：

```css
:root {
  --w-color-primary: #16a34a;
  --w-radius-md: 10px;
}
```

组件级变量同样可用，例如 `--w-scrollbar-size`、`--w-sliding-highlight-bg`、`--w-file-viewer-primary`。这种方式不依赖内部类名，升级时更稳定。

## 令牌分层

- **主题令牌**：`--w-color-*`、`--w-font-*`、`--w-radius-*`、`--w-shadow-*`、`--w-duration-*`、`--w-easing-*`，由应用统一提供。
- **交互令牌**：`--w-focus-ring-width` / `--w-focus-ring-color` / `--w-focus-ring-offset` 控制焦点环；`--w-duration-press` 控制按压反馈时长；`--w-easing-out` 用于进场与展开。
- **组件令牌**：`--w-<component>-*`，只声明在组件根节点，不会影响其他包。

```css
:root {
  /* 更克制的动效 */
  --w-duration-press: 60ms;
  --w-duration-fast: 100ms;
  /* 统一的焦点环 */
  --w-focus-ring-width: 2px;
  --w-focus-ring-offset: 2px;
  /* 浮层高度 */
  --w-shadow-overlay: 0 24px 56px -20px rgba(15, 23, 42, 0.28);
}
```

所有动效组件都尊重 `prefers-reduced-motion: reduce`，在系统开启“减少动态效果”时会关闭位移与循环动画。

## 注意

- `Time` 的格式化长度属性名为 `formatStyle`（`long` / `short` / `narrow`），因此 `style` 可以正常用于内联样式。
- `ResizeContainer` 会单独管理传给根节点的内联样式，以保证浏览器原生 resize 写入的尺寸不被重渲染覆盖；`class` / `style` 的响应式更新仍然正常工作。
- `MotionGroup` 会把 `class` / `style` 合并到 `TransitionGroup` 渲染出的根元素上。
