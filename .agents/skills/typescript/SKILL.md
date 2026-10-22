---
name: typescript
description: Wuhu Vue UI 的 TypeScript 规范。编写/重构 TS、定义公开类型、修复 vue-tsc 类型错误、处理模块导入导出与 d.ts 产物时使用。
---

# TypeScript 规范（Wuhu Vue UI）

## 何时使用

- 新增或修改 `.ts`、`.vue` 的 `<script setup lang="ts">`
- 定义 props / emits / slots / 公共方法类型
- 修复 `pnpm typecheck` / `vue-tsc` 报错
- 调整包的 `index.ts` 导出或构建产物类型

## 编译约束（根 `tsconfig.json`）

项目开启了以下严格选项，写代码时必须满足：

- `strict: true`
- `noUnusedLocals: true`、`noUnusedParameters: true`（未使用参数以 `_` 开头）
- `noFallthroughCasesInSwitch: true`
- `noImplicitOverride: true`
- `verbatimModuleSyntax: true`
- `isolatedModules: true`
- `moduleResolution: "Bundler"`、`target: "ES2022"`

由此带来的硬性规则：

```ts
// 只作为类型使用时必须 import type
import type { FooProps } from './types'

// 同时导入值和类型时分开写
import { computed, ref } from 'vue'
import type { Ref } from 'vue'

// 重新导出类型必须用 export type
export type { FooProps, FooSlotProps } from './types'
```

## 类型组织

- 每个组件包：公共类型放 `src/types.ts`，从 `index.ts` 以 `export type` 导出。
- 组合式函数选项类型紧邻实现（如 `export interface UseClipboardOptions`）。
- 不使用 `any`。外部不可信输入用 `unknown`，再做类型守卫/收窄。
- 不滥用 `as`；只在无法表达或与第三方库边界处使用，并保证运行时安全。
- 事件处理器、插槽 props、`defineExpose` 的返回都要有明确类型。
- `Record<string, unknown>` 仅用于真正动态的字典，不要用来逃避建模。

## Vue 类型写法

```ts
const props = withDefaults(defineProps<FooProps>(), {
  disabled: false,
})

const emit = defineEmits<{
  change: [value: string]
  error: [error: Error]
}>()

defineSlots<{
  default?: (props: FooSlotProps) => unknown
  item?: (props: { item: Item; index: number }) => unknown
}>()
```

- props 可选性由 `?` 表达，默认值只放在 `withDefaults` 中。
- 不要给 props 类型加 `readonly`；Vue 会处理。
- 对外暴露的 ref 用 `readonly()`，避免父组件直接改内部状态。

## 对外导出

`packages/<name>/index.ts` 统一负责：

1. 引入样式：`import './style/index.less'`
2. 导出组件与 composables 的值
3. 用 `export type` 导出公共类型

```ts
import './style/index.less'

export { default as WuFoo } from './Foo.vue'
export { useFoo } from './useFoo'
export type { UseFooOptions } from './useFoo'
export type { FooProps, FooSlotProps } from './types'
```

## 构建产物（d.ts）注意事项

- 包源码内使用相对路径导入，不要使用 `@/` 或 workspace 别名；`vite-plugin-dts` 需要能解析并归一化产物。
- 不从 `dist` 或测试文件导入。
- 类型文件里不要写运行时副作用代码。
- `@wuhu-ui/core` 可被其他包以 workspace 依赖使用；新增依赖时同步包 `package.json` 的 `dependencies` / `peerDependencies`，不要漏。

## 校验命令

```bash
pnpm typecheck   # 根 + playground + docs 三套 tsconfig
pnpm lint        # vp lint
pnpm test        # vp test
```

类型错误必须从源头修复，不要用 `@ts-ignore` / `@ts-expect-error` / 放宽 `tsconfig` 规避。

## 完成前检查

- [ ] 无新增 `any`、无未使用变量/参数
- [ ] 类型导入使用 `import type`
- [ ] 公共 API 与类型均已从 `index.ts` 导出
- [ ] 包内导入全部为相对路径
- [ ] `pnpm typecheck`、`pnpm lint` 通过
