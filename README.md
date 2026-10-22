# Wuhu Vue UI

一套面向复杂业务场景的 Vue 3 组件库。采用 pnpm monorepo 组织，一个组件一个独立包，使用 TypeScript、Less、设计令牌（Design Tokens）、Vite+ 与 Husky 构建。

- 29 个业务组件，覆盖滚动、复制、高亮、懒加载、尺寸监听、错误边界、相对时间、文本省略、权限控制、倒计时、加载动画、页面布局、图标、水波纹、图片对比、图片裁剪、列表重排、滑块验证、渐变文字、滚动数字、滑块高亮、命令面板、代码编辑、JSON 查看、程序坞、图标选择、组织架构图、文件预览与甘特图。
- 每个包只将 `vue` 作为 peer dependency；`@wuhu-ui/command-menu` 额外使用 `pinyin-pro` 提供拼音搜索，`@wuhu-ui/cropper` 使用 `cropperjs` 提供裁剪能力，`@wuhu-ui/icon-picker` 使用 `@tanstack/vue-virtual` 提供虚拟滚动，`@wuhu-ui/code-editor` 将 `monaco-editor` 作为可选 peer dependency。
- 样式基于 `--w-*` CSS 变量，内置亮色 / 暗色主题，可按项目品牌覆盖。
- 单包构建自动注入自身样式，无需手动引入组件 CSS。
- 完整的 TypeScript 类型、组合式函数导出、可访问性支持与单元测试。

## 组件一览

| 包                               | 组件                  | 说明                                                              |
| -------------------------------- | --------------------- | ----------------------------------------------------------------- |
| `@wuhu-ui/scrollbar`             | `Scrollbar`           | 模拟原生滚动行为，自定义滚动条，支持横向 / 纵向、拖拽与点击轨道   |
| `@wuhu-ui/copy`                  | `Copy`                | 剪贴板写入，`text` 支持同步 / 异步、成功 / 失败状态与降级方案     |
| `@wuhu-ui/highlight`             | `Highlight`           | 安全的多关键词高亮，支持整词匹配、大小写与作用域插槽              |
| `@wuhu-ui/lazy-container`        | `LazyContainer`       | 基于 IntersectionObserver 的懒渲染与进入 / 离开事件               |
| `@wuhu-ui/resize-container`      | `ResizeContainer`     | 基于 ResizeObserver 的尺寸监听，支持防抖                          |
| `@wuhu-ui/error-boundary`        | `ErrorBoundary`       | 捕获子组件渲染错误，提供默认回退与重置能力                        |
| `@wuhu-ui/time`                  | `Time`                | 自动刷新的相对时间，基于 Intl.RelativeTimeFormat                  |
| `@wuhu-ui/ellipsis`              | `Ellipsis`            | 单行 / 多行文本省略，支持展开收起、溢出检测与悬浮提示             |
| `@wuhu-ui/permission`            | `Permission`          | 组件 / 组合式函数 / 指令三种权限校验，支持 all / any 与 fallback  |
| `@wuhu-ui/count-down`            | `CountDown`           | 目标时间或时长倒计时，支持暂停、重置、格式化与完成插槽            |
| `@wuhu-ui/loading`               | `Loading`             | 5 种内置加载动画，支持全屏遮罩、插槽与命令式创建 / 销毁           |
| `@wuhu-ui/view`                  | `View`                | 可组合的 Header / Sider / Content / Footer 页面布局，支持折叠     |
| `@wuhu-ui/icon`                  | `Icon`                | 轻量级内联 SVG 图标，内置 Lucide 路径并支持自定义注册             |
| `@wuhu-ui/exception`             | `Exception`           | 400 / 403 / 404 / 500 异常页，支持插图、插槽与自定义操作          |
| `@wuhu-ui/img-comparison-slider` | `ImgComparisonSlider` | 可拖拽、触摸与键盘操作的图片对比滑块                              |
| `@wuhu-ui/ripple`                | `Ripple`              | Material 风格水波纹，提供组件、指令与组合式函数三种用法           |
| `@wuhu-ui/cropper`               | `Cropper`             | 基于 Cropper.js 2 的图片裁剪，支持缩放、旋转、比例与导出          |
| `@wuhu-ui/motion-group`          | `MotionGroup`         | 基于 TransitionGroup 的列表重排动画，内置 6 套预设                |
| `@wuhu-ui/slider-captcha`        | `SliderCaptcha`       | Canvas 拼图滑块验证码，支持拖拽、键盘操作与自定义背景             |
| `@wuhu-ui/gradient-text`         | `GradientText`        | 线性 / 径向 / 锥形渐变文字，支持背景流动动画                      |
| `@wuhu-ui/number-ticker`         | `NumberTicker`        | 逐位滚动的数字动画，支持千分位、前缀与小数                        |
| `@wuhu-ui/sliding-highlight`     | `SlidingHighlight`    | 跟随悬浮 / 焦点的滑块高亮容器，支持任意直接子项与自定义样式       |
| `@wuhu-ui/command-menu`          | `CommandMenu`         | 命令面板：中文 / 拼音搜索、分组、键盘导航与悬浮优先高亮           |
| `@wuhu-ui/code-editor`           | `CodeEditor`          | 基于 Monaco 的代码编辑器，支持 v-model、语言 / 主题切换与只读模式 |
| `@wuhu-ui/json-viewer`           | `JsonViewer`          | 基于 CodeEditor 的只读 JSON 查看器，自动格式化对象与 JSON 字符串  |
| `@wuhu-ui/dock`                  | `Dock`                | macOS 风格程序坞，支持四向布局、指针放大与插槽定制                |
| `@wuhu-ui/icon-picker`           | `IconPicker`          | 分组、搜索与虚拟滚动的图标选择器，支持类名与 VNode 图标           |
| `@wuhu-ui/gantt`                 | `Gantt`               | 层级任务、依赖、进度、里程碑、日 / 周 / 月视图与拖拽排期          |
| `@wuhu-ui/org-tree`              | `OrgTree`             | 可缩放平移、拖拽改父级的组织架构图，支持右键菜单与节点插槽        |
| `@wuhu-ui/file-viewer`           | `FileViewer`          | 图片、音视频、PDF、Office、Markdown、代码、EPUB 与压缩包预览      |
| `@wuhu-ui/core`                  | —                     | 公共工具函数与 Vue composables（防抖、节流、复制等）              |
| `@wuhu-ui/tokens`                | —                     | 全局设计令牌与亮 / 暗主题 CSS 变量                                |

