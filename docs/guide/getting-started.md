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

每个组件包都在自己的根节点上声明了完整的一套 `--w-<component>-*` 令牌（值均为字面量，并附带暗色版本），不依赖应用的全局变量，单独安装即可使用，无需额外引入令牌包。

如需统一品牌色或主题，按组件前缀覆盖即可：

```css [theme.css]
/* 以 Copy 为例；其他组件使用各自的 --w-<component>-* 前缀 */
.w-copy {
  --w-copy-color-primary: #16a34a;
  --w-copy-color-primary-hover: #22c55e;
}

[data-w-theme='dark'] .w-copy {
  --w-copy-color-primary: #22c55e;
}
```

组件之间互不共享变量，因此覆盖一个包不会影响其他包。示例站点的亮暗令牌实现位于 `playground/src/tokens.less`，可作为自定义组件或业务样式的参考。

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

所有视觉令牌都是 CSS 变量，但命名空间按组件隔离：`--w-<component>-*`，例如 Command Menu 的 `--w-command-menu-active-bg`。每个包在自己的根节点声明全部令牌及暗色值，不读取应用的全局变量；覆盖时使用对应组件的前缀，不会影响其他包。

## 可访问性

- 交互组件提供键盘操作与清晰的 `focus-visible` 样式。
- 列表与命令面板使用 `aria-activedescendant`、`aria-selected` 等 ARIA 属性。
- 文本高亮与富文本场景不使用 `v-html`。
