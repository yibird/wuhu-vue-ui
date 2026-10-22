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

## 注意

- `Time` 的格式化长度属性名为 `formatStyle`（`long` / `short` / `narrow`），因此 `style` 可以正常用于内联样式。
- `ResizeContainer` 会单独管理传给根节点的内联样式，以保证浏览器原生 resize 写入的尺寸不被重渲染覆盖；`class` / `style` 的响应式更新仍然正常工作。
- `MotionGroup` 会把 `class` / `style` 合并到 `TransitionGroup` 渲染出的根元素上。