## 技术栈

- Vue 3.5 / TypeScript 5.9
- pnpm workspace
- Vite 7 library mode + `vite-plugin-dts`
- Less + CSS Custom Properties
- Vite+（内置 Oxlint / Oxfmt / Vitest）
- Husky + lint-staged
- @vue/test-utils + jsdom

## 环境要求

- Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`
- pnpm >= 10

## 快速开始

```bash
pnpm install
pnpm dev # 启动 VitePress 文档站，默认 http://localhost:5173
```

常用命令：

```bash
pnpm dev               # VitePress 文档开发服务（使用 demo 插件）
pnpm dev:playground    # 启动 playground
pnpm docs:dev          # 同 pnpm dev
pnpm docs:build        # 构建 VitePress 文档
pnpm docs:preview      # 预览文档构建产物
pnpm build             # 构建全部组件包
pnpm build:playground  # 构建 playground
pnpm typecheck         # 校验组件、playground 与文档类型
pnpm lint              # vp lint
pnpm format            # vp fmt
pnpm test              # 运行单元测试
pnpm check             # lint + format check + typecheck + test

# 浏览器级检查（需先运行 pnpm dev:playground）
pnpm test:visual       # 桌面/移动/暗色截图 + 控制台/溢出/可访问名称检查
pnpm test:a11y         # axe-core WCAG A/AA 扫描
pnpm test:memory       # 路由切换后的 JS 堆趋势
```

文档站基于 VitePress，并通过 `vitepress-demo-plugin` 在 Markdown 中直接嵌入
`docs/demos/<组件>` 下按组件分类的 Vue Demo，同时展示可展开的来源代码。代码组与代码标题
通过 `vitepress-plugin-group-icons` 自动显示包管理器、语言与文件类型图标。

## 仓库结构

```text
.
├─ packages/                   # 32 个 workspace 包：2 个基础包 + 30 个组件包
│  ├─ core/                    # 公共工具函数、composables 与 DOM 基础设施
│  ├─ tokens/                  # 设计令牌与主题
│  ├─ scrollbar/               # 基础能力组件
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
│  ├─ gradient-text/           # 视觉表达组件
│  ├─ number-ticker/
│  ├─ sliding-highlight/
│  ├─ img-comparison-slider/
│  ├─ ripple/
│  ├─ command-menu/            # 交互增强组件
│  ├─ cropper/
│  ├─ motion-group/
│  ├─ slider-captcha/
│  ├─ code-editor/
│  ├─ dock/
│  ├─ icon-picker/
│  ├─ gantt/                   # 数据展示组件
│  ├─ file-viewer/
│  ├─ org-tree/
│  └─ json-viewer/
├─ playground/                 # 编写与调试 Vue Demo
│  ├─ src/demos/               # 每个组件的 Demo
│  ├─ src/docs/component-meta.ts # 组件元数据（首页/侧边栏共用）
│  └─ src/docs/catalog.ts      # 元数据 + Demo 组件映射
├─ docs/                       # VitePress 文档站
│  ├─ .vitepress/              # 站点配置、主题与 HomeCatalog
│  ├─ components/              # 每个组件一个 Markdown 页面
│  ├─ demos/                   # 文档站 Demo
│  ├─ guide/                   # 快速开始与主题说明
│  └─ public/                  # 文档静态资源（含 samples）
├─ scripts/
│  ├─ vite.library.ts          # 统一的组件库构建配置
│  ├─ workspace-source.ts      # playground / docs 共用的源码别名插件
│  ├─ build-tokens.mjs         # Less → CSS 令牌构建
│  ├─ generate-file-viewer-samples.mjs # 生成 playground/docs 二进制样例
│  ├─ visual-check.mjs         # 浏览器截图与控制台/溢出检查
│  ├─ a11y-check.mjs           # axe-core 无障碍扫描
│  └─ memory-check.mjs         # 路由切换堆趋势检查
├─ tests/                      # 跨包测试（SSR、attrs、setup）
├─ types/                      # 全局 .d.ts
├─ vite.config.ts              # Vitest / Oxlint / Oxfmt 统一配置
├─ .husky/                     # pre-commit
├─ .gitattributes              # LF 行尾规范
├─ pnpm-workspace.yaml
├─ tsconfig.json
└─ package.json
```

每个组件包均输出 ESM、`.d.ts`、source map 与 `style.css`。浏览器入口会自动注入 `import "./style.css"`；同时通过 package `exports` 的 `node` 条件提供无 CSS 依赖的 `index.node.js`，便于 Node SSR / 外部化依赖场景直接加载。

```ts
import '@wuhu-ui/tokens/index.css' // 全局令牌，必须在应用入口引入一次
import { Scrollbar } from '@wuhu-ui/scrollbar'
```

如需显式控制样式加载顺序，也可以导入 `@wuhu-ui/scrollbar/style.css`。所有组件的自定义属性统一使用 `--w-*` 命名空间（满足 `--w` 前缀约定）。

## 样式与 class 定制

所有组件都支持标准的 `class` 与 `style` 属性，并与内部语义类名、样式合并后应用到组件的根节点：

```vue
<Copy class="toolbar-copy" style="margin-left: 8px" :text="() => 'hello'" />
```

- 支持 `tag` 的组件会把属性应用到 `tag` 实际渲染出的元素。
- 内部类名采用稳定的 BEM 命名：`w-<component>`、`w-<component>__<element>`、`is-*` / `--modifier`。
- 组件优先通过 CSS 变量定制；`Time` 的格式化长度属性为 `formatStyle`，因此 `style` 可正常用于内联样式。
- 根节点透传行为由 `tests/component-attrs.spec.ts` 对全部组件进行回归保障。

## 主题与设计令牌

在应用入口引入全局令牌：

```ts
import '@wuhu-ui/tokens/index.css'
```

亮色主题默认生效，暗色主题可通过属性切换：

```html
<html data-w-theme="dark"></html>
```

未显式设置 `data-w-theme` 时，会跟随系统 `prefers-color-scheme`。

所有令牌都是 CSS 变量，可以在任意祖先节点覆盖：

```css
:root {
  --w-color-primary: #16a34a;
  --w-color-primary-hover: #22c55e;
  --w-color-primary-soft: rgba(22, 163, 74, 0.12);
  --w-radius-md: 10px;
  --w-font-family: 'Your Font', system-ui, sans-serif;
}
```

常用令牌分组：

- 品牌色：`--w-color-primary`、`--w-color-success`、`--w-color-warning`、`--w-color-danger`、`--w-color-info`
- 文本：`--w-color-text`、`--w-color-text-secondary`、`--w-color-text-tertiary`
- 表面：`--w-color-bg`、`--w-color-surface`、`--w-color-surface-subtle`、`--w-color-surface-hover`
- 边框：`--w-color-border`、`--w-color-border-strong`
- 圆角：`--w-radius-xs` ~ `--w-radius-xl`、`--w-radius-full`
- 阴影：`--w-shadow-sm|md|lg`
- 动效：`--w-duration-fast|normal|slow`、`--w-easing-standard|emphasized`

组件还暴露局部变量，例如：

```css
.w-scrollbar {
  --w-scrollbar-size: 8px;
  --w-scrollbar-thumb: rgba(15, 23, 42, 0.28);
}
```

## 组件用法

### Core 工具与 Hooks

`@wuhu-ui/core` 为其他包和业务代码提供通用能力，不包含样式，也不会引入额外运行时依赖。

```ts
import {
  copyText,
  debounce,
  throttle,
  useCopy,
  useDebounce,
  useDebounceFn,
  useThrottle,
  useThrottleFn,
} from '@wuhu-ui/core'

