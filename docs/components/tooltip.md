# Tooltip 文字提示

统一的悬浮 / 聚焦文字提示，提供组件与指令两种用法，基于 Floating UI 自动翻转并避免超出视口。

<demo vue="../../playground/src/demos/tooltip-demo.vue" />

## 组件用法

默认插槽作为触发元素，`content` 或 `content` 插槽作为提示内容。组件渲染一个 `display: inline-flex` 的触发包裹层，浮层通过 Teleport 挂载到 `body`。

```vue
<script setup lang="ts">
import { Tooltip } from '@wuhu-vue-ui/tooltip'
</script>

<template>
  <Tooltip content="复制链接" placement="top">
    <button type="button" aria-label="复制链接">复制</button>
  </Tooltip>
</template>
```

- `placement` 是首选方向，空间不足时由 Floating UI 翻转。
- `showDelay` / `hideDelay` 控制显隐延迟，`disabled` 时完全不响应。
- `open` 支持 `v-model:open`，传入后变为受控模式。
- 提示打开时触发元素会获得 `aria-describedby`，关闭或卸载时自动移除，不会覆盖已有的其他 id。

## 锚点模式

当触发元素位于既有布局中、不方便再包一层时，把 `anchor` 指向元素即可只渲染浮层；配合 `v-if` 或 `open` 控制显隐：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Tooltip } from '@wuhu-vue-ui/tooltip'

const anchor = ref<HTMLElement | null>(null)
const open = ref(false)
</script>

<template>
  <button ref="anchor" type="button" @click="open = !open">切换提示</button>
  <Tooltip :anchor="anchor" :open="open" placement="right" @update:open="open = $event">
    <template #content>锚点提示</template>
  </Tooltip>
</template>
```

## 指令

`vTooltip` 用于给已有元素补充文字提示，不会新增包裹节点，适合图标按钮：

```vue
<script setup lang="ts">
import { vTooltip } from '@wuhu-vue-ui/tooltip'
</script>

<template>
  <button type="button" aria-label="复制" v-tooltip="'复制'">⧉</button>
  <button type="button" aria-label="设置" v-tooltip="{ content: '设置', placement: 'bottom' }">
    ⚙
  </button>
</template>
```

指令会自动移除宿主元素上的原生 `title`，卸载时恢复；显示/隐藏通过 `pointerenter` / `pointerleave` / `focusin` / `focusout` 触发，`Esc` 可关闭。默认显示延迟 `300ms`，隐藏延迟 `0ms`。

## API

### Props

| 属性         | 类型                                     | 默认值   | 说明                                         |
| ------------ | ---------------------------------------- | -------- | -------------------------------------------- |
| `content`    | `string`                                 | —        | 提示文字，`content` 插槽优先                 |
| `placement`  | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`  | 首选方向，空间不足时自动翻转                 |
| `offset`     | `number`                                 | `8`      | 与触发元素的间距（px）                       |
| `showDelay`  | `number`                                 | `0`      | 显示延迟（ms）                               |
| `hideDelay`  | `number`                                 | `0`      | 隐藏延迟（ms）                               |
| `disabled`   | `boolean`                                | `false`  | 禁用提示                                     |
| `open`       | `boolean`                                | —        | 受控显隐，支持 `v-model:open`                |
| `anchor`     | `HTMLElement \| null`                    | —        | 锚点元素；传入后不渲染触发包裹层，仅渲染浮层 |
| `teleport`   | `boolean`                                | `true`   | 是否 Teleport 浮层                           |
| `teleportTo` | `string \| HTMLElement`                  | `'body'` | Teleport 目标                                |

### Emits

| 事件          | 参数            | 说明         |
| ------------- | --------------- | ------------ |
| `update:open` | `open: boolean` | 显隐状态变化 |

### Slots

| 插槽      | 参数          | 说明                       |
| --------- | ------------- | -------------------------- |
| `default` | —             | 触发元素（锚点模式不渲染） |
| `content` | `{ content }` | 自定义提示内容             |

### 指令值

`v-tooltip` 接受字符串或配置对象：

| 字段        | 类型                                     | 默认值  | 说明           |
| ----------- | ---------------------------------------- | ------- | -------------- |
| `content`   | `string`                                 | —       | 提示文字       |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 首选方向       |
| `offset`    | `number`                                 | `8`     | 与宿主元素间距 |
| `showDelay` | `number`                                 | `300`   | 显示延迟       |
| `hideDelay` | `number`                                 | `0`     | 隐藏延迟       |
| `disabled`  | `boolean`                                | `false` | 禁用提示       |

### 类名

| 类名                  | 说明                                |
| --------------------- | ----------------------------------- |
| `.w-tooltip`          | Teleport 到 `body` 的浮层           |
| `.w-tooltip__trigger` | 组件模式的触发包裹层（inline-flex） |

浮层带有 `data-placement`（最终方向）与 `role="tooltip"`；`data-w-theme` 会从触发元素最近的 `[data-w-theme]` 祖先镜像到浮层。

### CSS 变量

| 变量                      | 默认值                           | 说明     |
| ------------------------- | -------------------------------- | -------- |
| `--w-tooltip-bg`          | `#262626`（暗色 `#e2e8f0`）      | 背景色   |
| `--w-tooltip-color`       | `#ffffff`（暗色 `#0f172a`）      | 文字颜色 |
| `--w-tooltip-font-size`   | `12px`                           | 字号     |
| `--w-tooltip-line-height` | `1.5`                            | 行高     |
| `--w-tooltip-padding`     | `5px 9px`                        | 内边距   |
| `--w-tooltip-radius`      | `6px`                            | 圆角     |
| `--w-tooltip-max-width`   | `min(320px, calc(100vw - 16px))` | 最大宽度 |
| `--w-tooltip-z-index`     | `1000`                           | 层级     |
| `--w-tooltip-shadow`      | 主题内定义                       | 阴影     |
| `--w-tooltip-duration`    | `120ms`                          | 动画时长 |
| `--w-tooltip-easing`      | `cubic-bezier(0.16, 1, 0.3, 1)`  | 动画缓动 |

### 可访问性

- 浮层使用 `role="tooltip"`，并通过 `aria-describedby` 与触发元素关联。
- 支持悬浮与键盘聚焦触发；`Esc` 关闭。
- 遵循 `prefers-reduced-motion`，关闭动画。
- Teleport 后主题作用域仍生效：浮层从触发元素最近的 `[data-w-theme]` 继承亮暗主题。
