# 发布排期

一个版本发布页面：`Gantt` 展示阶段、任务、依赖与里程碑；右侧用 `CommandMenu` 定位任务，`NumberTicker` 展示指标，`Time` 与 `Copy` 负责同步时间与发布编号。

- 在任务条上点击可查看负责人与进度。
- 在右侧搜索任务名称或负责人（如“前端”“测试”），选中后自动滚动到对应任务。
- Gantt 使用内置右键菜单，不与独立 `ContextMenu` 叠加，避免双菜单。

<demo vue="../demos/scenarios/release-planning.vue" />
