---
name: wuhu-component
description: 在 wuhu-vue-ui monorepo 中新增一个组件包的完整流程。要从零创建组件、补齐构建/测试/Demo/文档并接入 playground 与 VitePress 时使用。
---

# 新增组件包完整流程（Wuhu Vue UI）

按顺序执行，每一步都基于本仓库现有约定。参考实现：`packages/copy`（较完整）、`packages/time`（较简单）。

## 0. 先确认

- 组件是否已有同类包？避免重复。
- 需要哪些 peer 依赖？默认只允许 `vue` 作为 peer；额外依赖放到 `dependencies` 并确认体积。
- 组件名：`Wu` + PascalCase；包名：`@wuhu-ui/kebab-case`。

## 1. 创建包结构

```text
packages/<name>/
├─ index.ts               # 包入口：引入样式并导出公共 API
├─ package.json
├─ vite.config.ts
└─ src/
   ├─ <Name>.vue
   ├─ types.ts
   ├─ use<Name>.ts        # 可选，实现较复杂时拆出
   ├─ style/index.less
   └─ __tests__/<Name>.spec.ts
```

### package.json

复制 `packages/copy/package.json` 后修改：

- `name`: `@wuhu-ui/<name>`
- `description`: 英文一句话描述
- `keywords`: 至少包含 `vue`、`vue3`、`component`、`ui`
- 保留 `style`、`files`、`sideEffects`、`exports`（含 `node` 条件）、`publishConfig`、`build`/`prepack`
- 仅声明 `vue` 为 `peerDependencies`（`^3.4.0`）
- 有额外运行时依赖时新增 `dependencies`，不要放进 devDependencies

### vite.config.ts

```ts
import { createLibraryConfig } from '../../scripts/vite.library'

export default createLibraryConfig(import.meta.dirname)
```

有额外 external 依赖时：

```ts
export default createLibraryConfig(import.meta.dirname, {
  entry: 'index.ts',
  entryRoot: '.',
  external: ['some-lib'],
})
```

## 2. 实现组件

遵循 `vue3-component` skill：

- `<script setup lang="ts">` + `defineOptions({ name: 'WuXxx' })`
- props 类型放 `types.ts`，`withDefaults`
- emits 用元组语法，slots 用 `defineSlots`
- 清理副作用，异步回调加卸载守卫
- 可访问性与键盘操作

## 3. 编写样式

遵循 `design-system` skill：

- `src/style/index.less`，BEM + `--w-*` 令牌
- 包根目录 `index.ts` 顶部 `import './src/style/index.less'`

## 4. 导出公共 API

包根目录 `index.ts`：

```ts
import './src/style/index.less'

export { default as Foo } from './src/Foo.vue'
export { useFoo } from './src/useFoo' // 如果有
export type { UseFooOptions } from './src/useFoo'
export type { FooProps, FooSlotProps } from './src/types'
```

不要导出内部实现细节或测试文件。

## 5. 编写测试

`src/__tests__/<Name>.spec.ts`：

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'
import WuFoo from '../Foo.vue'

describe('WuFoo', () => {
  it('renders and emits', async () => {
    const wrapper = mount(WuFoo, { props: {/* ... */} })
    // 断言渲染 / 交互 / emit / 清理
    wrapper.unmount()
  })
})
```

覆盖：默认渲染、props 分支、事件、插槽、键盘交互、卸载清理。

## 6. 接入 playground

1. 在 `playground/package.json` 的 `dependencies` 增加 `"@wuhu-ui/<name>": "workspace:*"`。
2. 新建 `playground/src/demos/<name>-demo.vue`，使用 `<script setup lang="ts">` + `DemoCard`。
3. 在 `playground/src/docs/catalog.ts` 的 `componentDocs` 注册条目：`slug`、`name`、`title`、`summary`、`packageName`、`category`（`foundation` / `visual` / `interaction` / `data`）、`tags`、`demo`，并在文件顶部导入 Demo 组件。
4. 执行 `pnpm install` 使 workspace 链接生效。

## 7. 接入文档站

1. 新建 `docs/components/<name>.md`：

   ```md
   # Foo 组件名

   一句话描述。

   <demo vue="../../playground/src/demos/<name>-demo.vue" />
   ```

2. 在 `docs/.vitepress/config.ts` 的 `themeConfig.sidebar` 对应分组添加条目。
3. 需要展示的静态资源放 `docs/public/`。

## 8. 更新总览

- 在根 `README.md` 的组件表格中增加一行（包名、组件名、说明）。
- 如属于新的能力分类，同步文档侧边栏分组。

## 9. 验证（必须全绿）

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm docs:build
```

也可以直接运行 `pnpm check`（lint + format + typecheck + test）。

## 常见坑

- 忘记在 `playground/package.json` 加 workspace 依赖 → Demo 解析失败。
- 包内使用了路径别名 → `vite-plugin-dts` 生成类型失败；改用相对路径。
- 样式未在 `index.ts` 引入 → 发布后无样式。
- 只加了亮色令牌 → 暗色主题异常。
- 事件监听/定时器未清理 → 测试告警、内存泄漏。
- 新增包后未 `pnpm install` → workspace 未链接。
