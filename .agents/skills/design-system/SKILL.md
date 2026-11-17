---
name: design-system
description: Wuhu Vue UI 的设计系统与样式规范。使用设计令牌、编写 Less 样式、适配亮/暗主题、处理动效与可访问性配色时使用。
---

# 设计系统与样式规范（Wuhu Vue UI）

## 何时使用

- 新增组件样式或调整现有视觉
- 需要选择颜色、字号、间距、圆角、阴影、动效时长
- 处理亮色/暗色主题、对比度、焦点态、禁用态
- 新增或修改设计令牌

## 核心原则

1. **一切视觉值走令牌**：颜色、字体、字号、圆角、阴影、时长、缓动、层级全部使用 `--w-*` CSS 变量。
2. **令牌必须有 fallback**：`var(--w-color-primary, #4f46e5)`，保证组件在未加载主题文件时仍可独立使用。
3. **不硬编码颜色**：唯一例外是 token 定义本身和 `fallback`。
4. **组件私有变量用 `--w-<component>-*`**，例如 `--w-command-menu-active-bg`。
5. **组件包不声明全局主题**：不写 `:root` / 裸 `[data-w-theme]` 主题块。组件只读取应用提供的共享令牌，并用 fallback 保证独立可用；组件私有令牌（`--w-<component>-*`）声明在组件根选择器上，暗色变体同样限定在组件根。共享主题的唯一来源是 `playground/src/tokens.less` 的 `.w-light-tokens()` / `.w-dark-tokens()` mixin。
6. **elevated 表面上的 hover 用前景色状态层**：`color-mix(in srgb, var(--w-color-text) 6%, var(--w-color-surface-elevated))`。不要用 `--w-color-surface-hover` 叠在 elevated 面板上——暗色下它会比面板更暗。

## 令牌速查

来源：各组件包的 `src/style/token.less`；完整亮暗参考在 `playground/src/tokens.less` 与 `docs/.vitepress/theme/tokens.less`。

| 分组   | 主要令牌                                                                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 品牌色 | `--w-color-primary` / `-hover` / `-active` / `-soft`                                                                                            |
| 语义色 | `--w-color-success` `--w-color-warning` `--w-color-danger` `--w-color-info`（均含 `-soft`）                                                     |
| 文本   | `--w-color-text` `--w-color-text-secondary` `--w-color-text-tertiary` `--w-color-text-inverse`                                                  |
| 表面   | `--w-color-bg` `--w-color-surface` `--w-color-surface-elevated` `--w-color-surface-subtle` `--w-color-surface-hover` `--w-color-surface-active` |
| 边框   | `--w-color-border` `--w-color-border-strong` `--w-color-border-subtle`                                                                          |
| 字体   | `--w-font-family` `--w-font-family-mono`                                                                                                        |
| 字号   | `--w-font-size-3xs` ~ `--w-font-size-2xl`、`--w-font-weight-*`、`--w-line-height-*`                                                             |
| 圆角   | `--w-radius-xs` / `-sm` / `-md` / `-lg` / `-xl` / `-full`                                                                                       |
| 阴影   | `--w-shadow-xs` / `-sm` / `-md` / `-lg` / `-hover` / `-overlay`                                                                                 |
| 动效   | `--w-duration-press` / `-fast` / `-normal` / `-slow`、`--w-easing-standard` / `-out` / `-emphasized`                                            |
| 焦点   | `--w-focus-ring-width` / `--w-focus-ring-color` / `--w-focus-ring-offset` / `--w-focus-ring-shadow`                                             |
| 层级   | `--w-z-sticky` / `--w-z-dropdown` / `--w-z-overlay` / `--w-z-toast`                                                                             |

先读当前组件包的 `src/style/token.less` 确认实际存在的令牌；新增跨组件令牌时，同步到所有使用它的包，不要凭空创造。

## 样式文件组织

