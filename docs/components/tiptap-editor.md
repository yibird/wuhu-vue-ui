# Tiptap Editor 富文本编辑器

基于 [Tiptap](https://tiptap.dev/) 的开箱即用富文本编辑器，内置段落样式、字体与字号、标题、行内格式、上下标、缩进、列表、任务列表、表格、图片 / 视频 / 附件、格式刷、表情、文字颜色、高亮、引用、代码块、链接、对齐、打印、全屏、AI 指令、字数统计与撤销重做，通过 `v-model:value` 以 HTML 双向同步。

<demo vue="../../playground/src/demos/tiptap-editor-demo.vue" />

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { TiptapEditor } from '@wuhu-vue-ui/tiptap-editor'

const content = ref('<p>开始编辑…</p>')
</script>

<template>
  <TiptapEditor v-model:value="content" placeholder="请输入内容…" />
</template>
```

## 边编辑边预览

设置 `preview` 后编辑器右侧会显示只读预览，内容变化时实时同步。预览复用同一套 Tiptap 扩展，标题、列表、表格、图片等格式与编辑区一致；窄屏下自动改为上下排列。工具栏内置预览开关，可随时打开或关闭预览；`preview` 支持 `v-model:preview`，便于外部同步状态。

中间分隔条可拖拽调整编辑区与预览区宽度（左右各保留 20%–80%），也支持 `ArrowLeft` / `ArrowRight` 微调、`Shift` 加速以及 `Home` / `End` 跳到边界。

```vue
<TiptapEditor v-model:value="content" :preview="true" :min-height="240" />
```

<demo vue="../demos/tiptap-editor/preview.vue" />

## 图片上传

工具栏的图片按钮支持两种插入方式：

1. 选择本地文件：默认以 Base64 data URL 插入，配置 `imageUpload` 后走自定义上传接口。
2. 粘贴图片地址：直接插入远程图片。

同时支持把图片**拖拽**到编辑区，或直接从剪贴板**粘贴**图片。未配置 `imageUpload` 时同样以 Base64 插入，开箱即用。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { TiptapEditor } from '@wuhu-vue-ui/tiptap-editor'

const content = ref('')

async function uploadImage(file: File) {
  const body = new FormData()
  body.append('file', file)
  const response = await fetch('/api/upload', { method: 'POST', body })
  if (!response.ok) throw new Error('上传失败')
  const data = (await response.json()) as { url: string }
  return data.url
}
</script>

<template>
  <TiptapEditor
    v-model:value="content"
    :image-upload="uploadImage"
    image-accept="image/png,image/jpeg"
    :image-max-size="5"
  />
</template>
```

- `imageMaxSize` 默认 `10`（MB），设为 `0` 可关闭大小校验。
- 上传开始 / 成功 / 失败分别触发 `image-upload-start`、`image-upload-success`、`image-upload-error`。
- `imageUpload` 的第二个参数是 `AbortSignal`，组件卸载时会自动 abort，可直接传给 `fetch`。
- 拖拽或粘贴上传时，编辑区会显示上传中状态；拖拽进入时显示投放遮罩。
- 未配置 `imageUpload` 时会读取为 Base64，大图片请注意存储体积。

## 字体

工具栏的「字体」菜单内置以下字体栈：

| 选项     | CSS 字体栈                                                         |
| -------- | ------------------------------------------------------------------ |
| 默认字体 | 移除字体标记，回到编辑器默认字体                                   |
| 微软雅黑 | `"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif` |
| 宋体     | `SimSun, "Songti SC", "Noto Serif SC", serif`                      |
| 楷体     | `KaiTi, "Kaiti SC", "Noto Serif SC", serif`                        |
| 仿宋     | `FangSong, "FangSong_GB2312", serif`                               |
| Arial    | `Arial, Helvetica, sans-serif`                                     |
| Georgia  | `Georgia, "Times New Roman", serif`                                |
| 等宽     | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`         |

选择字体后写入 `textStyle` 标记，输出为 `<span style="font-family: …">`；选择「默认字体」只移除字体，不影响颜色等其他文本样式。字体栈同时包含 Windows、macOS 与通用回退，未安装选定字体的系统会按顺序降级。可以通过导出的 `TIPTAP_FONT_FAMILIES` 查看或复用这份列表。

「字号」菜单提供 12–32px 的常用档位，选择「默认」会移除字号并保留其他文本样式，输出为 `<span style="font-size: …">`。

## 表格与任务列表

- 悬浮或点击工具栏的表格按钮会展开 8×8 尺寸网格，移动指针预览 `N 行 x M 列` 并点击插入对应大小的表格。
- 光标位于表格内时，基于 Tiptap 的 BubbleMenu 插件在单元格附近浮出操作栏，提供插入/删除行、插入/删除列、切换表头行与删除表格；操作栏挂载到 `body`，不会被编辑区裁剪，并会自动翻转以保持在编辑区域内。
- 任务列表支持勾选、嵌套与完成态划线。
- 颜色按钮打开系统取色器，高亮按钮切换默认高亮色。
- 文本选区使用主题色高亮，与组件整体视觉一致。

## 字数统计与全屏

- `showCount` 默认开启，底部显示字符数与词数（优先使用 `Intl.Segmenter` 分词）。
- `allowFullscreen` 默认开启；全屏时按 `Esc` 退出，并自动锁定页面滚动。

## 只读与禁用

- `editable=false`：隐藏工具栏，内容不可编辑，保留原有排版。
- `disabled`：在只读基础上整体降低不透明度，用于表达不可用状态。

```vue
<TiptapEditor :value="html" :editable="false" />
<TiptapEditor :value="html" disabled />
```

## 自定义工具栏

`toolbar` 插槽可以完全替换内置工具栏，并拿到 Tiptap 的 `editor` 实例、当前预览状态与切换方法：

```vue
<TiptapEditor v-model:value="content">
  <template #toolbar="{ editor, preview, togglePreview }">
    <button type="button" @click="editor.chain().focus().toggleBold().run()">加粗</button>
    <button type="button" :aria-pressed="preview" @click="togglePreview">
      {{ preview ? '关闭预览' : '打开预览' }}
    </button>
  </template>
</TiptapEditor>
```

## 工具栏能力

| 分组 | 能力                                                                         |
| ---- | ---------------------------------------------------------------------------- |
| 历史 | 撤销、重做、格式刷                                                           |
| 样式 | 段落样式（正文 / 标题 1–3）、字体、字号                                      |
| 格式 | 加粗、斜体、下划线、删除线、行内代码、上标、下标、高亮、文字颜色             |
| 块级 | 无序列表、有序列表、任务列表、引用、代码块、分割线、增加 / 减少缩进          |
| 插入 | 链接、图片（上传 / URL / 拖拽 / 粘贴）、视频、附件、表格（悬停选尺寸）、表情 |
| 对齐 | 左对齐、居中、右对齐                                                         |
| 其他 | 预览开关、打印、全屏、清除格式、AI 指令                                      |

段落、字体与字号使用原生 `<select>`，选择后立即应用到当前选区；上下标、缩进、表情与 AI 均可通过键盘聚焦操作。所有按钮都带有 `aria-label`、`title` 与 `aria-pressed`。

## 格式刷

点击「格式刷」会记录当前选区的行内格式（加粗、斜体、颜色、字号等），随后框选任意文本即可套用同样的格式；再次点击或按 `Esc` 取消。

## 视频、附件、打印与 AI

- 「视频」通过 URL 插入 `<video controls>` 块，支持 mp4 / webm 等浏览器原生可播放格式。
- 「附件」通过 URL + 可选名称插入下载链接块，输出 `<a data-attachment download>…`。
- 「打印」只在隐藏 iframe 中渲染当前文档 HTML，并附带精简打印样式，不会把页面导航或工具栏送到打印机。
- 「AI」打开指令输入框，提交后触发组件的 `ai` 事件，由使用方接入自己的模型服务：

```vue
<TiptapEditor v-model:value="content" @ai="handleAiRequest" />

<script setup lang="ts">
import type { TiptapEditorAiRequest } from '@wuhu-vue-ui/tiptap-editor'

async function handleAiRequest({ editor, prompt }: TiptapEditorAiRequest) {
  const result = await myModel.complete(prompt)
  editor.chain().focus().insertContent(result).run()
}
</script>
```

## API

### Props

| 属性              | 类型                                                              | 默认值          | 说明                                             |
| ----------------- | ----------------------------------------------------------------- | --------------- | ------------------------------------------------ |
| `value`           | `string`                                                          | `''`            | HTML 内容（`v-model:value`）                     |
| `placeholder`     | `string`                                                          | `'请输入内容…'` | 空文档时的占位提示                               |
| `editable`        | `boolean`                                                         | `true`          | 是否允许编辑                                     |
| `disabled`        | `boolean`                                                         | `false`         | 是否禁用编辑并降低不透明度                       |
| `toolbar`         | `boolean`                                                         | `true`          | 是否显示内置工具栏                               |
| `preview`         | `boolean`                                                         | `false`         | 是否显示实时预览，支持 `v-model:preview`         |
| `minHeight`       | `string \| number`                                                | `160`           | 编辑区最小高度                                   |
| `maxHeight`       | `string \| number`                                                | `520`           | 编辑区最大高度，超出后内部滚动                   |
| `ariaLabel`       | `string`                                                          | —               | 编辑区无障碍名称，默认取 `labels.editor`         |
| `labels`          | `Partial<TiptapEditorLabels>`                                     | —               | 覆盖工具栏与提示文案                             |
| `imageUpload`     | `(file: File, signal?: AbortSignal) => string \| Promise<string>` | —               | 自定义图片上传，返回图片 URL                     |
| `imageAccept`     | `string`                                                          | `'image/*'`     | 文件选择器 accept 过滤                           |
| `imageMaxSize`    | `number`                                                          | `10`            | 图片大小上限（MB），`0` 表示不限制               |
| `showCount`       | `boolean`                                                         | `true`          | 是否显示字符 / 词数统计                          |
| `allowFullscreen` | `boolean`                                                         | `true`          | 是否显示全屏按钮                                 |
| `extensions`      | `Extensions`                                                      | —               | 追加到内置扩展之后的 Tiptap 扩展（仅初始化生效） |

### 事件

| 事件                   | 参数                       | 说明                   |
| ---------------------- | -------------------------- | ---------------------- |
| `update:value`         | `html: string`             | HTML 内容变化          |
| `update:preview`       | `preview: boolean`         | 预览开关状态变化       |
| `change`               | `html: string`             | 内容变化（与上者同步） |
| `ready`                | `editor: Editor`           | 编辑器创建完成         |
| `focus`                | `editor: Editor`           | 编辑器获得焦点         |
| `blur`                 | `editor: Editor`           | 编辑器失去焦点         |
| `ai`                   | `TiptapEditorAiRequest`    | 工具栏提交了 AI 指令   |
| `image-upload-start`   | `file: File`               | 图片上传开始           |
| `image-upload-success` | `url: string, file: File`  | 图片上传成功           |
| `image-upload-error`   | `error: Error, file: File` | 图片读取 / 上传失败    |

### 插槽

| 插槽      | 参数         | 说明           |
| --------- | ------------ | -------------- |
| `toolbar` | `{ editor }` | 替换内置工具栏 |

### Expose

| 方法 / 属性                               | 说明                                  |
| ----------------------------------------- | ------------------------------------- |
| `editor`                                  | Tiptap `Editor` 实例，挂载前为 `null` |
| `focus(position?)`                        | 聚焦编辑器                            |
| `blur()`                                  | 失焦                                  |
| `clearContent(emitUpdate = true)`         | 清空内容                              |
| `setContent(content, emitUpdate = false)` | 设置内容（HTML 或 JSON）              |
| `getHTML()`                               | 获取当前 HTML                         |
| `getJSON()`                               | 获取 Tiptap JSONContent               |

### 扩展与体积

默认注册了 StarterKit、TextAlign、TextStyle/Color、内置的字体 / 字号 / 缩进扩展、上下标标记、Highlight、Image、`@tiptap/extension-table` 的 Table/TableRow/TableHeader/TableCell、TaskList/TaskItem 与 Placeholder。Tiptap/ProseMirror 运行时约 **139 kB gzip**（其中图片/表格/任务列表等可选扩展约 18 kB gzip），组件自身约 10.5 kB gzip JS + 2.9 kB gzip CSS。

- 通过 `extensions` 追加 mention、代码高亮等自定义扩展。
- 工具栏支持方向键 / Home / End 在按钮间移动，只保留一个 Tab 停靠点。
- 弹层浮在内容上方，不推挤正文；点击外部或按 `Esc` 可关闭。

### 安全提示

`v-model:value` 输出的是 HTML。如果要把内容持久化并在其他位置渲染，请先做 HTML sanitize；组件本身不对输出做消毒。

### 依赖说明

`@tiptap/vue-3`、`@tiptap/starter-kit`、`@tiptap/extension-placeholder`、`@tiptap/extension-text-align`、`@tiptap/extension-image`、`@tiptap/extension-table`、`@tiptap/extension-task-list`、`@tiptap/extension-task-item`、`@tiptap/extension-text-style` 与 `@tiptap/extension-highlight` 作为组件包的运行时依赖安装，使用方无需单独配置。
