# Wuhu Vue UI 组件 Review

审查维度：视觉效果与 UI 美观度、交互便捷性、性能、代码可读性与可维护性、内存占用、API 设计。

优先级别：**P1** 交互/正确性问题；**P2** 值得修复的 API、体验或性能问题；**P3** 一致性与细节打磨。

## 分批计划

| 批次 | 范围                                                                                                  | 状态   |
| ---- | ----------------------------------------------------------------------------------------------------- | ------ |
| 1    | core、scrollbar、copy、highlight、time                                                                | 已完成 |
| 2    | loading、count-down、ellipsis、lazy-container、resize-container、error-boundary、permission           | 已完成 |
| 3    | view、icon、exception、gradient-text、number-ticker、sliding-highlight、img-comparison-slider、ripple | 已完成 |
| 4    | command-menu、cropper、motion-group、slider-captcha、tiptap-editor、code-editor                       | 已完成 |
| 5    | dock、icon-picker、gantt、file-viewer                                                                 | 已完成 |
| 6    | org-tree、json-viewer + 跨包令牌/API/性能横向总结                                                     | 待开始 |

---

### Icon

**P3 · 无 `label` 时插槽内容也会被整体隐藏**
`packages/icon/src/Icon.vue:42-49`
根节点在无 `label` 时设置 `aria-hidden="true"`，包括用户通过默认插槽传入的、本身带语义的图标/图片。建议文档明确：插槽模式表示图标有语义时传 `label`，或把 `aria-hidden` 的控制权交给调用方。

**P3 · `size` 以内联宽高约束根容器**
`Icon.vue:36-40`、`packages/icon/src/style/index.less:3-16`
类名图标/UnoCSS 图标通常自带 `1em` 尺寸，内联宽高会覆盖它们；需要调用方显式传 `size`。建议在文档中说明“size 优先于图标字体自带尺寸”。

正面：固定 `<span>` 根节点、slot/class 两种来源、内置 SVG 100% 填充、`focusable="false"` 与 reduced-motion 都已覆盖。

---