const search = useDebounceFn((keyword: string) => fetchResults(keyword), 300)

const source = ref('')
const debouncedSource = useDebounce(source, 300)

const throttledScroll = useThrottleFn(() => updatePosition(), 100)

const { copied, copy } = useCopy()
await copy('hello')
await copyText('hello')
```

- `debounce(fn, wait, options)` / `throttle(fn, wait, options)` 支持 `leading`、`trailing`，并返回带 `cancel()`、`flush()`、`pending()` 的函数。
- `useDebounceFn` / `useThrottleFn` 会在当前 effect scope 销毁时自动取消挂起调用。
- `useDebounce(ref, wait)` / `useThrottle(ref, wait)` 返回只读的镜像 ref。
- `copyText(text)` 使用异步 Clipboard API，并在非安全上下文或权限被拒时降级到 `execCommand`。
- `useCopy(options)` 提供 `copied`、`loading`、`error`、`copy()` 与 `reset()`。

### Scrollbar

```vue
<script setup lang="ts">
import { Scrollbar } from '@wuhu-ui/scrollbar'
</script>

<template>
  <Scrollbar height="320px" always :min-size="28" @scroll="console.log">
    <YourLongContent />
  </Scrollbar>
</template>
```

主要 Props：

| Prop        | 类型               | 默认值  | 说明                                     |
| ----------- | ------------------ | ------- | ---------------------------------------- |
| `height`    | `string \| number` | —       | 视口高度                                 |
| `maxHeight` | `string \| number` | —       | 视口最大高度，内容超出时才显示滚动条     |
| `native`    | `boolean`          | `false` | 使用浏览器原生滚动条                     |
| `always`    | `boolean`          | `false` | 始终显示自定义滚动条                     |
| `minSize`   | `number`           | `20`    | 滑块最小像素长度                         |
| `noresize`  | `boolean`          | `false` | 关闭自动尺寸监听                         |
| `distance`  | `number`           | `0`     | 距离边缘多少像素时触发 `end`             |
| `tag`       | `string`           | `div`   | 内容容器的标签                           |
| `id`        | `string`           | —       | 内容容器的 id                            |
| `classes`   | `{ wrap?, view? }` | —       | 语义化类名，分别作用于滚动容器与内容视图 |
| `styles`    | `{ wrap?, view? }` | —       | 语义化样式，分别作用于滚动容器与内容视图 |

事件：`scroll`（`{ scrollTop, scrollLeft }`）；`end`（`top` / `bottom` / `left` / `right`，需设置 `distance`）。

组件实例方法：`update()`、`handleScroll()`、`scrollTo()`、`setScrollTop()`、`setScrollLeft()`，以及 `wrapRef`。

不设置 `height` 时，可以直接把 `flex: 1` 加在 `Scrollbar` 上填入 flex / grid 的剩余空间；父级需要有确定高度。若再包一层 `div` 并把 `flex: 1` 加在包装层，包装层需要同时设置 `min-height: 0`。

### Copy

```vue
<script setup lang="ts">
import { Copy, useClipboard } from '@wuhu-ui/copy'

