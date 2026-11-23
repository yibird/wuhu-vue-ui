# 客服工作台

一个客服会话页面：`Scrollbar` 承载会话列表，`CommandMenu` 搜索并切换会话，消息区域切换时显示内联 `Loading`；右侧快捷回复使用 `MotionGroup` 做进出场，消息右键操作使用独立 `ContextMenu`。

- 点击左侧会话切换上下文，消息区会短暂显示加载状态。
- 搜索会话名称或企业名可直接切换。
- 快捷回复可插入与移除，动画只表达列表变化，不添加装饰效果。

<demo vue="../demos/scenarios/support-console.vue" />
