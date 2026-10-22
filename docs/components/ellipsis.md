# Ellipsis 文本省略

在有限空间内展示长文本，支持多行省略、展开收起与完整内容提示。

## 单行省略

`lines` 默认为 `1`，折叠状态通过 `-webkit-line-clamp` 截断。开启 `tooltip` 后，仅在内容溢出且处于折叠状态时，悬浮或聚焦显示完整文本。

<demo vue="../../playground/src/demos/ellipsis-demo.vue" />

## 多行省略与展开

设置 `lines` 控制可见行数，并开启 `expandable`。组件通过 ResizeObserver 比较 `scrollHeight` 与 `clientHeight` 判断是否溢出，只有真实溢出时才渲染操作按钮。展开后移除行数限制。

```vue
<Ellipsis :text="text" :lines="3" expandable />
```

## 受控展开

`expanded` 支持 `v-model:expanded`，展开或收起时会同步触发 `update:expanded`，并额外触发 `expand` / `collapse`。

```vue
<Ellipsis v-model:expanded="expanded" :text="text" :lines="2" expandable />
```

## 自定义插槽

`action` 插槽接收 `expanded`、`toggle`、`overflowed`；`tooltip` 插槽接收完整 `text`。默认插槽用于替换 `text` 展示的内容。

```vue
<Ellipsis :text="text" expandable tooltip>
  <template #action="{ expanded }">
    {{ expanded ? '收起' : '展开' }}
  </template>
  <template #tooltip="{ text }">
    完整内容：{{ text }}
  </template>
</Ellipsis>
```

## API

### Props

| 属性               | 类型                                     | 默认值  | 说明                              |
| ------------------ | ---------------------------------------- | ------- | --------------------------------- |
| `text`             | `string`                                 | `''`    | 文本内容；默认插槽优先            |
| `lines`            | `number`                                 | `1`     | 折叠时显示的行数                  |
| `expandable`       | `boolean`                                | `false` | 溢出时显示展开 / 收起按钮         |
| `expanded`         | `boolean`                                | `false` | 是否展开，支持 `v-model:expanded` |
| `tooltip`          | `boolean`                                | `false` | 折叠且溢出时显示完整文本          |
| `tooltipPlacement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 提示框位置                        |
| `tag`              | `string`                                 | `'div'` | 根元素标签                        |

### Emits

| 事件              | 参数                | 说明             |
| ----------------- | ------------------- | ---------------- |
| `update:expanded` | `expanded: boolean` | 展开状态变化     |
| `expand`          | —                   | 从折叠切换为展开 |
| `collapse`        | —                   | 从展开切换为折叠 |

### Slots

| 插槽      | 参数                               | 说明               |
| --------- | ---------------------------------- | ------------------ |
| `default` | —                                  | 自定义展示内容     |
| `action`  | `{ expanded, toggle, overflowed }` | 自定义操作按钮内容 |
| `tooltip` | `{ text }`                         | 自定义提示框内容   |

### 类名

| 类名                           | 说明                                          |
| ------------------------------ | --------------------------------------------- |
| `.w-ellipsis`                  | 根容器，配合 `.is-expanded`、`.is-overflowed` |
| `.w-ellipsis__content`         | 文本容器，折叠时应用行数限制                  |
| `.w-ellipsis__action`          | 展开 / 收起按钮                               |
| `.w-ellipsis__tooltip`         | 完整文本提示框                                |
| `.w-ellipsis__tooltip--top` 等 | 提示框方位                                    |

### 可访问性

- 操作按钮使用原生 `<button>`，并通过 `aria-expanded` 反映当前状态。
- 可用提示时文本容器可获得焦点，并通过 `aria-describedby` 关联提示框。
- `prefers-reduced-motion: reduce` 下关闭过渡动画。