const fetchText = async () => 'content from api'
</script>

<template>
  <Copy :text="() => 'hello'" @success="onSuccess" @error="onError" />
  <Copy :text="fetchText" />
</template>
```

默认插槽可拿到 `{ copied, loading, error, copy }` 自定义触发器内容。也可以在任意组件中使用 `useClipboard()` 获取 `copied`、`loading`、`error`、`copy(text)` 和 `reset()`。当 Clipboard API 不可用或失败时，会自动尝试 `document.execCommand('copy')` 降级。

### Highlight

```vue
<script setup lang="ts">
import { Highlight } from '@wuhu-ui/highlight'

const keywords = ['Vue', '组件']
</script>

<template>
  <Highlight
    text="Wuhu Vue UI 是一套 Vue 3 组件库"
    :keywords="keywords"
    whole-word
    :case-sensitive="false"
  />
</template>
```

支持 `keywords: string | string[]`、`caseSensitive`、`wholeWord`、`tag`（默认 `mark`）、`highlightClass` 与 `highlightStyle`。`#highlight` 作用域插槽可完全自定义命中片段：

```vue
<Highlight :text="text" :keywords="keywords">
  <template #highlight="{ text, keyword }">
    <strong :data-keyword="keyword">{{ text }}</strong>
  </template>
</Highlight>
```

文本始终作为文本节点渲染，不会使用 `v-html`。

### Lazy Container

```vue
<LazyContainer
  :root="scrollElement"
  root-margin="80px"
  :threshold="0.2"
  @enter="onEnter"
  @leave="onLeave"
>
  <HeavyView />
  <template #placeholder>
    <Skeleton />
  </template>
</LazyContainer>
```

- 首次进入视口后才渲染默认插槽，内容一旦渲染会保持挂载。
- `enter` / `leave` / `change` 事件会持续触发。
- `once` 为 `true` 时首次进入后断开观察。
- 不支持 IntersectionObserver 的环境会直接标记为可见。

### Resize Container

```vue
<ResizeContainer :debounce="100" box="content-box" @resize="onResize">
  <template #default="{ width, height }">
    {{ width }} × {{ height }}
  </template>
</ResizeContainer>
```

事件参数包含 `width`、`height`、`contentRect`、`borderBoxSize`、`contentBoxSize`、`devicePixelContentBoxSize` 与原始 `entry`。实例方法：`start()`、`stop()`、`measure()`。

### Error Boundary

```vue
<ErrorBoundary title="面板加载失败" :reset-on="route.fullPath" @error="report" @reset="trackReset">
  <YourWidget />
</ErrorBoundary>
```

`#fallback="{ error, info, instance, reset }"` 可替换默认回退界面。`error` 事件参数为 `{ error, info, instance }`。默认 `showDetails=false`，避免向终端用户暴露内部错误信息；调试时可显式开启。错误发生后焦点会移至回退区域。错误边界可捕获后代组件在渲染、生命周期以及同步事件处理器中抛出的错误；无法捕获异步回调（如 `setTimeout`、Promise）中的错误。

### Time

```vue
<script setup lang="ts">
import { Time, formatRelativeTime } from '@wuhu-ui/time'
</script>

<template>
  <Time :time="createdAt" locale="zh-CN" :refresh-interval="30_000" />
</template>
```

- `time` 支持 `Date`、ISO 字符串、毫秒时间戳。
- 默认每 30 秒刷新，`refreshInterval=0` 可关闭。
- `numeric="auto"` 时，中文环境会输出“昨天”“上个月”等自然语言。
- `#default="{ relative, date, now, title, datetime, refresh }"` 可自定义输出。
- 纯函数 `formatRelativeTime(value, now, options)` 可在非组件场景复用。

### Img Comparison Slider

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ImgComparisonSlider } from '@wuhu-ui/img-comparison-slider'

const position = ref(50)
</script>

<template>
  <ImgComparisonSlider
    v-model="position"
    before="/before.jpg"
    after="/after.jpg"
    show-labels
    before-label="Before"
    after-label="After"
    direction="horizontal"
  />
</template>
```

- 支持 `v-model`、鼠标 / 触摸拖拽与键盘（方向键、Home、End、PageUp/PageDown）。
- `direction` 支持 `horizontal` 与 `vertical`。
- `#before`、`#after`、`#handle`、`#before-label`、`#after-label` 插槽可替换图片或手柄内容。
- 事件：`update:modelValue`、`change`、`dragstart`、`dragend`、`error`（参数 `(side, event)`，图片加载失败时触发）。

### Cropper

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Cropper, type CropperExpose } from '@wuhu-ui/cropper'

