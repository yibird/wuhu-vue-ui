# File Viewer 文件预览

Office、PDF、EPUB、图片、音视频、Markdown、代码与压缩包统一预览。

## 多格式文件预览

切换样例或上传本地文件，渲染器按需加载；支持主题、水印与国际化。

<demo vue="../demos/file-viewer/formats.vue" />

## 精简工具栏

隐藏工具栏与状态栏，只保留内容区域，适合文档内嵌。

<demo vue="../demos/file-viewer/compact.vue" />

## 自定义主题变量

`themeVars` 可在实例级覆盖品牌色与圆角。

`theme="auto"`（默认）会优先跟随应用根节点显式设置的 `data-w-theme="light" | "dark"`，未设置时回退到 `prefers-color-scheme`。组件同时支持 `.is-dark`、`[data-w-theme='dark']` 与系统深色三种暗色令牌入口。

<demo vue="../demos/file-viewer/theme.vue" />

## 图片与 SVG

通过 `options.image` 控制缩放方式与透明背景，位图和 SVG 共用同一套预览与工具栏。

<demo vue="../demos/file-viewer/image.vue" />

## 音频文件

WAV、MP3 等音频使用浏览器原生播放器渲染，并复用统一的下载、打开与键盘能力。

<demo vue="../demos/file-viewer/audio.vue" />

## PDF 分页预览

PDF 使用 pdf.js 渲染，支持文本层、页码、缩放与旋转；也可通过 `options.pdf` 传入自定义 pdf.js 模块。

<demo vue="../demos/file-viewer/pdf.vue" />

## Office 文档

Word、Excel、PowerPoint 在浏览器内解析，`options.office` 可控制纸张、页数上限、网格与工作表标签。

<demo vue="../demos/file-viewer/office.vue" />

## 文本、代码、CSV 与字幕

代码、JSON、CSV、SRT 与 HTML 共用文本渲染器，可按需切换行号与自动换行。

<demo vue="../demos/file-viewer/text.vue" />

## EPUB 电子书

EPUB 按章节分页，工具栏提供上一页 / 下一页与全屏阅读能力。

<demo vue="../demos/file-viewer/epub.vue" />

## 压缩包

ZIP、TAR 会展示目录结构，文本和图片条目可以直接在组件内预览。

<demo vue="../demos/file-viewer/archive.vue" />

## 事件与外部控制

监听 `load`、`ready`、`update:page`、`update:zoom` 等事件，并通过实例方法从外部翻页与缩放。

<demo vue="../demos/file-viewer/events.vue" />

## 自定义工具栏与状态栏

使用 `toolbar-actions` 与 `status-bar` 插槽注入业务操作，基于插槽参数实现水印、缩放与主题控制。

<demo vue="../demos/file-viewer/custom-toolbar.vue" />

## API

### Props

| 属性               | 类型                                                           | 默认值    | 说明                                                  |
| ------------------ | -------------------------------------------------------------- | --------- | ----------------------------------------------------- |
| `src`              | `string`                                                       | `''`      | 远程 URL 或 data URL                                  |
| `file`             | `File \| Blob \| null`                                         | `null`    | 本地文件 / Blob，优先于 `src`                         |
| `name`             | `string`                                                       | `''`      | 覆盖显示名与格式检测名                                |
| `type`             | `string`                                                       | `''`      | 覆盖 MIME 类型                                        |
| `size`             | `number`                                                       | —         | 覆盖文件字节大小                                      |
| `options`          | `FileViewerOptions`                                            | `{}`      | PDF / Office / 文本 / CSV / 图片 / 压缩包等渲染器选项 |
| `locale`           | `string`                                                       | `'en'`    | UI 语言，内置 `en`、`zh-CN`                           |
| `messages`         | `FileViewerMessagesInput`                                      | `{}`      | 语言文案深度局部覆盖                                  |
| `title`            | `string`                                                       | `''`      | 工具栏标题，默认文件名                                |
| `width`            | `string \| number`                                             | `'100%'`  | 组件宽度                                              |
| `height`           | `string \| number`                                             | `'600px'` | 组件高度                                              |
| `theme`            | `'light' \| 'dark' \| 'auto'`                                  | `'auto'`  | 主题；`auto` 跟随应用 `data-w-theme` 或系统偏好       |
| `themeVars`        | `Record<string, string>`                                       | `{}`      | CSS 变量覆盖                                          |
| `showToolbar`      | `boolean`                                                      | `true`    | 显示工具栏                                            |
| `showStatusBar`    | `boolean`                                                      | `true`    | 显示底部状态栏                                        |
| `showFileInfo`     | `boolean`                                                      | `true`    | 显示文件信息                                          |
| `showThemeToggle`  | `boolean`                                                      | `true`    | 显示主题切换按钮                                      |
| `allowDownload`    | `boolean`                                                      | `true`    | 允许下载                                              |
| `allowPrint`       | `boolean`                                                      | `true`    | 允许打印                                              |
| `allowOpen`        | `boolean`                                                      | `true`    | 允许新标签页打开                                      |
| `allowFullscreen`  | `boolean`                                                      | `true`    | 允许全屏                                              |
| `allowZoom`        | `boolean`                                                      | `true`    | 允许缩放（渲染器支持时）                              |
| `allowRotate`      | `boolean`                                                      | `true`    | 允许旋转（渲染器支持时）                              |
| `watermark`        | `string`                                                       | `''`      | 水印文本                                              |
| `watermarkOptions` | `FileViewerWatermarkOptions`                                   | `{}`      | 水印透明度、字号、颜色与旋转角                        |
| `page`             | `number`                                                       | —         | 受控当前页                                            |
| `initialPage`      | `number`                                                       | `1`       | 非受控初始页                                          |
| `zoom`             | `number`                                                       | —         | 受控缩放，`1` = 100%                                  |
| `initialZoom`      | `number`                                                       | `1`       | 非受控初始缩放                                        |
| `rotation`         | `number`                                                       | —         | 受控旋转角度                                          |
| `initialRotation`  | `number`                                                       | `0`       | 非受控初始旋转                                        |
| `minZoom`          | `number`                                                       | `0.25`    | 最小缩放                                              |
| `maxZoom`          | `number`                                                       | `4`       | 最大缩放                                              |
| `zoomStep`         | `number`                                                       | `0.25`    | 缩放步长                                              |
| `renderers`        | `Partial<Record<FileViewerKind, FileViewerRendererComponent>>` | `{}`      | 覆盖或扩展渲染器                                      |
| `keyboard`         | `boolean`                                                      | `true`    | 启用键盘快捷键                                        |
| `wheelZoom`        | `boolean`                                                      | `true`    | Ctrl / Cmd + 滚轮缩放                                 |
| `ariaLabel`        | `string`                                                       | `''`      | 区域无障碍名称，默认使用标题                          |

