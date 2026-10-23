---
name: vue3-component
description: Wuhu Vue UI 的 Vue 3 组件开发规范。新增或修改 SFC、组合式函数、props/emits/slots/expose、组件生命周期与可访问性时使用。
---

# Vue 3 组件开发规范（Wuhu Vue UI）

## 何时使用

- 新增 `packages/<name>/src/*.vue` 组件
- 修改组件的 props、emits、slots、暴露实例方法
- 编写或调整 Vue composables（`packages/core/src/hooks` 或包内 `useXxx.ts`）
- 排查响应式、生命周期清理、SSR/卸载后更新等问题

## 先看再写

1. 阅读同目录已有组件与 `types.ts`，沿用现有 API 风格。
2. 参考实现：`packages/copy/src/Copy.vue`、`packages/scrollbar/src/Scrollbar.vue`。
3. 确认 `<script setup lang="ts">`，不引入 Options API 风格。

## SFC 固定结构

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { FooProps, FooSlotProps } from './types'

defineOptions({
  name: 'WuFoo', // 必填，必须是 Wu 前缀的组件名
})

const props = withDefaults(defineProps<FooProps>(), {
  disabled: false,
})

const emit = defineEmits<{
  change: [value: string]
  error: [error: Error]
}>()

defineSlots<{
  default?: (props: FooSlotProps) => unknown
}>()

// 状态与逻辑

defineExpose({
  // 只暴露确实需要的方法/只读状态
})
</script>

<template>
  <div class="w-foo">
    <slot />
  </div>
</template>
```

约定：

- 组件名：文件 `PascalCase.vue`，`defineOptions({ name: 'WuXxx' })`。
- Props 类型放在同目录 `types.ts`，组件内用 `withDefaults(defineProps<FooProps>(), ...)`。
- Emits 使用元组语法 `event: [args]`，不要用对象声明。
- 插槽使用 `defineSlots` 并提供插槽 props 类型。
- 需要父组件调用的能力才 `defineExpose`，优先暴露 `readonly()` 状态。
- 不使用 `v-html`；富文本/高亮场景保持模板转义。

## 组合式函数

- 可复用的逻辑抽到 `useXxx.ts`，返回值保持稳定结构。
- 需要响应式入参时接受 `MaybeRefOrGetter` 并用 `toValue()` 读取，参考 `UseClipboardOptions`。
- 在 `onScopeDispose` / `onBeforeUnmount` 中清理定时器、事件监听、Observer。
- 异步回调必须防止组件卸载后继续 setState 或 emit，参考 `packages/copy/src/Copy.vue` 的 `unmounted` 守卫。
- 只在浏览器存在的 API（`window`、`document`、`IntersectionObserver`、`clipboard`）要做存在性判断，保证 SSR / 测试环境安全。

## 响应式与性能

- 派生值用 `computed`，不要用 `watch` 回写。
- 避免在模板里写复杂表达式；复杂逻辑移到 computed/函数。
- 大列表/高频事件使用 `useThrottle` / `useDebounce`（`@wuhu-vue-ui/core`）。
- 清理逻辑与注册逻辑成对出现，禁止遗留监听。

## 可访问性（强制）

- 交互组件使用语义化元素：按钮用 `<button type="button">`，导航用 `<nav>`。
- 图标按钮必须提供 `aria-label`；纯装饰图标加 `aria-hidden="true"`。
- 状态变化使用 `aria-live="polite"` 或合适的 ARIA 属性。
- 必须提供 `:focus-visible` 样式，不能只靠 `:focus`。
- 键盘可操作：Enter/Space、方向键、Escape 等按组件语义实现。
- 动画遵循 `prefers-reduced-motion`（通过 `--w-duration-*` 令牌自动生效）。

## 样式

- 组件样式放在 `src/style/index.less`，由 `index.ts` 顶部 `import './style/index.less'` 引入。
- 不写 `<style scoped>`；使用 BEM 命名：`.w-foo`、`.w-foo__item`、`.w-foo.is-active`。
- 颜色、间距、圆角、阴影、动效必须使用 `--w-*` 设计令牌，详见 `design-system` skill。
- 组件私有变量使用 `--w-<component>-*` 前缀。

## 测试

- 测试文件：`src/__tests__/<Component>.spec.ts`，使用 `@vue/test-utils` + Vite+ 内置 Vitest（`vite-plus/test`）。
- 覆盖：默认渲染、props 分支、emit、slot、键盘交互、卸载清理。
- 用 `wrapper.unmount()` 显式卸载；异步用 `flushPromises()`。
- 运行：`pnpm test -- packages/<name>` 或 `pnpm test`。

## 完成前检查

- [ ] `pnpm lint`、`pnpm format:check`、`pnpm typecheck`、`pnpm test` 全部通过
- [ ] 无硬编码颜色/圆角/时长
- [ ] 事件监听、定时器、Observer 已清理
- [ ] 键盘与屏幕阅读器可用
- [ ] 公开 API 已在 `index.ts` 导出且带类型
