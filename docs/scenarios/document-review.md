# 文档评审

一个文档评审页面：`FileViewer` 渲染 Markdown 版本说明，右侧 `Scrollbar` 承载批注列表；批注支持右键操作，顶部 `Copy` 与 `Time` 提供链接复制和更新时间。

- 在批注上点击右键，使用独立 `ContextMenu` 打开操作菜单。
- `FileViewer` 的主题与文档站亮暗主题同步。
- 文档样本由 `samples:generate` 生成，构建文档站前会自动创建。

<demo vue="../demos/scenarios/document-review.vue" />
