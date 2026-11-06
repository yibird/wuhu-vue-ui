# Resize Container 尺寸监听

基于 ResizeObserver 的尺寸监听，支持防抖、初始事件与内容盒信息。

## 拖拽改变尺寸

拖拽右下角手柄，容器会实时上报内容盒尺寸。

<demo vue="../demos/resize-container/drag.vue" />

## 防抖与插槽

`debounce` 降低高频回调，默认插槽直接提供宽高。

<demo vue="../demos/resize-container/debounce.vue" />

## 观察盒类型

`box` 可切换 `content-box`、`border-box` 或 `device-pixel-content-box`。

<demo vue="../demos/resize-container/box.vue" />

## API

### Props

| 属性        | 类型                                                          | 默认值          | 说明                        |
| ----------- | ------------------------------------------------------------- | --------------- | --------------------------- |
| `box`       | `'content-box' \| 'border-box' \| 'device-pixel-content-box'` | `'content-box'` | ResizeObserver 观察盒模型   |
| `debounce`  | `number`                                                      | `0`             | 事件防抖延迟（ms）          |
| `immediate` | `boolean`                                                     | `true`          | 挂载时立即触发一次 `resize` |

### Emits

| 事件     | 参数                         | 说明                                                                              |
| -------- | ---------------------------- | --------------------------------------------------------------------------------- |
| `resize` | `ResizeContainerResizeEvent` | 尺寸变化时触发，包含 `width`、`height`、`contentRect`、各 box size 与原始 `entry` |

### Slots

| 插槽      | 参数                       | 说明     |
| --------- | -------------------------- | -------- |
| `default` | `{ width, height, entry }` | 容器内容 |

### 实例方法

| 方法        | 类型                                                | 说明                                           |
| ----------- | --------------------------------------------------- | ---------------------------------------------- |
| `width`     | `Readonly<ShallowRef<number>>`                      | 当前测量宽度                                   |
| `height`    | `Readonly<ShallowRef<number>>`                      | 当前测量高度                                   |
| `entry`     | `Readonly<ShallowRef<ResizeObserverEntry \| null>>` | 最近一次观察记录                               |
| `start()`   | `() => void`                                        | 开始观察                                       |
| `stop()`    | `() => void`                                        | 停止观察并清理定时器                           |
| `getSize()` | `() => ResizeContainerSize`                         | 同步返回最新尺寸，并强制触发一次 `resize` 事件 |

`getSize()` 每次调用都会重新读取尺寸并派发一次 `resize` 事件，即使尺寸与上次相同；返回值与本次事件使用同一份 payload（强制测量时 `entry` 为 `null`）。

### CSS 变量

无。

### 类名

| 类名                  | 说明                     |
| --------------------- | ------------------------ |
| `.w-resize-container` | 根元素（`min-width: 0`） |