const cropper = ref<CropperExpose>()

async function exportImage() {
  const dataUrl = await cropper.value?.getCroppedDataUrl({ type: 'image/jpeg', quality: 0.9 })
  if (dataUrl) {
    // 上传或预览 dataUrl
  }
}
</script>

<template>
  <Cropper
    ref="cropper"
    src="/photo.jpg"
    :height="380"
    :aspect-ratio="16 / 9"
    :initial-coverage="0.8"
    @ready="({ image }) => console.log(image)"
    @crop="(data) => console.log(data)"
  >
    <template #default="{ ready, zoomIn, zoomOut, rotateLeft, rotateRight, reset }">
      <div class="toolbar">
        <button :disabled="!ready" @click="zoomOut">缩小</button>
        <button :disabled="!ready" @click="zoomIn">放大</button>
        <button :disabled="!ready" @click="rotateLeft">左转</button>
        <button :disabled="!ready" @click="rotateRight">右转</button>
        <button :disabled="!ready" @click="reset">重置</button>
      </div>
    </template>
  </Cropper>
</template>
```

- Props：`src`、`aspectRatio`、`initialCoverage`、`height`、`rotatable`、`scalable`、`translatable`、`movable`、`resizable`、`zoomable`、`keyboard`、`disabled`、`crossOrigin`、`template`。
- 事件：`ready`、`crop`、`cropend`、`actionstart`、`actionmove`、`actionend`、`error`。
- 实例方法：`getData()`、`setData()`、`setAspectRatio()`、`zoom()`、`rotate()`、`reset()`，以及 `getCroppedCanvas()`、`getCroppedBlob()`、`getCroppedDataUrl()` 三种导出方式。`zoom()` 的缩放范围限制在 `0.1`–`10`；`reset()` 会恢复初始的 contain 适配与居中状态。
- `#default` 插槽接收 `{ ready, cropper, image, selection, canvas, zoomIn, zoomOut, rotateLeft, rotateRight, reset, crop }`，适合放置自定义工具栏。
- 底层实例与自定义元素可分别通过 `getInstance()`、`getImage()`、`getSelection()`、`getCanvas()` 获取。

### Motion Group

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MotionGroup } from '@wuhu-ui/motion-group'

const animation = ref<'fade' | 'slide' | 'scale' | 'flip' | 'bounce' | 'reveal'>('fade')
const cards = ref([
  { id: 1, title: '需求评审' },
  { id: 2, title: '视觉定稿' },
])
</script>

<template>
  <MotionGroup
    :animation="animation"
    direction="vertical"
    :duration="320"
    tag="div"
    class="card-grid"
  >
    <article v-for="card in cards" :key="card.id">
      {{ card.title }}
    </article>
  </MotionGroup>
</template>
```

- 内置动画：`fade`、`slide`、`scale`、`flip`、`bounce`、`reveal`，通过 `animation` 切换，无需额外 CSS。
- `direction` 控制 `slide` 的进入方向；`duration` / `moveDuration` 分别控制进入退出与 FLIP 位移时长。
- `absoluteLeave`（默认开启）让离场项脱离文档流，剩余项可以立即滑动补位；`disabled` 可整体关闭动画。
- 列表项必须提供稳定的 `:key`，这是 TransitionGroup 计算 FLIP 位移的前提；支持全部 TransitionGroup 钩子事件与属性透传。
- 所有动画在 `prefers-reduced-motion: reduce` 下自动降为 1ms。

### Gradient Text

```vue
<GradientText
  :colors="['#4f46e5', '#c026d3', '#0ea5e9']"
  type="linear"
  :angle="110"
  :animate="true"
  :duration="6000"
>
  品牌标题
</GradientText>
```

- `type`：`linear | radial | conic`。
- `gradient` 可直接传入任意 CSS `background-image` 值。
- `animationDirection` 与 `duration`（毫秒，与其他组件的 duration 语义一致）控制动画。
- 支持 `prefers-reduced-motion` 与 forced-colors。

### Number Ticker

```vue
<NumberTicker
  :value="revenue"
  :decimals="1"
  locale="zh-CN"
  prefix="¥ "
  suffix=" 万"
  :duration="800"
/>
```

- 每位数字使用独立的纵向滚轮动画。
- 支持 `startValue`、`animateOnMount`、`useGrouping`、自定义 `easing`。
- 根节点使用 `role="img"` 与最终数值的 `aria-label`，避免逐帧变化干扰屏幕阅读器。

### Sliding Highlight

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SlidingHighlight } from '@wuhu-ui/sliding-highlight'

const nav = ref<InstanceType<typeof SlidingHighlight> | null>(null)
const active = ref('components')
const items = [
  { label: '概览', value: 'overview' },
  { label: '组件', value: 'components', badge: 12 },
  { label: '示例', value: 'examples', badge: 28 },
]

function handleFocusin(event: FocusEvent) {
  const item = (event.target as HTMLElement).closest('[data-nav-item]')?.closest('li')
  if (item) nav.value?.highlight(item as HTMLElement)
}
</script>

<template>
  <SlidingHighlight ref="nav" as="ul" :inset="8" pill-class-name="my-pill" @focusin="handleFocusin">
    <li v-for="item in items" :key="item.value">
      <button type="button" data-nav-item @click="active = item.value">
        {{ item.label }}
        <span v-if="item.badge">{{ item.badge }}</span>
      </button>
    </li>
  </SlidingHighlight>
</template>
```

