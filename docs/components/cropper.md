# Cropper 图片裁剪

基于 Cropper.js 封装，支持拖拽、缩放、旋转、比例锁定与画布导出。

## 内置操作栏

默认显示内置操作栏，提供缩小、放大、向左旋转、向右旋转与重置。`rotatable`、`scalable` 或 `disabled` 会同步禁用对应按钮；设置 `showActionBar=false` 可隐藏，需要完全自定义时使用默认插槽。

<demo vue="../demos/cropper/action-bar.vue" />

## 交互式裁剪与导出

支持拖拽、缩放、旋转、比例锁定与键盘微调，导出结果实时预览。

<demo vue="../demos/cropper/interactive.vue" />

## 固定 16:9 比例

传入 `aspectRatio` 后选择框会锁定比例，仍可移动与缩放。

<demo vue="../demos/cropper/fixed-ratio.vue" />

## 禁止旋转

通过 `rotatable` 等开关精确控制允许的交互。

<demo vue="../demos/cropper/no-rotate.vue" />

## 只读预览

`disabled` 关闭全部交互，适合审核回显等只读场景。

<demo vue="../demos/cropper/disabled.vue" />

## 上传本地图片并导出头像

动态切换 `src`，使用 `getCroppedBlob()` 导出固定 256 × 256 的头像。

<demo vue="../demos/cropper/upload.vue" />

## 通过实例方法控制

通过 ref 调用 `zoom()`、`rotate()`、`setData()`、`reset()`，并监听 `crop` 获取选区数据。

<demo vue="../demos/cropper/methods.vue" />

## API

### Props

| 属性              | 类型                                     | 默认值              | 说明                                           |
| ----------------- | ---------------------------------------- | ------------------- | ---------------------------------------------- |
| `src`             | `string`                                 | —（必填）           | 待裁剪图片 URL                                 |
| `alt`             | `string`                                 | 取自 `labels.image` | 图片替代文本                                   |
| `labels`          | `Partial<CropperLabels>`                 | —                   | 操作栏、缩放、旋转、重置与默认 alt 文案        |
| `height`          | `string \| number`                       | `360`               | 容器高度                                       |
| `aspectRatio`     | `number`                                 | —                   | 锁定选区宽高比                                 |
| `initialCoverage` | `number`                                 | `0.5`               | 选区覆盖比例（0–1），变化时重置选区            |
| `rotatable`       | `boolean`                                | `true`              | 允许旋转                                       |
| `scalable`        | `boolean`                                | `true`              | 允许缩放图片                                   |
| `translatable`    | `boolean`                                | `true`              | 允许拖拽图片                                   |
| `movable`         | `boolean`                                | `true`              | 允许移动选区                                   |
| `resizable`       | `boolean`                                | `true`              | 允许调整选区大小                               |
| `zoomable`        | `boolean`                                | `true`              | 允许滚轮缩放                                   |
| `keyboard`        | `boolean`                                | `true`              | 允许方向键微调                                 |
| `disabled`        | `boolean`                                | `false`             | 禁用全部交互                                   |
| `showActionBar`   | `boolean`                                | `true`              | 显示内置操作栏                                 |
| `crossOrigin`     | `'' \| 'anonymous' \| 'use-credentials'` | `''`                | 图片 `crossorigin` 属性                        |
| `unsafeTemplate`  | `string`                                 | Cropper.js 默认模板 | 自定义 Cropper 模板（可信 HTML，勿传用户输入） |

### Emits

| 事件          | 参数                 | 说明                           |
| ------------- | -------------------- | ------------------------------ |
| `ready`       | `{ cropper, image }` | Cropper 初始化完成             |
| `crop`        | `CropperData`        | 选区变化（交互过程中持续触发） |
| `cropend`     | `CropperData`        | 交互结束时的选区数据           |
| `actionstart` | `Event`              | Canvas 交互开始                |
| `actionmove`  | `Event`              | Canvas 交互移动中              |
| `actionend`   | `Event`              | Canvas 交互结束                |
| `error`       | `Error`              | 初始化或图片加载失败           |

### Slots

| 插槽      | 参数                                                                                                  | 说明                 |
| --------- | ----------------------------------------------------------------------------------------------------- | -------------------- |
| `default` | `{ ready, cropper, image, selection, canvas, zoomIn, zoomOut, rotateLeft, rotateRight, reset, crop }` | 自定义工具栏或覆盖层 |

### 实例方法

| 方法                                            | 类型                                       | 说明                     |
| ----------------------------------------------- | ------------------------------------------ | ------------------------ |
| `getInstance()`                                 | `() => Cropper \| null`                    | 获取 Cropper 实例        |
| `getSelection()` / `getImage()` / `getCanvas()` | 对应元素或 `null`                          | 获取底层元素             |
| `getData()`                                     | `() => CropperData \| null`                | 获取当前选区几何         |
| `setData(data)`                                 | `(data: Partial<CropperData>) => void`     | 设置选区                 |
| `setAspectRatio(ratio)`                         | `(ratio: number) => void`                  | 设置宽高比，`NaN` 解锁   |
| `getCroppedCanvas(options?)`                    | `() => Promise<HTMLCanvasElement \| null>` | 导出 canvas              |
| `getCroppedBlob(options?)`                      | `() => Promise<Blob \| null>`              | 导出 Blob                |
| `getCroppedDataUrl(options?)`                   | `() => Promise<string \| null>`            | 导出 data URL            |
| `zoom(scale)`                                   | `(scale: number) => void`                  | 放大 / 缩小（0.1–10 倍） |
| `rotate(degrees)`                               | `(degrees: number) => void`                | 旋转图片                 |
| `reset()`                                       | `() => void`                               | 重置变换与选区           |
| `retry()`                                       | `() => void`                               | 初始化失败后重试         |

### CSS 变量

| 变量                 | 默认值  | 说明                             |
| -------------------- | ------- | -------------------------------- |
| `--w-cropper-height` | `360px` | 容器高度（由 `height` 内联注入） |
| `--w-cropper-radius` | `12px`  | 容器圆角                         |

### 类名

| 类名                          | 说明                                                |
| ----------------------------- | --------------------------------------------------- |
| `.w-cropper`                  | 根容器（可聚焦），配合 `.is-ready` / `.is-disabled` |
| `.w-cropper__source`          | 隐藏的原始图片                                      |
| `.w-cropper__action-bar`      | 内置操作栏（`role="toolbar"`）                      |
| `.w-cropper__action`          | 操作栏按钮                                          |
| `.w-cropper > cropper-canvas` | Cropper.js 画布                                     |