### Emits

| 事件                          | 参数                                        | 说明                   |
| ----------------------------- | ------------------------------------------- | ---------------------- |
| `load`                        | `{ source, meta }`                          | 源文件创建并开始加载   |
| `ready`                       | `{ source, meta, pageCount, capabilities }` | 渲染器就绪             |
| `error`                       | `Error`                                     | 加载、解析或渲染错误   |
| `update:page`                 | `page: number`                              | 当前页变化             |
| `update:zoom`                 | `zoom: number`                              | 缩放变化               |
| `update:rotation`             | `rotation: number`                          | 旋转变化               |
| `update:theme`                | `light \| dark`                             | 主题变化               |
| `fullscreen-change`           | `fullscreen: boolean`                       | 全屏状态变化           |
| `download` / `print` / `open` | `source: FileViewerSource`                  | 下载、打印、新窗口打开 |
| `file-drop`                   | `file: File`                                | 拖入文件               |

### Slots

| 插槽                               | 参数                                      | 说明                      |
| ---------------------------------- | ----------------------------------------- | ------------------------- |
| `toolbar`                          | `FileViewerToolbarSlotProps`              | 整体替换工具栏            |
| `toolbar-left` / `toolbar-actions` | `FileViewerToolbarSlotProps`              | 工具栏左侧 / 右侧附加内容 |
| `loading` / `empty` / `error`      | `{ source, meta }` / `{ error, retry }`   | 状态区域                  |
| `watermark`                        | `{ text }`                                | 自定义水印                |
| `status-bar`                       | `{ source, meta, page, pageCount, zoom }` | 自定义状态栏              |

`FileViewerToolbarSlotProps` 包含页码、缩放、旋转、主题、能力信息，以及 `zoomIn`、`zoomOut`、`resetZoom`、`rotateLeft`、`rotateRight`、`previousPage`、`nextPage`、`goToPage`、`download`、`print`、`toggleFullscreen`、`toggleTheme`。

### 实例方法

| 方法                                     | 类型                                                | 说明             |
| ---------------------------------------- | --------------------------------------------------- | ---------------- |
| `reload()`                               | `() => void`                                        | 重新加载当前文件 |
| `zoomIn()` / `zoomOut()` / `resetZoom()` | `() => void`                                        | 缩放控制         |
| `rotateLeft()` / `rotateRight()`         | `() => void`                                        | 旋转 90°         |
| `previousPage()` / `nextPage()`          | `() => void`                                        | 翻页             |
| `goToPage(page)`                         | `(page: number) => void`                            | 跳转页码         |
| `download()`                             | `() => Promise<void>`                               | 下载文件         |
| `print()`                                | `() => void`                                        | 打印             |
| `open()`                                 | `() => void`                                        | 新标签页打开     |
| `toggleFullscreen()`                     | `() => Promise<void>`                               | 切换全屏         |
| `toggleTheme()` / `setTheme(theme)`      | `() => void` / `(theme: 'light' \| 'dark') => void` | 主题控制         |
| `getState()`                             | `() => FileViewerState`                             | 读取当前状态快照 |

### CSS 变量

