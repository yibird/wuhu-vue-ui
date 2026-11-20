# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与语义化版本（0.x 阶段允许破坏性变更）。

## [0.0.1] - 2026-11-20

首个公开版本：31 个独立组件包 + `@wuhu-vue-ui/core`，均支持按需安装、ESM / `.d.ts` / source map / `style.css` 产物与 Node SSR 无样式入口。

### Added

- **基础能力**：`Scrollbar`、`Copy`、`Highlight`、`Time`、`LazyContainer`、`ResizeContainer`、`ErrorBoundary`、`Ellipsis`、`Permission`、`CountDown`、`Loading`、`View`、`Exception`。
- **视觉表达**：`GradientText`、`NumberTicker`、`SlidingHighlight`、`ImgComparisonSlider`、`Ripple`。
- **交互增强**：`CommandMenu`、`ContextMenu`、`Cropper`、`MotionGroup`、`SliderCaptcha`、`TiptapEditor`、`CodeEditor`、`Dock`、`IconPicker`。
- **数据展示**：`Gantt`、`FileViewer`、`OrgTree`、`JsonViewer`。
- `@wuhu-vue-ui/core` 提供 `useControllableState`、`useDismissable`、`useKeyboardNavigation`、`usePointerDrag`、`useDebounce`、`useThrottle`、`clampToViewport` 等公共能力。
- `ContextMenu`：命令式右键菜单，支持分组标题、分隔线、图标 / 后缀、禁用与危险项、键盘导航、`aria-activedescendant`、视口边界约束与语义化 `classes` / `styles`。
- 统一的 `--w-*` 设计令牌、亮 / 暗主题、可访问性焦点态与减少动效处理。
- VitePress 文档站、Playground、单元测试、SSR 与 attrs 契约测试。

### Changed

- 组件统一使用 `<script setup lang="ts">`、`props` 类型集中于 `types.ts`、BEM 类名与独立 `style/index.less`。
- 主题令牌统一由 `playground/src/tokens.less` 提供，组件仅通过 `var(--w-*, fallback)` 消费。
- `View` / `ViewHeader` / `ViewSider` 支持语义化 `classes` / `styles`；`ContextMenu` 事件参数精简为 `open({ x, y })`、`select({ item })` 与无参数的 `close`。
- 滚动条滑块改为中性的半透明墨色，并同步文档主题与各组件 fallback。

### Fixed

- `Scrollbar`：`end` 事件按轴独立触发；滚动视觉更新合并到 rAF；双轴场景下横纵轨道与角落正确避让。
- `Gantt`：汇总任务条两端箭头与条体贴合；依赖连接线颜色调淡；视口边界与拖拽行为修正。
- `ImgComparisonSlider`：根容器裁剪滑块与分割线，避免超出圆角边界。
- `JsonViewer`：修正共享引用被误判为循环引用的问题，补充 `BigInt` 支持与缩进校验。
- `OrgTree`：方向键不再循环越界，右键菜单使用 Teleport 避免被容器裁剪。
- `CommandMenu`：拼音搜索按内容缓存、按需加载 `pinyin-pro`，新增 `pinyinSearch` 选项。
- `SliderCaptcha`：拖拽过程中禁止重复停止，失败图片自动跳过。
- `Loading`：移除 `lockScroll` 属性，全屏显示时统一锁定滚动。
- `Exception`：全局配置与图片注入拆分为独立 Demo，避免示例之间互相污染。
- `FileViewer` / `CodeEditor`：主题仅在初始化或 prop 更新时读取，不注册全局主题监听。
