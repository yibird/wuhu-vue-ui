# Motion Group 排序动画

基于 TransitionGroup 的列表重排动画，内置 4 套预设并支持过滤进出场。

## 动画预设与重排

4 套预设的差异主要在进入 / 离开动画：切换预设会重新播放入场，添加 / 移除任务可查看离场；列表重排本身统一使用 FLIP 位移动画。

<demo vue="../demos/motion-group/presets.vue" />

## 横向列表

`direction="horizontal"` 配合 `slide` 预设，适合步骤条、标签栏等横向排序。

<demo vue="../demos/motion-group/horizontal.vue" />

## 过滤进出场

列表项被筛选时同样会播放离开与进入动画。

<demo vue="../demos/motion-group/filter.vue" />

## 动态增删标签

新增与删除元素同样有 enter / leave 动画，剩余元素通过 FLIP 平滑补位。

<demo vue="../demos/motion-group/tags.vue" />

## 动画节奏控制

通过 `duration` 与 `moveDuration` 分别控制进出场和位移时长，也可以完全关闭动画。

<demo vue="../demos/motion-group/timing.vue" />

## 禁用动画

`disabled=true` 保留列表能力但关闭全部过渡，便于调试或减少动效。

<demo vue="../demos/motion-group/disabled.vue" />

## API

### Props

| 属性            | 类型                                      | 默认值       | 说明                             |
| --------------- | ----------------------------------------- | ------------ | -------------------------------- |
| `animation`     | `'fade' \| 'slide' \| 'flip' \| 'bounce'` | `'fade'`     | 内置动画预设                     |
| `direction`     | `'horizontal' \| 'vertical'`              | `'vertical'` | `slide` 预设方向                 |
| `tag`           | `string`                                  | `'div'`      | 包装标签                         |
| `appear`        | `boolean`                                 | `false`      | 首次渲染是否播放动画             |
| `duration`      | `number`                                  | `260`        | 进入 / 离开动画时长（ms）        |
| `moveDuration`  | `number`                                  | `duration`   | FLIP 位移动画时长（ms）          |
| `absoluteLeave` | `boolean`                                 | `true`       | 离场项脱离文档流，剩余项立即补位 |
| `disabled`      | `boolean`                                 | `false`      | 关闭动画但保留列表功能           |

### Emits

无（事件监听器透传给内部 `TransitionGroup`）。

### Slots

| 插槽      | 参数 | 说明                        |
| --------- | ---- | --------------------------- |
| `default` | —    | 列表项，需提供稳定的 `:key` |

### 实例方法

无。

### CSS 变量

| 变量                                        | 默认值                                                 | 说明                |
| ------------------------------------------- | ------------------------------------------------------ | ------------------- |
| `--w-motion-duration`                       | `260ms`（由 `duration` 内联覆盖）                      | 进入 / 离开动画时长 |
| `--w-motion-move-duration`                  | `var(--w-motion-duration)`                             | FLIP 位移动画时长   |
| `--w-motion-ease`                           | `var(--w-easing-standard, cubic-bezier(0.2, 0, 0, 1))` | 动画缓动            |
| `--w-motion-overshoot`                      | `cubic-bezier(0.34, 1.56, 0.64, 1)`                    | `bounce` 过冲缓动   |
| `--w-motion-enter-x` / `--w-motion-enter-y` | `0px` / `8px`                                          | `slide` 进入位移    |

### 类名

| 类名                                                                                        | 说明           |
| ------------------------------------------------------------------------------------------- | -------------- |
| `.w-motion-group`                                                                           | 根容器         |
| `.w-motion-group--fade/slide/flip/bounce`                                                   | 动画预设修饰类 |
| `.w-motion-group--horizontal/vertical`                                                      | 方向修饰类     |
| `.w-motion-group--absolute-leave`                                                           | 离场项绝对定位 |
| `.w-motion-group--disabled`                                                                 | 禁用动画       |
| `.w-motion-{preset}-enter-active` / `-leave-active` / `-enter-from` / `-leave-to` / `-move` | Vue 过渡类     |
