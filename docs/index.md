---
layout: home

hero:
  name: Wuhu Vue UI
  text: 为复杂业务而生的 Vue 3 组件库
  tagline: 30 个独立组件包，独立发布、按需引入。TypeScript、Less、设计令牌与可访问性内建。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 浏览组件
      link: /components/scrollbar

features:
  - title: 独立组件包
    details: 30 个组件独立发布、按需引入，互不耦合，升级与替换都更可控。
  - title: TypeScript 优先
    details: Props、事件、插槽与实例方法均提供完整类型，严格模式无隐式 any。
  - title: 设计令牌驱动
    details: 统一的 --w-* 令牌与亮 / 暗主题，可通过任意祖先节点覆盖品牌样式。
  - title: 可访问性内建
    details: 键盘导航、ARIA 关系、焦点管理与 prefers-reduced-motion 均在组件内处理。
  - title: 组合式 API
    details: 全部基于 script setup 与 Composition API，逻辑清晰、易于组合与扩展。
  - title: 轻量运行时
    details: 多数组件零额外依赖；Cropper、Icon Picker、Code Editor、Command Menu 与 File Viewer 的运行时依赖均为按需引入。
---

<script setup>
import HomeCatalog from './.vitepress/theme/HomeCatalog.vue'
</script>

<HomeCatalog />

<div class="home-start">

## 快速开始

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

```ts [main.ts]
import { Scrollbar } from '@wuhu-vue-ui/scrollbar'
```

组件样式内置 `var(--w-*, fallback)` 默认令牌，无需额外引入令牌包；主题与品牌色可在应用入口通过 CSS 变量统一覆盖。

</div>
