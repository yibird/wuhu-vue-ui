# Command Menu 命令面板

支持中文、全拼与首字母搜索的命令面板，内置分组、键盘导航、IME 处理与悬浮优先高亮。

## 分组 + 拼音搜索

支持全拼、首字母、描述与关键词匹配；方向键只移动活动项，Enter 才触发选择。

<demo vue="../demos/command-menu/grouped.vue" />

## 无分组 + 自定义 Escape

当 `items` 中没有任何 `group` 字段时自动按扁平列表展示；`escapeBehavior="close"` 时 Escape 触发 close 事件。

<demo vue="../demos/command-menu/flat.vue" />

## 空结果、过滤与禁用

自定义空结果文案，并通过 `filterable`、`disabled` 控制搜索过滤与整体交互。

<demo vue="../demos/command-menu/empty.vue" />

## 自定义 item 插槽

通过 `#item` 完全接管每一行的内容，同时保留外层的键盘导航、悬浮高亮与点击选择。

<demo vue="../demos/command-menu/custom-item.vue" />

## 自定义 empty 插槽

通过 `#empty` 接管空结果 UI，插槽参数 `query` 可用于展示当前搜索词与引导文案。

<demo vue="../demos/command-menu/custom-empty.vue" />

## API

### Props

| 属性             | 类型                           | 默认值               | 说明                           |
| ---------------- | ------------------------------ | -------------------- | ------------------------------ |
| `items`          | `CommandMenuItem[]`            | —（必填）            | 命令列表，组件不会修改原数组   |
| `modelValue`     | `string \| number`             | —                    | 当前选中项 key，支持 `v-model` |
| `placeholder`    | `string`                       | `'搜索命令...'`      | 搜索框占位文本                 |
| `emptyText`      | `string`                       | `'未找到匹配的命令'` | 空结果提示                     |
| `autoFocus`      | `boolean`                      | `false`              | 挂载后自动聚焦搜索框           |
| `filterable`     | `boolean`                      | `true`               | 是否随输入过滤                 |
| `disabled`       | `boolean`                      | `false`              | 禁用搜索、导航与选择           |
| `escapeBehavior` | `'clear' \| 'close' \| 'none'` | `'clear'`            | Escape 行为                    |
| `maxHeight`      | `string \| number`             | `360`                | 结果列表最大高度               |
| `ariaLabel`      | `string`                       | `'搜索命令'`         | 搜索框与结果列表的无障碍名称   |
| `clearLabel`     | `string`                       | `'清除搜索'`         | 清除按钮的无障碍名称与提示     |
| `classes`        | `CommandMenuClasses`           | —                    | 语义化类名，按内部部件注入     |
| `styles`         | `CommandMenuStyles`            | —                    | 语义化内联样式，按内部部件注入 |

`classes` / `styles` 支持的部件键：`root`、`search`、`input`、`clear`、`list`、`group`、`groupLabel`、`item`、`empty`。例如：

```vue
<CommandMenu
  :items="items"
  :classes="{ root: 'my-menu', input: 'my-input', item: ['my-item', { compact: true }] }"
  :styles="{ list: { maxHeight: '420px' }, groupLabel: { letterSpacing: '0.08em' } }"
/>
```

搜索框有内容时会显示清除按钮，点击后清空输入、重新聚焦并触发 `search('')`。

`CommandMenuItem` 字段：`key`、`label`、`description?`、`group?`、`icon?`、`keywords?`、`shortcut?`、`disabled?`。

### Emits

| 事件                | 参数                    | 说明                                            |
| ------------------- | ----------------------- | ----------------------------------------------- |
| `update:modelValue` | `key: CommandMenuKey`   | 选中项变化                                      |
| `select`            | `item: CommandMenuItem` | 用户选择某一项                                  |
| `search`            | `value: string`         | 搜索文本变化                                    |
| `escape`            | `event: KeyboardEvent`  | 按下 Escape（任何 `escapeBehavior` 下都会触发） |
| `close`             | —                       | `escapeBehavior="close"` 时按下 Escape          |

### Slots

| 插槽    | 参数                                                  | 说明             |
| ------- | ----------------------------------------------------- | ---------------- |
| `item`  | `{ item, index, active, selected, disabled, select }` | 自定义命令行内容 |
| `empty` | `{ query }`                                           | 自定义空结果内容 |

`item` 插槽只替换行**内容**，外层 `role="option"`、键盘高亮、`aria-selected` 与点击选择仍由组件管理：

```vue
<CommandMenu :items="items">
  <template #item="{ item, index, active, selected }">
    <span class="row" :class="{ 'is-active': active, 'is-selected': selected }">
      <b>{{ index + 1 }}</b>
      {{ item.label }}
      <small v-if="item.description">{{ item.description }}</small>
    </span>
  </template>

  <template #empty="{ query }">
    没有与「{{ query }}」匹配的命令
  </template>
</CommandMenu>
```

插槽参数类型由 `CommandMenuItemSlotProps` 与 `CommandMenuEmptySlotProps` 导出，开启 `strict` 的消费方可直接获得类型提示。

### 实例方法

| 方法            | 类型         | 说明         |
| --------------- | ------------ | ------------ |
| `focus()`       | `() => void` | 聚焦搜索框   |
| `clearSearch()` | `() => void` | 清空搜索文本 |

### CSS 变量

| 变量                           | 默认值                                                                                     | 说明                       |
| ------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------- |
| `--w-command-menu-active-bg`   | `color-mix(in srgb, var(--w-color-primary-soft, rgba(79, 70, 229, 0.1)) 80%, transparent)` | 键盘活动项背景             |
| `--w-command-menu-hover-bg`    | `color-mix(in srgb, var(--w-color-surface-active, #e2e8f0) 45%, transparent)`              | 鼠标悬浮项背景             |
| `--w-command-menu-selected-bg` | `var(--w-command-menu-active-bg)`                                                          | 选中项背景，优先于悬浮状态 |

### 类名

| 类名                                       | 说明                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `.w-command-menu`                          | 根容器，配合 `.is-disabled`                                                 |
| `.w-command-menu__search` / `__input`      | 搜索区与输入框                                                              |
| `.w-command-menu__list`                    | 可滚动结果列表                                                              |
| `.w-command-menu__group` / `__group-label` | 分组与分组标题                                                              |
| `.w-command-menu__item`                    | 命令项，配合 `.is-active` / `.is-hovered` / `.is-selected` / `.is-disabled` |
| `.w-command-menu__shortcut`                | 快捷键提示                                                                  |
| `.w-command-menu__empty`                   | 空结果提示                                                                  |
