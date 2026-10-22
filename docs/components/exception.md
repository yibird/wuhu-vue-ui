# Exception 异常页

用于展示请求错误、无权限、页面不存在、服务端错误与网络异常等状态，左侧为 banner 插图，右侧展示标题、描述与操作区域。

## 内置错误类型

`type` 使用语义化字符串，默认会同步切换插图、标题和描述：

- `badRequest`：请求错误
- `forbidden`：无访问权限
- `notFound`：页面不存在
- `serverError`：服务端错误
- `networkError`：网络异常

<demo vue="../demos/exception/types.vue" />

## 自定义内容与操作

可以通过 `title`、`description`、`image` props 覆盖默认内容；也可以使用 `image`、`title`、`description` 和默认插槽完全自定义。默认插槽适合放置「返回首页」「重新加载」等操作。

<demo vue="../demos/exception/custom.vue" />

## API

### Props

| 属性          | 类型                                                                           | 默认值       | 说明                               |
| ------------- | ------------------------------------------------------------------------------ | ------------ | ---------------------------------- |
| `type`        | `'badRequest' \| 'forbidden' \| 'notFound' \| 'serverError' \| 'networkError'` | `'notFound'` | 错误类型，决定默认插图、标题和描述 |
| `title`       | `string`                                                                       | —            | 覆盖默认标题                       |
| `description` | `string`                                                                       | —            | 覆盖默认描述                       |
| `image`       | `string`                                                                       | —            | 自定义 banner 图片 URL / data URI  |
| `imageAlt`    | `string`                                                                       | `''`         | 自定义图片的替代文本，默认使用标题 |
| `imageWidth`  | `string \| number`                                                             | `340`        | banner 区域宽度，数字按像素处理    |
| `showImage`   | `boolean`                                                                      | `true`       | 是否显示插图区域                   |
| `classes`     | `ExceptionClasses`                                                             | —            | 各语义化部分的类名                 |
| `styles`      | `ExceptionStyles`                                                              | —            | 各语义化部分的内联样式             |

### Slots

| 插槽          | 参数                           | 说明                       |
| ------------- | ------------------------------ | -------------------------- |
| `image`       | `{ type, title, description }` | 替换内置插图 / 自定义图片  |
| `title`       | `{ type, title, description }` | 替换标题                   |
| `description` | `{ type, title, description }` | 替换描述                   |
| `default`     | `{ type, title, description }` | 额外内容，通常放置操作按钮 |

### CSS 变量

| 变量                        | 默认值                                          | 说明            |
| --------------------------- | ----------------------------------------------- | --------------- |
| `--w-exception-accent`      | 随类型变化（primary / warning / danger / info） | 强调色          |
| `--w-exception-soft`        | 随类型变化的浅色底                              | 插图底色        |
| `--w-exception-surface`     | `var(--w-color-surface, #ffffff)`               | 插图内部填充色  |
| `--w-exception-image-width` | `340px`                                         | banner 区域宽度 |

### 类名

| 类名                         | 说明                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `.w-exception`               | 根容器，配合 `.w-exception--badRequest/forbidden/notFound/serverError/networkError` |
| `.w-exception__media`        | 左侧 banner 区域                                                                    |
| `.w-exception__illustration` | 内置 SVG 插图                                                                       |
| `.w-exception__image`        | 自定义图片                                                                          |
| `.w-exception__content`      | 右侧内容区域                                                                        |
| `.w-exception__title`        | 标题                                                                                |
| `.w-exception__description`  | 描述                                                                                |
| `.w-exception__extra`        | 默认插槽容器                                                                        |

### 语义化样式

通过 `classes` 与 `styles` 精确定位内部区域，无需依赖全局选择器：

```vue
<Exception
  type="serverError"
  :classes="{
    root: 'my-exception',
    media: 'my-exception__media',
    title: 'my-exception__title',
  }"
  :styles="{
    content: { maxWidth: '640px' },
    title: { color: 'var(--w-color-danger)' },
  }"
/>
```

支持的区域：`root`、`media`、`image`、`illustration`、`content`、`title`、`description`、`extra`。

### 导出类型

`ExceptionProps`、`ExceptionSlotProps`、`ExceptionType`、`ExceptionClasses`、`ExceptionStyles`、`ExceptionClassValue`。
