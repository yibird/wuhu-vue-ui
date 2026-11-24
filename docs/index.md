---
layout: home

hero:
  name: Wuhu Vue UI
  text: 为复杂业务而生的 Vue 3 组件库
  tagline: 34 个独立组件包，独立发布、按需引入。TypeScript、Less、设计令牌与可访问性内建。
  image:
    src: /logo.svg
    alt: Wuhu Vue UI
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 浏览组件
      link: /components/scrollbar
    - theme: alt
      text: 组合场景
      link: /scenarios/

features:
  - title: 独立组件包
    details: 34 个组件独立发布、按需引入，互不耦合，升级与替换都更可控。
  - title: TypeScript 优先
    details: Props、事件、插槽与实例方法均提供完整类型，严格模式无隐式 any。
  - title: 设计令牌驱动
    details: 统一的 --w-* 令牌与亮 / 暗主题，可通过任意祖先节点覆盖品牌样式。
  - title: 可访问性内建
    details: 键盘导航、ARIA 关系与焦点管理均在组件内处理。
---

<script setup>
import HomeCatalog from './.vitepress/theme/HomeCatalog.vue'
</script>

<HomeCatalog />

## 组合场景

组件彼此独立，也可以在真实界面中自由组合：

- [发布排期](/scenarios/release-planning)：Gantt + CommandMenu + NumberTicker
- [文档评审](/scenarios/document-review)：FileViewer + Scrollbar + ContextMenu
- [客服工作台](/scenarios/support-console)：Scrollbar + CommandMenu + MotionGroup + Loading

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

</div>
