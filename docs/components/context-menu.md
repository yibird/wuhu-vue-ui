# Context Menu 右键菜单

命令式右键菜单：在任意元素上绑定 `contextmenu` 后调用 `open`，由 `items` 数据驱动渲染，内置视口定位、键盘导航与焦点管理。

## 基础用法

通过组件 ref 调用 `open(event)`。焦点停留在菜单面板上，菜单项本身不可聚焦；方向键移动高亮项，`Escape`、选择或 `Tab` 会关闭菜单并恢复焦点。

<demo vue="../demos/context-menu/basic.vue" />

## 动态菜单项

`items` 可以是数组，也可以是 `() => items` 的函数。函数形式在每次打开前调用一次，可在打开前更新组件状态，再据此生成禁用态、标题或分组。

<demo vue="../demos/context-menu/dynamic.vue" />

## 受控打开

传入 `v-model:open` 即可受控控制显示状态；点击按钮时调用 `open(event)`，菜单会在鼠标位置打开。

<demo vue="../demos/context-menu/controlled.vue" />

## 原生菜单回退

`open` 只有在存在可操作项时才会调用 `event.preventDefault()` 并返回 `true`。当 `items` 为空或只包含标题/分隔线时，它返回 `false` 且保留浏览器原生右键菜单，便于宿主自行决定是否阻止默认行为。

```vue
<div @contextmenu="menu?.open($event)">右键区域</div>
```

如果希望始终禁用原生菜单，可在模板中使用 `@contextmenu.prevent`。

::: tip 焦点与关闭
- `Escape`、选择动作项与 `Tab` 会关闭菜单，并在 `restoreFocus` 为 `true` 时恢复打开前的焦点。
- 点击菜单外部、窗口滚动或缩放会关闭菜单，但不会抢回焦点。
- 菜单内部点击与滚动不会触发关闭。
:::

## API

### Props

| 属性            | 类型                                             | 默认值 | 说明                                       |
| --------------- | ------------------------------------------------ | ------ | ------------------------------------------ |
| `items`         | `ContextMenuItem[] \| (() => ContextMenuItem[])` | `[]`   | 菜单项；函数形式每次打开解析一次           |
| `open`          | `boolean`                                        | —      | 受控显隐，支持 `v-model:open`              |
| `closeOnSelect` | `boolean`                                        | `true` | 选择动作项后是否关闭                       |
| `restoreFocus`  | `boolean`                                        | `true` | `Escape` / 选择 / `Tab` 关闭时是否恢复焦点 |
| `classes`       | `ContextMenuClasses`                             | —      | 语义化类名                                 |
| `styles`        | `ContextMenuStyles`                              | —      | 语义化内联样式                             |

### Emits

| 事件          | 参数                        | 说明                   |
| ------------- | --------------------------- | ---------------------- |
| `update:open` | `open: boolean`             | 受控显隐更新           |
| `open`        | `{ x: number; y: number }`  | 打开完成，坐标已 clamp |
| `select`      | `{ item: ContextMenuItem }` | 选择动作项             |
| `close`       | —                           | 菜单关闭               |

### Expose

| 方法          | 返回      | 说明                                   |
| ------------- | --------- | -------------------------------------- |
| `open(event)` | `boolean` | 在鼠标坐标打开；无法打开时保留原生菜单 |
| `close()`     | —         | 关闭菜单                               |
| `focus()`     | —         | 聚焦菜单面板                           |
| `isOpen`      | `boolean` | 只读打开状态                           |

### 菜单项

| 字段       | 类型               | 说明                     |
| ---------- | ------------------ | ------------------------ |
| `type`     | `'item'`           | 动作项，可省略           |
| `key`      | `string \| number` | 唯一标识                 |
| `label`    | `string`           | 文案                     |
| `icon`     | `VNode`            | 前置虚拟节点             |
| `suffix`   | `VNode`            | 右侧虚拟节点             |
| `disabled` | `boolean`          | 禁用并跳过键盘导航       |
| `danger`   | `boolean`          | 危险操作配色             |
| `type`     | `'header'`         | 分组标题，需提供 `label` |
| `type`     | `'separator'`      | 分隔线                   |

### 语义化样式

`classes` / `styles` 支持：`root`、`item`、`icon`、`label`、`suffix`、`groupLabel`、`separator`。

```vue
<ContextMenu
  :items="items"
  :classes="{ item: 'brand-item' }"
  :styles="{ root: { minWidth: '200px' } }"
/>
```

### CSS 变量

| 变量                              | 默认值                                                               | 说明          |
| --------------------------------- | -------------------------------------------------------------------- | ------------- |
| `--w-context-menu-bg`             | `var(--w-color-surface-elevated, #ffffff)`                           | 菜单背景      |
| `--w-context-menu-hover-bg`       | `#f5f5f5`（暗色 `#2b3a52`）                                          | 悬停/高亮背景 |
| `--w-context-menu-disabled-color` | `#bfbfbf`（暗色 `rgba(255, 255, 255, 0.3)`）                         | 禁用项颜色    |
| `--w-context-menu-danger`         | `#ff4d4f`（暗色 `#ff7875`）                                          | 危险项颜色    |
| `--w-context-menu-shadow`         | `0 0 10px rgba(15, 23, 42, 0.06), 0 4px 14px rgba(15, 23, 42, 0.08)` | 四向阴影      |
| `--w-context-menu-z-index`        | `var(--w-z-dropdown, 1000)`                                          | 菜单层级      |
