# Ripple 波纹

为按钮、卡片等可交互元素添加 Material 风格的水波纹反馈，提供组件、指令与组合式函数三种用法。

## 基础波纹

默认在 `pointerdown` 时从指针位置扩散，松开前即可看到反馈。

<demo vue="../demos/ripple/basic.vue" />

```vue
<script setup lang="ts">
import { vRipple } from '@wuhu-vue-ui/ripple'
</script>

<template>
  <button v-ripple type="button">默认波纹</button>
</template>
```

## 自定义颜色与时长

`color` 接受任意 CSS 颜色，`duration` 控制单次波纹的动画时长。

<demo vue="../demos/ripple/custom.vue" />

## 中心扩散

设置 `center` 后波纹始终从元素中心扩散，适合图标按钮或不强调点击位置的场景。

<demo vue="../demos/ripple/center.vue" />

## 触发方式

`trigger` 支持 `pointerdown`（默认）与 `click`。键盘 Enter / Space 触发的 `click`（`event.detail === 0`）同样会从中心扩散。

<demo vue="../demos/ripple/trigger.vue" />

## 禁用

`disabled` 只阻止波纹创建，不会禁用元素本身的点击、焦点或业务逻辑。

<demo vue="../demos/ripple/disabled.vue" />

## 任意容器

指令挂载时保存元素原有的 `position` / `overflow` 并设置为 `relative` / `hidden`，卸载时恢复。

<demo vue="../demos/ripple/container.vue" />

## Ripple 组件

组件根节点自带 `position: relative; overflow: hidden`，其余属性（`class`、`style`、原生事件）会自动透传。

<demo vue="../demos/ripple/component.vue" />

```vue
<Ripple tag="button" type="button">按钮</Ripple>
<Ripple tag="div" center :duration="800">容器</Ripple>
```

## 组合式函数

`createRipple(element, event?, options?)` 会返回创建的波纹节点；禁用或环境不支持时返回 `null`，传播结束后节点自动移除。

<demo vue="../demos/ripple/composable.vue" />

```ts
const { createRipple } = useRipple()

function handlePointerDown(event: PointerEvent) {
  createRipple(element, event, { color: '#4f46e5', duration: 700 })
}
```

## API

### Props / Options

| 属性       | 类型                       | 默认值           | 说明                 |
| ---------- | -------------------------- | ---------------- | -------------------- |
| `color`    | `string`                   | `'currentColor'` | 波纹颜色             |
| `duration` | `number`                   | `600`            | 动画时长（毫秒）     |
| `disabled` | `boolean`                  | `false`          | 禁用波纹             |
| `center`   | `boolean`                  | `false`          | 从元素中心扩散       |
| `trigger`  | `'pointerdown' \| 'click'` | `'pointerdown'`  | 触发事件             |
| `tag`      | `string`                   | `'span'`         | 根元素标签（仅组件） |

### 指令值

`v-ripple` 可省略值（等价于默认配置）、传入 `false` 禁用，或传入 `RippleOptions` 对象。

### 导出

`Ripple`、`vRipple`、`useRipple`、`createRipple`，以及类型 `RippleProps`、`RippleOptions`、`RippleDirectiveValue`、`UseRippleReturn`。

### CSS 变量

| 变量                  | 默认值         | 说明       |
| --------------------- | -------------- | ---------- |
| `--w-ripple-color`    | `currentColor` | 波纹颜色   |
| `--w-ripple-duration` | `600ms`        | 动画时长   |
| `--w-ripple-opacity`  | `0.3`          | 起始透明度 |

### 类名

| 类名              | 说明         |
| ----------------- | ------------ |
| `.w-ripple`       | 根元素       |
| `.w-ripple__wave` | 单个波纹节点 |

动画关键帧为 `w-ripple-spread`。当用户开启 `prefers-reduced-motion` 时，动画会被压缩到极短时长。
