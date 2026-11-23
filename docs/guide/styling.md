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

每个组件包在自己的根节点上声明一套完整的 `--w-<component>-*` 令牌，值是字面量并附带暗色版本，不读取应用或其他包的变量，因此可以单独引入使用：

```css
.w-icon-picker {
  --w-icon-picker-radius: 12px;
  --w-icon-picker-color-primary: #4f46e5;
}
```

需要定制时覆盖对应组件的令牌即可，例如 `--w-scrollbar-size`、`--w-sliding-highlight-bg`、`--w-file-viewer-primary`。令牌名沿用原主题令牌的后缀（`--w-color-primary` → `--w-<component>-color-primary`），升级时不依赖内部类名，也不会影响其他组件。

## 令牌分层

- **组件令牌**：`--w-<component>-*`。每个包在根节点声明自己读取的全部令牌（颜色、字体、圆角、阴影、动效、焦点环、滚动条等），值都是字面量，包与包之间零依赖。
- **暗色**：组件自带 `[data-w-theme='dark']` 与 `prefers-color-scheme: dark` 两套值，不需要应用注入主题。
- **定制**：覆盖组件前缀令牌即可；全局的 `:root` 主题变量不会再影响组件。

```css
/* 只调整 Copy 的动效与焦点环，不影响其他包 */
.w-copy {
  --w-copy-duration-press: 60ms;
  --w-copy-duration-fast: 100ms;
  --w-copy-focus-ring-width: 2px;
  --w-copy-focus-ring-offset: 2px;
}
```

支持动效的组件会尊重 `prefers-reduced-motion: reduce`：Loading、Gradient Text、Motion Group 等组件在系统开启“减少动态效果”时会关闭循环或位移动画，只保留静态形态。

## 注意

- `Time` 的格式化长度属性名为 `formatStyle`（`long` / `short` / `narrow`），因此 `style` 可以正常用于内联样式。
- `ResizeContainer` 会单独管理传给根节点的内联样式，以保证浏览器原生 resize 写入的尺寸不被重渲染覆盖；`class` / `style` 的响应式更新仍然正常工作。
- `MotionGroup` 会把 `class` / `style` 合并到 `TransitionGroup` 渲染出的根元素上。
