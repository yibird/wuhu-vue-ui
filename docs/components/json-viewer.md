# JSON Viewer JSON 查看器

基于 `@wuhu-ui/code-editor` 的只读 JSON 查看器，自动格式化对象、数组与 JSON 字符串。

## 基础用法

`value` 支持对象、数组或 JSON 字符串；无效的 JSON 字符串会原样展示。

<demo vue="../demos/json-viewer/basic.vue" />

## 自定义配置

支持自定义缩进、高度、主题与 Monaco 选项。即使 `options` 中传入 `readOnly: false`，查看器仍会保持只读。

<demo vue="../demos/json-viewer/advanced.vue" />

## API

### Props

| 属性          | 类型                      | 默认值           | 说明                                |
| ------------- | ------------------------- | ---------------- | ----------------------------------- |
| `value`       | `unknown`                 | —（必填）        | JSON 值或 JSON 字符串               |
| `height`      | `string \| number`        | `'320px'`        | 容器高度，数字按像素处理            |
| `width`       | `string \| number`        | `'100%'`         | 容器宽度，数字按像素处理            |
| `theme`       | `string`                  | `'vs'`           | Monaco 主题标识                     |
| `indent`      | `number`                  | `2`              | 缩进空格数，范围 0–10               |
| `options`     | `Record<string, unknown>` | `{}`             | Monaco 选项；只读相关选项不可被覆盖 |
| `loadingText` | `string`                  | `'JSON 加载中…'` | 加载中的提示文案                    |

### Slots

| 插槽      | 参数               | 说明         |
| --------- | ------------------ | ------------ |
| `loading` | —                  | 自定义加载态 |
| `error`   | `{ error, retry }` | 自定义错误态 |

### 事件与实例方法

- 事件：`ready`（Monaco 实例）、`error`（加载或初始化失败）。
- 方法：`getEditor()`、`focus()`、`layout()`、`getValue()`、`getFormattedValue()`。
- 工具函数 `formatJsonValue(value, indent)` 从 `@wuhu-ui/json-viewer` 导出，可在非组件场景复用。

### 依赖说明

`JsonViewer` 依赖 `@wuhu-ui/code-editor` 与可选 peer `monaco-editor`，Monaco Worker 配置请参考 [Code Editor](/components/code-editor)。