- 高亮块会跟随鼠标悬浮的**直接子元素**平滑移动；子项结构完全由插槽决定。
- `as="ul"` 时高亮层渲染为 `li`，保证列表语义合法；其他场景渲染为 `div`。
- `inset`：高亮块相对子项的横向外扩距离（px），默认为 `20`。
- `pillClassName` / `pillContainerClassName`：分别自定义滑块与定位层；也可覆盖 `--w-sliding-highlight-bg` 和 `--w-sliding-highlight-radius`。
- 暴露 `highlight(element)` 与 `clear()`，可用于键盘聚焦等非指针场景。
- 自动响应容器与子项的尺寸变化，并尊重 `prefers-reduced-motion`。

### Command Menu

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { CommandMenu, type CommandMenuItem, type CommandMenuKey } from '@wuhu-ui/command-menu'

const selected = ref<CommandMenuKey>()
const items: CommandMenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    description: '查看今日概览与关键指标',
    group: '导航',
    keywords: ['首页', 'home'],
    shortcut: 'G D',
  },
  { key: 'users', label: '用户管理', group: '导航' },
  { key: 'settings', label: '系统设置', group: '设置', disabled: true },
]

function handleSelect(item: CommandMenuItem) {
  // 组件不绑定业务路由，跳转 / 打开弹窗由父组件决定。
  console.log(item.key)
}
</script>

<template>
  <CommandMenu
    v-model="selected"
    :items="items"
    placeholder="搜索命令..."
    @select="handleSelect"
    @search="(value) => console.log(value)"
  />
</template>
```

- `label`、`description` 与 `keywords` 都会参与匹配；中文支持全拼（`gongzuotai`）和首字母（`gzt`）。多个关键词以空格分隔时需同时命中。
- `groupable` 按 `group` 分组，空分组自动隐藏；无 `group` 的项会保留在一个匿名分组中。`filterable=false` 时保留全部项。
- 键盘活动项与鼠标悬浮项是两份独立状态：鼠标高亮优先于键盘活动高亮，移开后恢复活动项。方向键循环导航并跳过禁用项与分组标题。
- 事件：`update:modelValue`、`select`（完整菜单项）、`search`（当前文本）、`escape`、`close`。`escapeBehavior` 支持 `clear | close | none`，默认清空搜索。
- 输入框通过 `aria-activedescendant` 关联活动项；IME 组合输入期间 Enter 不会触发选择。`modelValue` 只表示“已选中项”，键盘移动不会改变它。
- 组件局部变量使用 `--w-command-menu-*` 前缀：`--w-command-menu-active-bg`（键盘活动背景）、`--w-command-menu-hover-bg`（鼠标悬浮背景）与 `--w-command-menu-selected-bg`（选中项背景，优先于悬浮状态）。
- `classes` / `styles` 支持按部件注入：`root`、`search`、`input`、`clear`、`list`、`group`、`groupLabel`、`item`、`empty`，例如 `:classes="{ item: 'my-item' }"`、`:styles="{ list: { maxHeight: '420px' } }"`。

## File Viewer

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FileViewer } from '@wuhu-ui/file-viewer'

const file = ref<File | null>(null)
</script>

<template>
  <FileViewer
    :file="file"
    height="640px"
    locale="zh-CN"
    theme="auto"
    watermark="Wuhu UI"
    @ready="onReady"
    @error="onError"
  />
</template>
```

- 支持图片、音视频、PDF、DOCX / XLSX / PPTX、ODF、RTF、Markdown、代码 / JSON / XML、CSV、HTML、EPUB、字幕、字体与 ZIP / TAR / GZIP。
- PDF 通过可选的 `pdfjs-dist` peer dependency 渲染，并提供原生 `iframe` 降级；未安装时不会影响其他格式。
- Office 与 EPUB 解析完全在浏览器内完成，不依赖服务端。HTML 在无脚本的 sandbox iframe 中预览；EPUB 内容经过标签 / 属性白名单清洗，Office 样式值经过 allow-list 校验，ZIP/TAR 解压带条目数、单条大小与总缓存上限。
- 提供工具栏、页面 / 缩放 / 旋转、下载、打印、新窗口打开、全屏、文件信息、水印、主题切换、加载 / 空 / 错误状态插槽。
- 受控页面、缩放、旋转与主题通过 `page` / `zoom` / `rotation` / `theme` 配合 `update:*` 使用；`reload()`、`getState()`、`download()`、`print()`、`open()` 等方法通过组件实例暴露。
- 主题默认使用组件自带亮 / 暗颜色，不受宿主 `--w-color-*` 亮色变量影响；可通过 `themeVars` 或 `.w-file-viewer` 的 `--w-file-viewer-*` 变量定制。
- 大文件文本 / CSV / Markdown 会按 `options.*.maxBytes` 截断；压缩包默认限制为 10000 个条目、单条 64 MiB，且提供缓存上限。

主要 Props：`src` / `file`、`name`、`type`、`locale`、`theme`、`themeVars`、`options`、`width`、`height`、`watermark`、`allow*`、`show*`、`initialPage`、`initialZoom`、`initialRotation`、`minZoom`、`maxZoom`、`zoomStep`、`keyboard`、`wheelZoom`、`renderers`。

### 按需加载

每个渲染器都是独立的动态 chunk，首次打开对应格式时才加载：

```ts
import { preloadFileViewerRenderer } from '@wuhu-ui/file-viewer'

// 可选：空闲时预取，不阻塞首屏
preloadFileViewerRenderer('pdf')
```

