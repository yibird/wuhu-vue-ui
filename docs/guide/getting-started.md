# 快速开始

Wuhu Vue UI 采用 pnpm monorepo 组织，一个组件一个独立包。所有组件基于 Vue 3、TypeScript、Less 与设计令牌构建。

## 安装

::: code-group
```bash [pnpm]
pnpm add @wuhu-vue-ui/scrollbar
```

```bash [npm]
npm install @wuhu-vue-ui/scrollbar
```

```bash [yarn]
yarn add @wuhu-vue-ui/scrollbar
```

```bash [bun]
bun add @wuhu-vue-ui/scrollbar
```
:::

## 设计令牌

组件样式已通过 `var(--w-*, fallback)` 内置默认令牌，无需额外引入令牌包。

如需统一品牌色或主题，在应用中覆盖 CSS 变量即可：

```css [theme.css]
:root {
  --w-color-primary: #16a34a;
  --w-color-primary-hover: #22c55e;
}
```

暗色主题可在 `[data-w-theme='dark']` 下定义对应变量。组件包不声明全局主题令牌，只在自己的根节点声明组件私有令牌（如 `--w-dock-size`），因此多包共存时不会互相覆盖。示例站点的完整亮暗令牌与 `prefers-color-scheme` 参考实现位于 `playground/src/tokens.less`（可复用的 mixin）与 `playground/src/theme.less`（应用入口），可按需复制到业务项目。

## 使用组件

```vue [App.vue]
<script setup lang="ts">
import { Scrollbar } from '@wuhu-vue-ui/scrollbar'
</script>

<template>
  <Scrollbar height="240px">
    <p>可滚动内容</p>
  </Scrollbar>
</template>
```

每个组件包会自动注入自身样式。如需显式控制样式顺序，也可以导入 `@wuhu-vue-ui/scrollbar/style.css`。

## 主题

所有设计令牌均使用 CSS 变量，可在任意祖先节点覆盖：

```css [theme.css]
:root {
  --w-color-primary: #16a34a;
  --w-color-primary-hover: #22c55e;
  --w-radius-md: 10px;
}
```

组件局部变量使用独立的组件前缀，例如 Command Menu 的 `--w-command-menu-active-bg`。组件私有令牌在组件根节点声明，只影响该组件；主题令牌（`--w-color-*`、`--w-font-*`、`--w-radius-*` 等）由应用统一提供，组件只读取并带 fallback。

## 可访问性

- 交互组件提供键盘操作与清晰的 `focus-visible` 样式。
- 列表与命令面板使用 `aria-activedescendant`、`aria-selected` 等 ARIA 属性。
- 文本高亮与富文本场景不使用 `v-html`。