| 变量                                                                             | 默认值                     | 说明                                                                                                                        |
| -------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--w-file-viewer-bg`                                                             | `#f8fafc`                  | 根背景                                                                                                                      |
| `--w-file-viewer-surface`                                                        | `#ffffff`                  | 工具栏 / 卡片表面                                                                                                           |
| `--w-file-viewer-surface-subtle`                                                 | `#f1f5f9`                  | 次级表面                                                                                                                    |
| `--w-file-viewer-surface-hover`                                                  | `#f1f5f9`                  | 悬停表面                                                                                                                    |
| `--w-file-viewer-border`                                                         | `#e2e8f0`                  | 边框                                                                                                                        |
| `--w-file-viewer-text`                                                           | `#0f172a`                  | 主文字                                                                                                                      |
| `--w-file-viewer-text-secondary`                                                 | `#475569`                  | 次要文字                                                                                                                    |
| `--w-file-viewer-text-tertiary`                                                  | `#94a3b8`                  | 弱化文字                                                                                                                    |
| `--w-file-viewer-primary`                                                        | `#4f46e5`                  | 主色                                                                                                                        |
| `--w-file-viewer-primary-soft`                                                   | `rgba(79, 70, 229, 0.1)`   | 主色浅底                                                                                                                    |
| `--w-file-viewer-success` / `--w-file-viewer-warning` / `--w-file-viewer-danger` | 语义色                     | 状态色                                                                                                                      |
| `--w-file-viewer-content-bg`                                                     | `#eef2f7`                  | 预览区背景                                                                                                                  |
| `--w-file-viewer-page-bg`                                                        | `#ffffff`                  | 文档页背景                                                                                                                  |
| `--w-file-viewer-page-shadow`                                                    | 页面阴影                   | 文档页阴影                                                                                                                  |
| `--w-file-viewer-code-bg` / `-text` / `-gutter`                                  | 代码配色                   | 代码视图                                                                                                                    |
| `--w-file-viewer-scrollbar`                                                      | `rgba(100, 116, 139, 0.4)` | 滚动条                                                                                                                      |
| `--w-file-viewer-radius`                                                         | `var(--w-radius-xl, 16px)` | 根圆角                                                                                                                      |
| `--w-file-viewer-mono`                                                           | 等宽字体栈                 | 代码字体                                                                                                                    |
| `--w-file-viewer-watermark-color`                                                | `#0f172a`                  | 水印颜色                                                                                                                    |
| `--w-file-viewer-watermark-opacity` / `-size` / `-rotate`                        | 由 `watermarkOptions` 注入 | 水印样式                                                                                                                    |
| `--w-file-viewer-token-*`                                                        | 语法配色                   | `comment`、`string`、`number`、`keyword`、`literal`、`builtin`、`function`、`tag`、`attr`、`operator`、`decorator`、`regex` |

深色主题会由组件内的 `.is-dark` 自动覆盖上述变量；完整值可通过 `fileViewerDarkTheme` 获取。

### 类名

| 类名                                                                                  | 说明                                                                      |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `.w-file-viewer`                                                                      | 根容器，配合 `.is-light` / `.is-dark` / `.is-fullscreen` / `.has-toolbar` |
| `.w-file-viewer__toolbar` / `__toolbar-left` / `__toolbar-center` / `__toolbar-right` | 工具栏                                                                    |
| `.w-file-viewer__icon-button` / `__page-input` / `__zoom-value`                       | 工具栏控件                                                                |
| `.w-file-viewer__content` / `__renderer`                                              | 预览内容区                                                                |
| `.w-file-viewer__state` / `__loading` / `__spinner`                                   | 空、错误、加载状态                                                        |
| `.w-file-viewer__watermark` / `__info` / `__status`                                   | 水印、信息浮层、状态栏                                                    |
| `.w-file-viewer__code` / `__code-line` / `__line-number`                              | 代码与文本视图                                                            |
| `.w-file-viewer__markdown` / `__html-frame` / `__csv-table`                           | Markdown、HTML、CSV 渲染器                                                |
| `.w-file-viewer__pdf-viewport` / `__pdf-page` / `__pdf-text-layer`                    | PDF 渲染器                                                                |
| `.w-file-viewer__docx-page` / `__xlsx-table` / `__pptx-slide`                         | Office 渲染器                                                             |
| `.w-file-viewer__epub-content` / `__archive-list` / `__subtitle`                      | EPUB、压缩包、字幕渲染器                                                  |

### 导出工具

- 格式检测：`detectFileViewerKind`、`detectFormat`、`detectMimeType`、`toFileViewerMeta`、`fileViewerFormatCatalog`
- 渲染器：`fileViewerRendererKinds`、`loadFileViewerRenderer`、`preloadFileViewerRenderer`
- 主题：`fileViewerLightTheme`、`fileViewerDarkTheme`、`getFileViewerThemeVars`、`createFileViewerTheme`
- 国际化：`en`、`zhCN`、`fileViewerLocales`、`registerFileViewerLocale`、`resolveFileViewerMessages`
- 其它：`createFileViewerSource`、`FileViewerCodeBlock`，以及全部公开类型。
