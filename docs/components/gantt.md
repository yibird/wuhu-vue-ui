# Gantt 甘特图

层级任务、依赖连线、进度、里程碑与日 / 周 / 月视图，支持拖拽排期。

## 完整交互

层级任务、依赖箭头、进度与里程碑；拖动任务条或两端即可调整排期。

<demo vue="../demos/gantt/interactive.vue" />

## 点击任务查看详情

监听 `task-click` 获取被点击的任务，并把任务数据渲染到右侧详情面板。

<demo vue="../demos/gantt/task-panel.vue" />

## 右键菜单

在任务行或任务条上点击右键打开菜单。`contextMenuItems` 支持静态数组或按任务动态生成；选择后触发 `context-menu-select`，也可以用 `#context-menu` 插槽完全自定义菜单内容。

<demo vue="../demos/gantt/context-menu.vue" />

## 只读月视图

`readonly` 关闭拖拽与缩放，适合汇报与只读大屏。

<demo vue="../demos/gantt/readonly.vue" />

## API

### Props

| 属性                    | 类型                         | 默认值       | 说明                             |
| ----------------------- | ---------------------------- | ------------ | -------------------------------- |
| `tasks`                 | `GanttTask[]`                | —（必填）    | 层级任务数据                     |
| `view`                  | `'day' \| 'week' \| 'month'` | `'day'`      | 时间粒度                         |
| `startDate` / `endDate` | `DateLike`                   | —            | 显式显示范围，未传时根据任务推导 |
| `height`                | `string \| number`           | `'600px'`    | 根高度                           |
| `sidebarWidth`          | `number`                     | `280`        | 左侧任务列宽度                   |
| `rowHeight`             | `number`                     | `44`         | 行高                             |
| `taskHeight`            | `number`                     | `24`         | 任务条高度                       |
| `dayWidth`              | `number`                     | 按视图回退   | 每日像素宽度                     |
| `rangePadding`          | `number`                     | `3`          | 自动范围前后留白天数             |
| `maxRangeDays`          | `number`                     | `3660`       | 渲染范围安全上限，`0` 关闭       |
| `readonly`              | `boolean`                    | `false`      | 只读                             |
| `draggable`             | `boolean`                    | `true`       | 允许拖动任务条                   |
| `resizable`             | `boolean`                    | `true`       | 允许拖动两端调整工期             |
| `selectable`            | `boolean`                    | `true`       | 允许选中                         |
| `showProgress`          | `boolean`                    | `true`       | 显示进度                         |
| `showToday`             | `boolean`                    | `true`       | 显示今日线与高亮                 |
| `showWeekends`          | `boolean`                    | `true`       | 高亮周末                         |
| `showDependencies`      | `boolean`                    | `true`       | 绘制依赖箭头                     |
| `defaultExpandAll`      | `boolean`                    | `true`       | 分组默认展开                     |
| `weekStartsOn`          | `number`                     | `1`          | 一周起始日，`0` = 周日           |
| `locale`                | `string`                     | `'zh-CN'`    | `Intl` 日期区域                  |
| `selected`              | `GanttTaskId \| null`        | —            | 受控选中任务                     |
| `loading`               | `boolean`                    | `false`      | 显示加载遮罩                     |
| `scrollToToday`         | `boolean`                    | `false`      | 挂载后滚动到今日                 |
| `ariaLabel`             | `string`                     | `'甘特图'`   | 根区域无障碍名称                 |
| `taskHeaderText`        | `string`                     | `'任务'`     | 任务列表标题                     |
| `todayText`             | `string`                     | `'今天'`     | 今日线提示                       |
| `emptyText`             | `string`                     | `'暂无任务'` | 空状态文本                       |
| `progressText`          | `string`                     | `'进度'`     | 进度标签                         |
| `contextMenuItems`      | `GanttContextMenuItems`      | —            | 右键菜单项，支持静态数组或函数   |

### Emits

| 事件                  | 参数                                   | 说明                   |
| --------------------- | -------------------------------------- | ---------------------- |
| `update:selected`     | `id: GanttTaskId \| null`              | 选中项变化             |
| `task-click`          | `task: GanttTask, event: MouseEvent`   | 点击任务               |
| `task-dblclick`       | `task: GanttTask, event: MouseEvent`   | 双击任务条             |
| `task-contextmenu`    | `task: GanttTask, event: MouseEvent`   | 右键任务行 / 任务条    |
| `context-menu-select` | `GanttContextMenuSelectEvent`          | 选择内置右键菜单项     |
| `task-update`         | `GanttTaskUpdateEvent`                 | 拖拽或键盘调整起止时间 |
| `task-drag-start`     | `task: GanttTask, mode: GanttDragMode` | 拖动开始               |
| `task-drag`           | `GanttTaskDragEvent`                   | 拖动预览               |
| `task-drag-end`       | `GanttDragEndEvent`                    | 拖动结束               |
| `expand`              | `task: GanttTask, expanded: boolean`   | 展开 / 收起分组        |
| `scroll`              | `{ scrollTop, scrollLeft }`            | 滚动（rAF 节流）       |

