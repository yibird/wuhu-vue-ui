# AGENTS.md

本文件面向在此仓库工作的 AI 编码代理与新协作者。请先阅读本文件，再按需加载 `.agents/skills/` 中的专项技能。

## 项目概览

**Wuhu Vue UI** 是一套面向复杂业务场景的 Vue 3 组件库，采用 pnpm monorepo，一个组件一个独立包。

组件面向桌面端（PC）场景，不承诺移动端交互与信息密度适配；playground / docs 的响应式布局仅用于文档展示。

技术栈：

- Vue 3.5 + TypeScript 5.9（`<script setup lang="ts">`）
- pnpm 10 workspace + Vite 7 library mode + `vite-plugin-dts`
- Less + CSS Custom Properties（设计令牌）
- VitePress 文档站 + `vitepress-demo-plugin`
- Vite+（内置 Oxlint / Oxfmt / Vitest）+ Husky + lint-staged
- `@vue/test-utils` + jsdom

## 环境要求

- Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`（Vite+ 要求）
- pnpm >= 10（仓库使用 `pnpm@10.18.1`）

```bash
pnpm install
```

## 常用命令

| 命令                    | 作用                                   |
| ----------------------- | -------------------------------------- |
| `pnpm dev`              | 启动 playground（Vite）                |
| `pnpm docs:dev`         | 启动 VitePress 文档站                  |
| `pnpm docs:build`       | 构建文档                               |
| `pnpm build`            | 构建全部 `packages/*`                  |
| `pnpm build:playground` | 构建 playground                        |
| `pnpm lint`             | `vp lint`                              |
| `pnpm lint:fix`         | `vp lint --fix`                        |
| `pnpm format`           | `vp fmt`                               |
| `pnpm format:check`     | `vp fmt --check`                       |
| `pnpm typecheck`        | 根 + playground + docs 三套 `vue-tsc`  |
| `pnpm test`             | `vp test` 单次运行                     |
| `pnpm test:watch`       | `vp test watch`                        |
| `pnpm check`            | lint + format:check + typecheck + test |

提交前至少保证 `pnpm check` 通过。只改某个包时可先跑 `pnpm test packages/<name>`。

## 仓库结构

```text
.
├─ packages/                # 31 个 workspace 包：core + 30 个组件包
│  ├─ core/                 # 公共工具、组合式函数与 DOM 基础设施
│  ├─ scrollbar/            # 基础能力组件
│  ├─ copy/
│  ├─ highlight/
│  ├─ time/
│  ├─ lazy-container/
│  ├─ resize-container/
│  ├─ error-boundary/
│  ├─ ellipsis/
│  ├─ permission/
│  ├─ count-down/
│  ├─ loading/
│  ├─ view/
│  ├─ icon/
│  ├─ exception/
│  ├─ gradient-text/        # 视觉表达组件
│  ├─ number-ticker/
│  ├─ sliding-highlight/
│  ├─ img-comparison-slider/
│  ├─ ripple/
│  ├─ command-menu/         # 交互增强组件
│  ├─ cropper/
│  ├─ motion-group/
│  ├─ slider-captcha/
│  ├─ code-editor/
│  ├─ dock/
│  ├─ icon-picker/
│  ├─ gantt/                # 数据展示组件
│  ├─ file-viewer/
│  ├─ org-tree/
│  └─ json-viewer/
├─ playground/              # 本地调试与 Demo（docs 部分复用）
│  ├─ src/demos/            # 每个组件的 playground Demo
│  ├─ src/docs/component-meta.ts  # 组件元数据（首页/侧边栏/playground 共用）
│  ├─ src/docs/catalog.ts   # 元数据 + Demo 组件映射
│  ├─ src/home/             # playground 首页
│  └─ src/tokens.less       # playground 应用级亮暗令牌
├─ docs/                    # VitePress 文档站
│  ├─ .vitepress/           # 站点配置、主题、HomeCatalog 与 tokens.less
│  ├─ components/           # 组件文档
│  ├─ demos/                # 文档站 Demo
│  ├─ guide/                # 快速开始与主题说明
│  └─ public/               # 文档静态资源（含 samples）
├─ scripts/
│  ├─ vite.library.ts       # 统一组件库构建配置
│  ├─ workspace-source.ts   # playground / docs 源码别名插件
│  ├─ generate-file-viewer-samples.mjs # 生成 playground/docs 二进制样例
│  ├─ visual-check.mjs      # 浏览器截图 + console/溢出/破图检查
│  ├─ a11y-check.mjs        # axe-core WCAG A/AA 扫描
│  └─ memory-check.mjs      # 路由切换后的 JS 堆趋势检查
├─ tests/                   # 跨包测试（SSR、attrs、setup）
├─ types/                   # 全局 .d.ts
├─ vite.config.ts           # Vitest / Oxlint / Oxfmt 统一配置
├─ .husky/                  # pre-commit
├─ .gitattributes           # LF 行尾规范
├─ pnpm-workspace.yaml
├─ tsconfig.json
├─ AGENTS.md
├─ CHANGELOG.md
└─ .agents/skills/          # 项目级 AI 技能
```

## 组件包约定

典型包结构：

```text
packages/<name>/
├─ index.ts                 # 包入口，引入样式并导出公共 API
├─ package.json
├─ vite.config.ts           # createLibraryConfig(import.meta.dirname)
└─ src/
   ├─ <Name>.vue
   ├─ types.ts
   ├─ use<Name>.ts          # 可选
   ├─ style/index.less
   └─ __tests__/<Name>.spec.ts
```

硬性要求：

- **Vue**：`<script setup lang="ts">`；`defineOptions({ name: 'WuXxx' })`；props 类型放 `types.ts`；`defineEmits` 用元组语法；`defineSlots` 声明插槽类型；仅暴露必要 API。
- **样式**：集中在 `src/style/index.less`，由包根目录 `index.ts` 顶部引入；BEM 命名（`.w-foo__bar.is-active`）；不写 `<style scoped>`。
- **设计令牌**：颜色、字号、圆角、阴影、动效只使用 `--w-*`，并带 fallback，例如 `var(--w-color-primary, #4f46e5)`。每个组件包在 `src/style/token.less` 中维护自己实际使用的令牌（含亮/暗两套），由 `src/style/index.less` 引入；组件之间不共享 token 文件。新增令牌时，需同步到所有使用它的组件包；playground/docs 各自维护应用级 `tokens.less`。
- **TypeScript**：`strict` + `verbatimModuleSyntax`；类型导入必须 `import type`；禁止 `any`（用 `unknown` + 收窄）；包内导入必须是相对路径，不要用别名。
- **导出**：所有公共组件、composables、类型从包根目录 `index.ts` 导出；类型用 `export type`。
- **依赖**：组件包仅将 `vue` 声明为 `peerDependencies`；额外运行时依赖放 `dependencies` 并在 `vite.library` 中 external（如需要）。
- **构建产物**：ESM + `.d.ts` + source maps + `style.css`；浏览器入口自动注入样式，`node` 条件提供无 CSS 的 `index.node.js`。不要手动编辑 `dist/`。
- **可访问性**：语义化元素、图标按钮 `aria-label`、状态 `aria-live`、键盘操作、`:focus-visible`、`prefers-reduced-motion`。
- **安全**：不使用 `v-html`；高亮等富文本场景通过模板转义实现。

## 新增组件流程

1. 创建 `packages/<name>/{package.json,vite.config.ts,index.ts,src/...}`，`package.json` 参考 `packages/copy`。
2. 实现组件、类型、样式与 `index.ts` 导出。
3. 添加 `src/__tests__/<Name>.spec.ts`。
4. `playground/package.json` 增加 `"@wuhu-vue-ui/<name>": "workspace:*"`。
5. 新建 `playground/src/demos/<name>-demo.vue`，在 `playground/src/docs/component-meta.ts` 登记元数据，并在 `playground/src/docs/catalog.ts` 映射 Demo 组件。
6. 新建 `docs/components/<name>.md`，使用 `<demo vue="../../playground/src/demos/<name>-demo.vue" />`，并在 `docs/.vitepress/config.ts` 侧边栏登记。
7. 更新根 `README.md` 组件表格。
8. `pnpm install` 后运行 `pnpm check && pnpm build && pnpm docs:build`。

详细步骤见 `.agents/skills/wuhu-component/SKILL.md`。

## 测试约定

- 位置：`packages/<name>/src/__tests__/*.spec.ts`
- 框架：Vite+ 内置 Vitest（jsdom）+ `@vue/test-utils`；测试从 `vite-plus/test` 导入
- 覆盖：默认渲染、props 分支、emit、插槽、键盘交互、卸载清理
- 异步：`await flushPromises()`；结束时 `wrapper.unmount()`

## 文档与 Demo

- 文案使用中文；代码、标识符、命令行使用英文。
- Demo 放在 `playground/src/demos/`，文档站直接引用，避免重复示例。
- 文档页结构：一级标题 + 一句话描述 + `<demo ... />`，需要时补充 API 表格。
- 文档静态资源放 `docs/public/`。

## 项目级 Skills

| Skill            | 用途                                                   |
| ---------------- | ------------------------------------------------------ |
| `vue3-component` | SFC、组合式函数、props/emits/slots、生命周期与可访问性 |
| `typescript`     | 严格模式、类型组织、导出、d.ts 产物与类型错误修复      |
| `design-system`  | 设计令牌、Less 样式、亮/暗主题、动效与对比度           |
| `wuhu-component` | 新增组件包的端到端流程（构建/测试/Demo/文档/验证）     |

按任务加载对应技能，例如修改样式时优先看 `design-system`，新增包时看 `wuhu-component`。

## 代理工作准则

- **先读后改**：修改前阅读目标文件与同目录参考实现。
- **最小改动**：只改与任务相关的代码，不做顺手重构、不添加未要求的抽象。
- **不要提交未授权的操作**：不主动 `git commit` / `git push` / 创建 PR，除非用户明确要求。
- **不要编辑生成物**：`dist/`、`coverage/`、`.vitepress/cache/`、`node_modules/` 均为生成产物。
- **不要绕过质量门禁**：不新增 `@ts-ignore` / `@ts-expect-error`，不关闭 lint 规则，不放宽 `tsconfig`。
- **保持一致性**：新的 API、命名、样式遵循现有包的模式；不确定时参考 `packages/copy`。
- **完成后自检**：运行相关命令（至少 typecheck + test），并在回复中说明改动与验证结果。
