# CodeEditor 代码编辑器

基于 Monaco Editor 封装的代码编辑器，支持 `v-model` 双向绑定、语言与主题切换、只读模式，并在浏览器端按需加载 Monaco。

<demo vue="../../playground/src/demos/code-editor-demo.vue" />

## 安装

`monaco-editor` 是可选 peer 依赖，按需安装：

```bash
pnpm add monaco-editor
```

组件内部通过 `import('monaco-editor')` 动态加载，因此不会把 Monaco 打进组件库产物；在 SSR / 无 `window` 环境中会自动跳过加载。

## Monaco Worker 配置

Monaco 的语言服务运行在 Web Worker 中，消费者需要自行提供 worker 入口。以 Vite + Monaco 0.52+ 为例，在应用入口（组件挂载之前）加入：

```ts
// main.ts
import editorWorker from 'monaco-editor/editor/editor.worker?worker'
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  },
}
```

只使用 `plaintext` / `markdown` 等模式时注册 `editor.worker` 即可；需要 JSON / CSS / HTML 的语言服务时，按所用 Monaco 版本的导出路径补充对应 worker。不同 Monaco 版本的 worker 路径可能不同，请以实际包结构为准。使用其他构建工具时，请参考 Monaco 官方的 worker 集成说明。

## JSON Viewer

JSON 查看器已抽离为独立包 `@wuhu-vue-ui/json-viewer`，内部基于 `CodeEditor` 封装。详见 [JSON Viewer](/components/json-viewer)。

## API

### Props

| 属性              | 类型                      | 默认值            | 说明                                                                                                                                                            |
| ----------------- | ------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`      | `string`                  | `''`              | 编辑器内容，配合 `v-model` 使用                                                                                                                                 |
| `language`        | `string`                  | `'plaintext'`     | Monaco 语言标识，如 `typescript`、`json`                                                                                                                        |
| `theme`           | `string`                  | `'vs'`            | Monaco 主题标识，如 `vs-dark`、`hc-black`；`auto` 会根据 `data-w-theme` / `prefers-color-scheme` 解析为 `vs` 或 `vs-dark`；主题是全局的，会影响页面上所有编辑器 |
| `readOnly`        | `boolean`                 | `false`           | 只读模式                                                                                                                                                        |
| `disabled`        | `boolean`                 | `false`           | 禁用编辑器（隐含只读，并添加禁用样式）                                                                                                                          |
| `height`          | `string \| number`        | `'320px'`         | 容器高度，数字按像素处理                                                                                                                                        |
| `width`           | `string \| number`        | `'100%'`          | 容器宽度，数字按像素处理                                                                                                                                        |
| `options`         | `Record<string, unknown>` | `{}`              | 透传给 `monaco.editor.create` 的选项                                                                                                                            |
| `automaticLayout` | `boolean`                 | `true`            | 容器尺寸变化时自动重新布局                                                                                                                                      |
| `loadingText`     | `string`                  | `'编辑器加载中…'` | 加载中的提示文案                                                                                                                                                |

### Emits

| 事件                | 参数     | 说明                  |
| ------------------- | -------- | --------------------- |
| `update:modelValue` | `value`  | 编辑器内容变化        |
| `change`            | `value`  | 编辑器内容变化        |
| `ready`             | `editor` | Monaco 编辑器创建完成 |
| `error`             | `Error`  | 动态加载或初始化失败  |
| `focus`             | —        | 编辑器获得焦点        |
| `blur`              | —        | 编辑器失去焦点        |

### Slots

| 插槽      | 参数               | 说明               |
| --------- | ------------------ | ------------------ |
| `loading` | —                  | 自定义加载状态     |
| `error`   | `{ error, retry }` | 自定义加载失败状态 |

### 实例方法

通过模板 `ref` 访问：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { CodeEditor } from '@wuhu-vue-ui/code-editor'
import type { CodeEditorExpose } from '@wuhu-vue-ui/code-editor'

const editorRef = ref<CodeEditorExpose | null>(null)
</script>

<template>
  <CodeEditor ref="editorRef" v-model="code" language="typescript" />
</template>
```

| 方法 / 属性             | 类型                                     | 说明                   |
| ----------------------- | ---------------------------------------- | ---------------------- |
| `editor`                | `ShallowRef<CodeEditorInstance \| null>` | 底层 Monaco 编辑器实例 |
| `getEditor()`           | `() => CodeEditorInstance \| null`       | 获取编辑器实例         |
| `focus()`               | `() => void`                             | 聚焦编辑器             |
| `layout()`              | `() => void`                             | 手动触发重新布局       |
| `getValue()`            | `() => string`                           | 获取当前内容           |
| `setValue(value)`       | `(value: string) => void`                | 设置内容               |
| `setLanguage(language)` | `(language: string) => void`             | 切换语言               |
| `setTheme(theme)`       | `(theme: string) => void`                | 切换主题               |

## 说明

- 组件会创建并持有 Monaco 文本模型；卸载时调用 `editor.dispose()` 并销毁该模型。
- `modelValue` 的外部变化通过 `setValue` 同步，并抑制由此产生的 `update:modelValue` / `change` 回传，避免循环更新。
- `language`、`theme`、`readOnly`、`disabled`、`options`、`automaticLayout` 变化时会同步到已有实例。
- 根节点为单根元素，支持 `class` 与 `style` 透传；`is-ready`、`is-loading`、`is-error`、`is-disabled` 可用于样式定制。