```text
packages/<name>/src/style/index.less   # 组件样式（唯一样式入口）
packages/<name>/src/style/token.less   # 可选：仅当组件拥有私有令牌时存在
playground/src/tokens.less             # 共享主题 mixin（唯一来源）
playground/src/theme.less              # playground 主题入口
docs/.vitepress/theme/tokens.less      # 复用 playground mixin，只覆盖品牌色
```

- 不写 `<style scoped>`；样式集中在 `style/index.less`。
- BEM 命名：`.w-foo`、`.w-foo__header`、`.w-foo__item.is-active`。
- 使用 Less 嵌套，但避免超过 3 层。
- 组件根节点加稳定的类名，状态用 `is-*` 修饰类。
- 没有私有令牌的包**不要**创建 `token.less`，也不要写 `@import './token.less'`。

```less
.w-foo {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-sm, 6px);
  background: var(--w-color-surface, #fff);
  color: var(--w-color-text, #0f172a);
  font-family: var(--w-font-family, inherit);
  font-size: var(--w-font-size-sm, 13px);
  transition:
    background-color var(--w-duration-fast, 120ms) ease,
    border-color var(--w-duration-fast, 120ms) ease;

  &:hover:not(:disabled) {
    background: var(--w-color-surface-hover, #f1f5f9);
  }

  &:focus-visible {
    outline: 2px solid var(--w-color-primary, #4f46e5);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}
```

## 主题

- 共享主题令牌由应用提供，组件通过 `var(--w-*, fallback)` 读取；未加载主题文件时仍使用 fallback 独立渲染。
- 组件私有令牌声明在组件根节点；暗色变体用 `[data-w-theme='dark'] .w-foo` 与 `@media (prefers-color-scheme: dark) :root:not([data-w-theme]) .w-foo`，不要写全局暗色覆盖。
- 新增共享令牌时，只改 `playground/src/tokens.less` 的亮/暗 mixin，并同步文档；不要往组件包里复制主题块。
- 浮层/菜单的 hover 使用前景色状态层（见核心原则 6），保证亮暗都有正确方向。

## 动效

- 只使用 `--w-duration-*` 与 `--w-easing-*`。
- 只动画 `transform` / `opacity` / 颜色等低成本属性，避免动画布局属性。
- 大位移/缩放动画提供清晰的进入与退出状态。

## 可访问性视觉

- 正文文本对比度至少 4.5:1；大文本至少 3:1。
- 焦点态必须可见：`outline: 2px solid var(--w-color-primary)` + `outline-offset: 2px`。
- 禁用态用 `opacity` 或专门令牌，仍需保持可辨识。
- 状态不能只靠颜色表达，搭配图标、文本或 `aria-live`。
- 暗色主题下不要直接复用亮色阴影/边框，使用对应暗色令牌。

## 修改令牌的流程

1. 确认现有令牌无法满足，避免重复语义。
2. 在 `playground/src/tokens.less` 的 `.w-shared-tokens()` / `.w-light-tokens()` / `.w-dark-tokens()` 中添加或调整，亮/暗成对。
3. 用 `--w-` 命名空间与语义化命名（`--w-color-*` / `--w-radius-*` …）。
4. 组件通过 `var(--w-*, fallback)` 消费；组件私有的几何/动效值放组件根节点。
5. 更新 `docs/guide/styling.md` 的令牌说明（如涉及公开 API）。
6. 运行 `pnpm docs:build` 或 `pnpm build` 验证样式构建。

## 完成前检查

- [ ] 组件包内没有 `:root` / 裸 `[data-w-theme]` 主题块
- [ ] 没有硬编码颜色/圆角/阴影/动效时长（fallback 除外）
- [ ] 每个 `var(--w-*)` 都有 fallback
- [ ] 亮色与暗色主题均正常
- [ ] elevated 面板的 hover 使用前景色状态层，而非 `surface-hover`
- [ ] `focus-visible`、hover、active、disabled 状态齐全
- [ ] 新动效带 `prefers-reduced-motion` 降级
- [ ] 对比度满足 WCAG AA
