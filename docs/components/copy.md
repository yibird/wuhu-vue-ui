# Copy 剪贴板

同步或异步读取内容并写入剪贴板，内置成功、失败与加载状态。

## 基础复制

`showIcon` 默认为 `true`，组件只渲染图标，点击图标触发复制。组件不再内置文字标签，可通过 `prefix`、`suffix` 或默认插槽添加内容。

<demo vue="../demos/copy/basic.vue" />

## 异步 text

`text` 是返回字符串的函数，也可以返回 Promise。异步取数期间展示 loading 状态。

<demo vue="../demos/copy/async.vue" />

## 前缀 / 后缀插槽

`prefix`、`suffix` 插槽用于在图标两侧放置静态内容，不暴露复制状态；需要 `copied`、`loading` 等状态时请使用默认插槽。

<demo vue="../demos/copy/slots.vue" />

## 自定义触发器

设置 `showIcon=false` 后，默认插槽会成为触发按钮的内容，可以完全接管 UI。插槽暴露 `copied`、`loading`、`error` 与 `copy`。

<demo vue="../demos/copy/custom.vue" />

## 禁用状态

`disabled` 会阻止交互，同时保留完整的可访问性信息。

<demo vue="../demos/copy/disabled.vue" />

## API

### Props

| 属性        | 类型                              | 默认值   | 说明                             |
| ----------- | --------------------------------- | -------- | -------------------------------- |
| `text`      | `() => string \| Promise<string>` | —        | 返回要复制的文本，支持同步或异步 |
| `disabled`  | `boolean`                         | `false`  | 禁用复制                         |
| `duration`  | `number`                          | `1800`   | “已复制”状态保持时长（ms）       |
| `showIcon`  | `boolean`                         | `true`   | 显示图标；开启时仅图标触发复制   |
| `ariaLabel` | `string`                          | `'复制'` | 图标触发按钮的无障碍名称         |

### Emits

| 事件      | 参数           | 说明                     |
| --------- | -------------- | ------------------------ |
| `success` | `text: string` | 复制成功                 |
| `error`   | `error: Error` | 获取文本或写入剪贴板失败 |

### Slots

| 插槽      | 参数                               | 说明                                                                |
| --------- | ---------------------------------- | ------------------------------------------------------------------- |
| `prefix`  | —                                  | 图标左侧内容，不暴露复制状态                                        |
| `suffix`  | —                                  | 图标右侧内容；未提供时回退到默认插槽                                |
| `default` | `{ copied, loading, error, copy }` | `showIcon=true` 时作为图标右侧内容；`showIcon=false` 时作为按钮内容 |

### 实例方法

| 方法      | 类型                           | 说明                       |
| --------- | ------------------------------ | -------------------------- |
| `copied`  | `Readonly<Ref<boolean>>`       | 是否处于已复制状态         |
| `loading` | `Readonly<Ref<boolean>>`       | 是否正在获取或写入         |
| `error`   | `Readonly<Ref<Error \| null>>` | 最近一次错误               |
| `copy()`  | `() => Promise<boolean>`       | 执行复制                   |
| `reset()` | `() => void`                   | 重置状态并取消进行中的请求 |

### CSS 变量

无组件专属变量，使用全局设计令牌（如 `--w-color-border`、`--w-radius-sm`、`--w-duration-fast`）。

### 类名

| 类名                     | 说明                                                       |
| ------------------------ | ---------------------------------------------------------- |
| `.w-copy`                | 根容器，配合 `.is-copied` / `.is-loading` / `.is-disabled` |
| `.w-copy__trigger`       | 复制触发点，两种模式均为原生 `<button type="button">`      |
| `.w-copy__trigger--icon` | 图标触发区（无按钮外壳），`showIcon=true` 时使用           |
| `.w-copy__icon`          | 图标容器                                                   |
| `.w-copy__spinner`       | 加载图标                                                   |
| `.w-copy__live`          | 无障碍实时播报区，播报“已复制”或“复制失败”                 |

### 导出工具

`copyToClipboard`、`useClipboard`，以及类型 `UseClipboardOptions`、`CopyProps`、`CopySlotProps`。
