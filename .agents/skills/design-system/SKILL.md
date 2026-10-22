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
2. **令牌必须有 fallback**：`var(--w-color-primary, #4f46e5)`，保证未引入 `@wuhu-ui/tokens` 时仍可用。
3. **不硬编码颜色**：唯一例外是 token 定义本身和 `fallback`。
4. **组件私有变量用 `--w-<component>-*`**，例如 `--w-command-menu-active-bg`。
5. **亮暗主题成对维护**：在 `packages/tokens/src/index.less` 的 `.w-light-tokens()` 与 `.w-dark-tokens()` 中同时新增。

## 令牌速查

来源：`packages/tokens/src/index.less`

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
| 阴影   | `--w-shadow-sm` / `-md` / `-lg`                                                                                                                 |
| 动效   | `--w-duration-fast` / `-normal` / `-slow`、`--w-easing-standard` / `-emphasized`                                                                |
| 层级   | `--w-z-sticky` / `--w-z-dropdown` / `--w-z-overlay` / `--w-z-toast`                                                                             |

先读 `packages/tokens/src/index.less` 确认实际存在的令牌，不要凭空创造。

## 样式文件组织

```text
packages/<name>/src/style/index.less   # 组件样式，index.ts 顶部引入
packages/tokens/src/index.less         # 全局令牌（唯一来源）
```

- 不写 `<style scoped>`；样式集中在 `style/index.less`。
- BEM 命名：`.w-foo`、`.w-foo__header`、`.w-foo__item.is-active`。
- 使用 Less 嵌套，但避免超过 3 层。
- 组件根节点加稳定的类名，状态用 `is-*` 修饰类。

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

- 默认 `:root` 应用亮色令牌。
- `[data-w-theme='dark']` 切换暗色；未设置时跟随 `prefers-color-scheme`。
- 不要在组件内写 `@media (prefers-color-scheme: dark)` 硬编码颜色，依赖令牌自动切换。
- 新增令牌时同步亮/暗两套取值，并考虑 `prefers-reduced-motion` 是否覆盖。

## 动效

- 只使用 `--w-duration-*` 与 `--w-easing-*`。
- 只动画 `transform` / `opacity` / 颜色等低成本属性，避免动画布局属性。
- 必须尊重 `prefers-reduced-motion`；令牌已在减少动效时缩短时长，不要绕过它。
- 大位移/缩放动画提供清晰的进入与退出状态。

## 可访问性视觉

- 正文文本对比度至少 4.5:1；大文本至少 3:1。
- 焦点态必须可见：`outline: 2px solid var(--w-color-primary)` + `outline-offset: 2px`。
- 禁用态用 `opacity` 或专门令牌，仍需保持可辨识。
- 状态不能只靠颜色表达，搭配图标、文本或 `aria-live`。
- 暗色主题下不要直接复用亮色阴影/边框，使用对应暗色令牌。

## 修改令牌的流程

1. 确认现有令牌无法满足，避免重复语义。
2. 在 `.w-light-tokens()` 与 `.w-dark-tokens()` 同时添加。
3. 用 `--w-` 命名空间与语义化命名（`--w-color-*` / `--w-radius-*` …）。
4. 更新 `docs/guide/getting-started.md` 中令牌说明（如涉及公开 API）。
5. 运行 `pnpm docs:build` 或 `pnpm build` 验证样式构建。

## 完成前检查

- [ ] 没有硬编码颜色/圆角/阴影/动效时长（fallback 除外）
- [ ] 每个 `var(--w-*)` 都有 fallback
- [ ] 亮色与暗色主题均正常
- [ ] `focus-visible`、hover、active、disabled 状态齐全
- [ ] 动效遵守 `prefers-reduced-motion`
- [ ] 对比度满足 WCAG AA
