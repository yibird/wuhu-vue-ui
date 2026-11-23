# 组合场景

组件包彼此独立、各自发布，但在真实产品里它们可以自由组合。本区用三个完整界面展示组合方式：所有数据、布局与事件编排都在文档层完成，不新增包与包之间的依赖。

## 场景目录

- [发布排期](/scenarios/release-planning)：`Gantt` + `CommandMenu` + `NumberTicker` + `Time` + `Copy`
- [文档评审](/scenarios/document-review)：`FileViewer` + `Scrollbar` + `ContextMenu` + `Copy` + `Time`
- [客服工作台](/scenarios/support-console)：`Scrollbar` + `CommandMenu` + `ContextMenu` + `MotionGroup` + `Loading` + `Copy` + `Time`

## 组合原则

1. 组件通过 props、事件、插槽和语义化样式协作，不直接依赖其他组件的源码。
2. 需要跨组件复用的逻辑放在 `@wuhu-vue-ui/core`，视觉复用以插槽与数据驱动为主。
3. 布局、业务数据与适配层（如菜单项映射）留在应用或文档层，保持组件包的独立性。