### Slots

| 插槽           | 参数                                                        | 说明                |
| -------------- | ----------------------------------------------------------- | ------------------- |
| `toolbar`      | `{ view, startDate, endDate, scrollToToday, scrollToTask }` | 顶部工具栏          |
| `corner`       | `{ taskCount }`                                             | 左上角表头          |
| `sidebar`      | `{ task, row, depth, expanded, toggle }`                    | 任务列表单元格      |
| `task`         | `{ task, row, start, end, progress, color, dragging }`      | 任务条 / 里程碑内容 |
| `tooltip`      | `{ task, row, start, end, progress }`                       | 悬停提示            |
| `context-menu` | `{ task, row, close, select }`                              | 自定义右键菜单内容  |
| `empty`        | `{ view, startDate, endDate }`                              | 空状态              |

### 实例方法

| 方法                            | 类型                                          | 说明                       |
| ------------------------------- | --------------------------------------------- | -------------------------- |
| `rows`                          | `readonly: GanttRow[]`                        | 当前可见行                 |
| `scrollRef`                     | `HTMLElement \| undefined`                    | 滚动容器                   |
| `scrollToDate(value, options?)` | `(value: DateLike, options?) => void`         | 滚动到日期，可指定对齐方式 |
| `scrollToToday()`               | `() => void`                                  | 滚动到今日                 |
| `scrollToTask(id)`              | `(id: GanttTaskId) => Promise<void>`          | 展开父级并滚动到任务       |
| `getTaskById(id)`               | `(id: GanttTaskId) => GanttTask \| undefined` | 按 id 查找任务             |

### CSS 变量

| 变量                                        | 默认值                                               | 说明       |
| ------------------------------------------- | ---------------------------------------------------- | ---------- |
| `--w-gantt-grid-line`                       | `var(--w-color-border-subtle, #f1f5f9)`              | 网格线     |
| `--w-gantt-weekend-bg`                      | `var(--w-color-weekend, rgba(100, 116, 139, 0.045))` | 周末背景   |
| `--w-gantt-header-bg`                       | `var(--w-color-surface, #ffffff)`                    | 表头背景   |
| `--w-gantt-dependency-color`                | `var(--w-color-text-tertiary, #94a3b8)`              | 依赖线颜色 |
| `--w-gantt-task-color`                      | `var(--w-color-primary, #4f46e5)`                    | 任务主色   |
| `--w-gantt-task-soft`                       | 由任务色计算的浅色底                                 | 任务条背景 |
| `--w-gantt-task-border`                     | 由任务色计算的边框色                                 | 任务条边框 |
| `--w-gantt-tooltip-bg` / `-text` / `-muted` | 深色提示框配色                                       | 悬停提示   |
| `--w-gantt-header-height`                   | `56px`                                               | 表头高度   |

### 类名

| 类名                                                                        | 说明                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `.w-gantt`                                                                  | 根容器，配合 `.is-loading` / `.is-dragging`                               |
| `.w-gantt__toolbar` / `__scroll` / `__canvas`                               | 工具栏、滚动容器、画布                                                    |
| `.w-gantt__header` / `__corner` / `__header-row--primary` / `--secondary`   | 两级表头                                                                  |
| `.w-gantt__rows` / `__row`                                                  | 行容器；行配合 `.is-group` / `.is-selected`                               |
| `.w-gantt__sidebar`                                                         | 固定任务列                                                                |
| `.w-gantt__timeline` / `__bar`                                              | 时间轴与任务条；任务条配合 `.is-group` / `.is-milestone` / `.is-dragging` |
| `.w-gantt__dependency-path`                                                 | 依赖连线                                                                  |
| `.w-gantt__today-line`                                                      | 今日线                                                                    |
| `.w-gantt__tooltip`                                                         | 悬停提示                                                                  |
| `.w-gantt__context-menu` / `__context-menu-item` / `__context-menu-divider` | 右键菜单                                                                  |
| `.w-gantt__empty` / `__loading`                                             | 空状态与加载状态                                                          |

导出类型：`GanttProps`、`GanttTask`、`GanttRow`、`GanttInstance`、`GanttView`、`GanttDragMode`、`GanttTaskId`、`GanttContextMenuItem`、`GanttContextMenuItems`、`GanttContextMenuSelectEvent`、`GanttContextMenuSlotProps`，以及各事件 / 插槽参数类型。
