# Empty 空状态

用于列表、表格或页面没有数据时的占位展示，内置线稿插图，支持自定义图片、尺寸与操作插槽。

<demo vue="../../playground/src/demos/empty-demo.vue" />

## API

### Props

| 属性          | 类型                   | 默认值       | 说明                                     |
| ------------- | ---------------------- | ------------ | ---------------------------------------- |
| `image`       | `string`               | —            | 自定义图片地址；加载失败时回退到内置插图 |
| `title`       | `string`               | `'暂无数据'` | 标题文案                                 |
| `description` | `string`               | —            | 描述文案，未提供时不渲染描述区域         |
| `size`        | `'sm' \| 'md' \| 'lg'` | `'md'`       | 尺寸变体，控制插图尺寸、文字与间距       |
| `classes`     | `EmptyClasses`         | —            | 各语义化部分的类名                       |
| `styles`      | `EmptyStyles`          | —            | 各语义化部分的内联样式                   |

### Slots

| 插槽          | 参数                     | 说明                       |
| ------------- | ------------------------ | -------------------------- |
| `image`       | `{ title }`              | 替换内置插图 / 自定义图片  |
| `title`       | `{ title }`              | 替换标题                   |
| `description` | `{ title, description }` | 替换描述                   |
| `default`     | —                        | 额外内容，通常放置操作按钮 |

`default` 插槽仅在传入时渲染对应的 `.w-empty__extra` 容器。

### CSS 变量

| 变量                                    | 默认值                             | 说明              |
| --------------------------------------- | ---------------------------------- | ----------------- |
| `--w-empty-image-size`                  | `184px`（`sm` 120px / `lg` 240px） | 插图宽度          |
| `--w-empty-gap`                         | `12px`                             | 内容间距          |
| `--w-empty-padding`                     | `32px 16px`                        | 根容器内边距      |
| `--w-empty-title-size`                  | `15px`                             | 标题字号          |
| `--w-empty-description-size`            | `13px`                             | 描述字号          |
| `--w-empty-color-text`                  | `#0f172a`                          | 标题颜色          |
| `--w-empty-color-text-secondary`        | `#475569`                          | 描述颜色          |
| `--w-empty-illustration-surface`        | `#f5f5f7`                          | 页面 / 投影颜色   |
| `--w-empty-illustration-soft`           | `#dce0e6`                          | 盒子 / 气泡填充色 |
| `--w-empty-illustration-soft-strong`    | `#aeb8c2`                          | 盒子内部填充色    |
| `--w-empty-illustration-gradient-start` | `#e1e6eb`                          | 盒子渐变起始色    |
| `--w-empty-illustration-gradient-end`   | `#f5f5f7`                          | 盒子渐变结束色    |
| `--w-empty-illustration-dot`            | `#ffffff`                          | 气泡圆点颜色      |
| `--w-empty-radius-lg`                   | `12px`                             | 自定义图片圆角    |

### 类名

| 类名                     | 说明           |
| ------------------------ | -------------- |
| `.w-empty`               | 根容器         |
| `.w-empty.is-sm`         | 小尺寸         |
| `.w-empty.is-md`         | 中尺寸（默认） |
| `.w-empty.is-lg`         | 大尺寸         |
| `.w-empty__image`        | 自定义图片     |
| `.w-empty__illustration` | 内置 SVG 插图  |
| `.w-empty__title`        | 标题           |
| `.w-empty__description`  | 描述           |
| `.w-empty__extra`        | 默认插槽容器   |

### 语义化样式

通过 `classes` 与 `styles` 精确定位内部区域，无需依赖全局选择器：

```vue
<Empty
  title="暂无数据"
  :classes="{
    root: 'my-empty',
    image: 'my-empty__image',
    title: 'my-empty__title',
  }"
  :styles="{
    title: { color: 'var(--w-color-primary)' },
    extra: { marginTop: '16px' },
  }"
/>
```

支持的区域：`root`、`image`、`title`、`description`、`extra`。`image` 同时作用于自定义图片与内置插图。

### 导出

组件 `Empty`，以及类型 `EmptyProps`、`EmptySize`、`EmptyClasses`、`EmptyStyles`、`EmptyClassValue`、`EmptyImageSlotProps`、`EmptyTitleSlotProps`、`EmptyDescriptionSlotProps`。
