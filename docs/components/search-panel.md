# Search Panel 搜索面板

以 CommandMenu 为内核的模态搜索面板，内置 `Mod+K` 唤起、backdrop 关闭、焦点循环与恢复、body 滚动锁。

## 基础用法

默认注册 `Mod+K`（macOS 为 `⌘K`，其他平台为 `Ctrl+K`）全局快捷键，也可通过按钮或 `v-model:open` 控制。面板默认没有标题栏，直接以搜索框开始；选择命令后默认关闭面板。

<demo vue="../demos/search-panel/basic.vue" />

## 自定义头部、列表项与底部

通过 `#header`、`#item`、`#footer` 接管面板框架；`#item` 只替换行内容，行外层仍由 CommandMenu 管理键盘导航与选择。使用 `shortcut="false"` 关闭全局快捷键。

<demo vue="../demos/search-panel/custom.vue" />

## 受控开关与实例方法

`v-model:open` 受控时，实例的 `open()` / `close()` 只发出 `update:open`，由使用方决定是否更新状态；`close` 事件会带上关闭原因。

<demo vue="../demos/search-panel/controlled.vue" />

## API

### Props

| 属性            | 类型                    | 默认值               | 说明                                                   |
| --------------- | ----------------------- | -------------------- | ------------------------------------------------------ |
| `items`         | `CommandMenuItem[]`     | —（必填）            | 透传给 CommandMenu 的命令列表                          |
| `value`         | `string \| number`      | —                    | 选中项 key，支持 `v-model:value`；面板内不高亮选中项   |
| `open`          | `boolean`               | —                    | 受控可见状态，配合 `v-model:open`                      |
| `description`   | `string`                | —                    | 仅传给 `header` 插槽，组件不渲染默认头部               |
| `placeholder`   | `string`                | `'搜索命令...'`      | 搜索框占位文本                                         |
| `emptyText`     | `string`                | `'未找到匹配的命令'` | 空结果提示                                             |
| `filterable`    | `boolean`               | `true`               | 是否随输入过滤                                         |
| `filter`        | `CommandMenuFilter`     | —                    | 自定义匹配函数                                         |
| `disabled`      | `boolean`               | `false`              | 禁用面板与快捷键                                       |
| `shortcut`      | `string \| false`       | `'Mod+K'`            | 全局唤起快捷键，`Mod` 在 macOS 为 Meta；`false` 不注册 |
| `closeOnSelect` | `boolean`               | `true`               | 选择后是否关闭面板                                     |
| `width`         | `string \| number`      | `500`                | 面板宽度，数字按 px                                    |
| `height`        | `string \| number`      | —                    | 面板高度，数字按 px；默认自适应并由 `max-height` 限制  |
| `zIndex`        | `number \| string`      | `1001`               | 遮罩层层级                                             |
| `to`            | `string \| HTMLElement` | `'body'`             | Teleport 目标                                          |
| `classes`       | `SearchPanelClasses`    | —                    | 语义化类名，按内部部件注入                             |
| `styles`        | `SearchPanelStyles`     | —                    | 语义化内联样式，按内部部件注入                         |

`classes` / `styles` 支持的部件键：`overlay`、`backdrop`、`panel`、`header`（仅在使用 `header` 插槽时渲染）、`command`、`footer`。其中 `command` 直接透传给内嵌的 CommandMenu，可用 `root`、`search`、`input`、`clear`、`list`、`group`、`groupLabel`、`item`、`empty`、`footer` 等部件键定制。结果列表默认最大高度为 320px，可覆盖：

```vue
<SearchPanel
  :items="items"
  :styles="{ command: { list: { maxHeight: '220px' } } }"
  :classes="{ command: { list: 'my-list' } }"
/>
```

组件设置了 `inheritAttrs: false`，使用方的 `class`、`style` 与 `data-*` 会落到面板节点 `.w-search-panel__panel`。

### Emits

| 事件           | 参数                                                  | 说明             |
| -------------- | ----------------------------------------------------- | ---------------- |
| `update:open`  | `open: boolean`                                       | 可见状态变化     |
| `update:value` | `key: CommandMenuKey`                                 | 选中项变化       |
| `select`       | `item: CommandMenuItem`                               | 选择命令         |
| `search`       | `value: string`                                       | 搜索文本变化     |
| `open`         | —                                                     | 已完成打开与聚焦 |
| `close`        | `reason: 'escape' \| 'backdrop' \| 'select' \| 'api'` | 面板关闭         |

### Slots

| 插槽     | 参数                       | 说明                           |
| -------- | -------------------------- | ------------------------------ |
| `header` | `{ description, close }`   | 可选头部，提供时才渲染该区域   |
| `item`   | `CommandMenuItemSlotProps` | 自定义命令行内容               |
| `empty`  | `{ query }`                | 自定义空结果内容               |
| `footer` | `{ shortcutLabel, close }` | 自定义底部；默认展示快捷键提示 |

### 实例方法

| 方法             | 类型                                        | 说明                       |
| ---------------- | ------------------------------------------- | -------------------------- |
| `open()`         | `() => void`                                | 请求打开（受控时仅 emit）  |
| `close(reason?)` | `(reason?: SearchPanelCloseReason) => void` | 请求关闭，默认原因 `api`   |
| `focus()`        | `() => void`                                | 聚焦搜索框，禁用时聚焦面板 |
| `isOpen`         | `boolean`（只读）                           | 当前是否打开               |

### 键盘与可访问性

- 面板渲染为 `role="dialog"` + `aria-modal="true"`，可访问名称默认为「搜索面板」，可通过 `aria-label` 属性覆盖；打开后聚焦搜索框，关闭后焦点恢复到触发元素。
- 默认 Teleport 到 `body`，可通过 `to` 指定其他容器。
- `Tab` / `Shift+Tab` 在面板内可聚焦元素间循环；`Escape` 关闭面板。
- 打开期间锁定 body 滚动，并通过 `scrollbar-gutter` 预留滚动条空间，避免打开时页面横向抖动；`prefers-reduced-motion` 下关闭过渡动画。
- 点击 backdrop 关闭面板，不恢复焦点。

### 类名

| 类名                                     | 说明                               |
| ---------------------------------------- | ---------------------------------- |
| `.w-search-panel`                        | Teleport 后的根遮罩层              |
| `.w-search-panel__backdrop`              | 背景遮罩                           |
| `.w-search-panel__panel`                 | 面板容器（dialog）                 |
| `.w-search-panel__header`                | 头部包装（仅使用 `header` 插槽时） |
| `.w-search-panel__command`               | 内部 CommandMenu 根节点            |
| `.w-search-panel__footer` / `__shortcut` | 底部与快捷键提示                   |