`renderers` 可以按 kind 覆盖任意渲染器（例如接入企业自有转换服务）。自定义渲染器接收统一的 `FileViewerRendererProps`，并需要触发 `ready` / `error` / `page-change` 事件。

### 主题

```vue
<FileViewer
  :theme="theme"
  :theme-vars="{
    '--w-file-viewer-primary': '#16a34a',
    '--w-file-viewer-radius': '10px',
  }"
/>
```

内置 `fileViewerLightTheme` / `fileViewerDarkTheme`，也可以用 `createFileViewerTheme('dark', overrides)` 生成完整主题对象。`theme="auto"` 时跟随系统；组件内切换主题会触发 `update:theme`。

### 国际化

默认英文，内置 `en` 与 `zh-CN`。可以只覆盖需要的文案：

```vue
<FileViewer :locale="locale" :messages="{ viewer: { download: '保存' } }" />
```

```ts
import { registerFileViewerLocale, fileViewerLocales } from '@wuhu-ui/file-viewer'

fileViewerLocales.en // 英文完整文案
registerFileViewerLocale('ja', japaneseMessages)
```

### 事件、插槽与实例方法

- 事件：`load`、`ready`、`error`、`update:page`、`update:zoom`、`update:rotation`、`update:theme`、`fullscreen-change`、`download`、`print`、`open`、`file-drop`（拖放文件时返回第一个 `File`）。
- 插槽：`toolbar`、`toolbar-left`、`toolbar-actions`、`loading`、`empty`、`error`、`watermark`、`status-bar`。
- 实例方法：`reload()`、`zoomIn()`、`zoomOut()`、`resetZoom()`、`rotateLeft()`、`rotateRight()`、`goToPage()`、`download()`、`print()`、`open()`、`toggleFullscreen()`、`setTheme()`、`getState()`。

### 使用 pdf.js（可选）

```ts
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

const options = {
  pdf: {
    pdfjs: pdfjsLib,
    workerSrc: workerUrl,
  },
}
```

`pdfjs-dist` 是可选 peer dependency。构建产物会保留对它的动态 `import`；若消费方未安装该可选依赖，请显式传入 `options.pdf.pdfjs`，或让 PDF 自动降级为浏览器原生 `iframe` 查看器，其他格式不受影响。演示页面包含 Word、Excel、PowerPoint、PDF、EPUB、ZIP、Markdown、代码、CSV、SVG、HTML、字幕与音频样例，也可以直接上传本地文件。

## Gantt

### 数据模型

```ts
import type { GanttTask } from '@wuhu-ui/gantt'

const tasks: GanttTask[] = [
  {
    id: 'product',
    name: '产品规划',
    color: '#4f46e5',
    children: [
      {
        id: 'research',
        name: '用户调研',
        start: '2026-10-01',
        end: '2026-10-05',
        progress: 100,
        assignee: 'Lin',
      },
      {
        id: 'prd',
        name: '需求文档',
        start: '2026-10-06',
        end: '2026-10-10',
        progress: 60,
        dependencies: ['research'],
      },
    ],
  },
  {
    id: 'launch',
    name: '正式发布',
    start: '2026-10-20',
    milestone: true,
    dependencies: ['prd'],
  },
]
```

- `start` / `end` 为包含端点的日历日期。仅传 `start` 时默认一天。
- 分组任务会从子任务自动推导起止时间与加权进度；显式设置的值优先。
- 分组任务的显式 `color` 会被子任务继承。
- `dependencies` 填写前置任务 ID，组件自动绘制依赖箭头。
- `milestone` 渲染为菱形节点。
- `disabled` 可禁用单任务拖拽。
- 其他业务字段可直接附加并被插槽读取。

### 使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Gantt } from '@wuhu-ui/gantt'
import type { GanttTaskUpdateEvent, GanttView } from '@wuhu-ui/gantt'

const view = ref<GanttView>('week')
const selected = ref<string | number | null>(null)

function handleUpdate(event: GanttTaskUpdateEvent) {
  const task = findTask(event.task.id)
  if (!task) return
  task.start = event.start
  task.end = event.end
}
</script>

<template>
  <Gantt
    v-model:selected="selected"
    :tasks="tasks"
    :view="view"
    height="620px"
    locale="zh-CN"
    @task-update="handleUpdate"
  >
    <template #toolbar="{ scrollToToday }">
      <button @click="scrollToToday">定位今天</button>
    </template>
  </Gantt>
