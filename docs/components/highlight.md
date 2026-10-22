# Highlight 文本高亮

安全的多关键词高亮，支持大小写敏感、整词匹配与自定义标签。

## 交互式关键词高亮

输入多个关键词（空格分隔），并切换整词匹配与大小写敏感。

<demo vue="../demos/highlight/interactive.vue" />

## 自定义高亮样式

通过 `highlightStyle` 或 `highlightClass` 接入项目自己的设计语言。

<demo vue="../demos/highlight/custom-style.vue" />

## 自定义标签

通过 `tag` 替换默认的 `<mark>`，例如使用 `<strong>` 表达强调语义。

<demo vue="../demos/highlight/custom-tag.vue" />

## API

### Props

| 属性             | 类型                               | 默认值   | 说明                              |
| ---------------- | ---------------------------------- | -------- | --------------------------------- |
| `text`           | `string`                           | `''`     | 待高亮的纯文本                    |
| `keywords`       | `string \| string[]`               | `[]`     | 一个或多个关键词，重叠时长者优先  |
| `caseSensitive`  | `boolean`                          | `false`  | 是否区分大小写                    |
| `wholeWord`      | `boolean`                          | `false`  | 是否仅匹配完整单词（含 CJK 边界） |
| `tag`            | `string`                           | `'mark'` | 匹配片段使用的标签                |
| `highlightClass` | `string`                           | —        | 追加到匹配片段的类名              |
| `highlightStyle` | `CSSProperties \| CSSProperties[]` | —        | 匹配片段的内联样式                |

### Emits

无。

### Slots

| 插槽        | 参数                                | 说明               |
| ----------- | ----------------------------------- | ------------------ |
| `highlight` | `{ text, keyword, index, segment }` | 自定义匹配片段渲染 |

### 实例方法

| 方法       | 类型                              | 说明                          |
| ---------- | --------------------------------- | ----------------------------- |
| `segments` | `ComputedRef<HighlightSegment[]>` | 分词结果（匹配 / 未匹配片段） |

### CSS 变量

| 变量                       | 默认值                                                       | 说明         |
| -------------------------- | ------------------------------------------------------------ | ------------ |
| `--w-highlight-background` | `var(--w-color-primary-soft-hover, rgba(79, 70, 229, 0.16))` | 高亮背景色   |
| `--w-highlight-color`      | `inherit`                                                    | 高亮文字颜色 |

### 类名

| 类名                 | 说明                         |
| -------------------- | ---------------------------- |
| `.w-highlight`       | 根元素                       |
| `.w-highlight__mark` | 匹配片段（默认 `mark` 标签） |