</template>
```

### Props

| Prop                    | 类型                         | 默认值    | 说明                              |
| ----------------------- | ---------------------------- | --------- | --------------------------------- |
| `tasks`                 | `GanttTask[]`                | 必填      | 层级任务数据                      |
| `view`                  | `'day' \| 'week' \| 'month'` | `'day'`   | 时间粒度                          |
| `startDate` / `endDate` | `DateLike`                   | —         | 显式时间范围，未传时根据任务推导  |
| `height`                | `string \| number`           | `'600px'` | 根容器高度                        |
| `sidebarWidth`          | `number`                     | `280`     | 左侧任务列宽度                    |
| `rowHeight`             | `number`                     | `44`      | 行高                              |
| `taskHeight`            | `number`                     | `24`      | 任务条高度                        |
| `dayWidth`              | `number`                     | 随视图    | 每天对应像素宽度                  |
| `rangePadding`          | `number`                     | `3`       | 自动时间范围的前后留白天数        |
| `maxRangeDays`          | `number`                     | `3660`    | 渲染范围安全上限，0 表示不限制    |
| `readonly`              | `boolean`                    | `false`   | 禁止拖拽与缩放                    |
| `draggable`             | `boolean`                    | `true`    | 是否允许移动任务                  |
| `resizable`             | `boolean`                    | `true`    | 是否允许调整工期                  |
| `selectable`            | `boolean`                    | `true`    | 是否允许选择任务                  |
| `showProgress`          | `boolean`                    | `true`    | 显示进度                          |
| `showToday`             | `boolean`                    | `true`    | 显示今天线与高亮                  |
| `showWeekends`          | `boolean`                    | `true`    | 周末底色                          |
| `showDependencies`      | `boolean`                    | `true`    | 显示依赖箭头                      |
| `defaultExpandAll`      | `boolean`                    | `true`    | 默认展开分组                      |
| `weekStartsOn`          | `number`                     | `1`       | 0 = 周日，1 = 周一                |
| `locale`                | `string`                     | `'zh-CN'` | 日期格式化 locale                 |
| `selected`              | `GanttTaskId \| null`        | —         | 选中任务，支持 `v-model:selected` |
| `loading`               | `boolean`                    | `false`   | 显示加载遮罩                      |
| `scrollToToday`         | `boolean`                    | `false`   | 挂载后滚动到今天                  |

### 事件

| 事件              | 参数                                                     | 说明                     |
| ----------------- | -------------------------------------------------------- | ------------------------ |
| `update:selected` | `id`                                                     | 选中任务变化             |
| `task-click`      | `(task, MouseEvent)`                                     | 点击任务                 |
| `task-dblclick`   | `(task, MouseEvent)`                                     | 双击任务                 |
| `task-update`     | `{ task, mode, start, end, previousStart, previousEnd }` | 拖拽或缩放结束且日期变化 |
| `task-drag-start` | `(task, mode)`                                           | 开始拖拽                 |
| `task-drag`       | `{ task, mode, start, end }`                             | 拖拽过程中日期预览       |
| `task-drag-end`   | `{ task, mode, start, end, canceled, changed }`          | 拖拽结束                 |
| `expand`          | `(task, expanded)`                                       | 分组展开 / 收起          |
| `scroll`          | `{ scrollTop, scrollLeft }`                              | 滚动                     |

`mode` 为 `'move' | 'resize-start' | 'resize-end'`。组件不会直接修改传入的 `tasks`；请在 `task-update` 中更新业务数据。

- `task.id` 必须唯一；重复 ID 会抛出明确错误，避免选择与依赖指向错误任务。
- 提供 `selected` 时选择状态为受控模式，组件只触发 `update:selected`，由父级回写；传入 `undefined` 时为非受控模式。
- 任务日期按自然日历日解析；`2026-10-01T23:00:00Z`、`2026-10-01 12:00` 都归入 `2026-10-01`。
- 自动推导的范围超过 `maxRangeDays` 时会抛出 `RangeError`，避免意外的多年日视图导致渲染量失控。

### 插槽

- `#toolbar="{ view, startDate, endDate, scrollToToday, scrollToTask }"`
- `#corner="{ taskCount }"`
- `#sidebar="{ task, row, depth, expanded, toggle }"`
- `#task="{ task, row, start, end, progress, color, dragging }"`
- `#tooltip="{ task, row, start, end, progress }"`
- `#empty="{ view, startDate, endDate }"`

### 实例方法

```ts
ganttRef.value?.scrollToDate('2026-10-19', { align: 'center' })
ganttRef.value?.scrollToToday()
await ganttRef.value?.scrollToTask('task-id') // 自动展开祖先分组并定位
ganttRef.value?.getTaskById('task-id')
```

### 交互能力

- 拖拽任务条移动日期，拖拽左右边缘调整工期，按天吸附。
- 拖动靠近视口边缘时自动横向滚动。
- `Esc` 取消拖拽；取消或无位移的拖拽不会触发 `task-update`。
- 甘特图使用 `role="treegrid"`：表头为 `columnheader`，任务行包含 `rowheader` 与 `gridcell`，分组行通过 `aria-level` / `aria-expanded` 表达层级；任务条支持 Enter / Space 选择，`←/→` 按天移动，`Shift + ←/→` 调整结束日期，`Alt + ←/→` 调整开始日期。
- `prefers-reduced-motion` 下禁用非必要动画。

## 可访问性

- 交互组件提供键盘操作与清晰的 focus-visible 样式。
- 图片对比滑块使用 `role="slider"` 与完整 ARIA 状态。
- 滑动高亮使用 `tablist` / `tab` 语义与 roving tabindex。
- 时间组件输出语义化 `<time datetime>`。
- 数字滚动组件向辅助技术暴露最终值，而不是逐帧数字。
- 滚动容器可通过 `focusable` 开启键盘滚动；甘特图支持受控选择与键盘日期调整。
- 支持 `prefers-reduced-motion`；渐变文字额外提供 forced-colors 回退。

## 开发与发布

每个组件包可以独立构建：

```bash
pnpm --filter @wuhu-ui/scrollbar build
```

发布前建议执行：

```bash
pnpm check
pnpm build
```

`packages/*/package.json` 已配置 `files: ["dist"]`、`exports`、`types`、`peerDependencies` 与 `publishConfig.access`。发布时按需使用 pnpm 的 workspace 发布能力即可。

Husky 的 `pre-commit` 会通过 lint-staged 对暂存文件执行 `vp lint` 与 `vp fmt`。

## License

MIT
