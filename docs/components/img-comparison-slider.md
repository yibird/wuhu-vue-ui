# Img Comparison Slider 图片对比

可拖拽、触摸与键盘操作的图片对比滑块，支持横向与纵向分割。

## 横向对比 + 标签

拖拽、触摸或使用方向键调整分割位置，支持自定义标签。

> 从插槽内的交互元素（`a`、`button`、`input`、`select`、`textarea`、`[role="button"]`、`[contenteditable]`）按下指针时，组件不会移动分割线，也不会抢走焦点；其它需要保留自身指针行为的元素可添加 `data-w-comparison-ignore`。

<demo vue="../demos/img-comparison-slider/horizontal.vue" />

## 纵向对比

`direction="vertical"`，容器固定高度时使用 `aspectRatio="auto"`。

<demo vue="../demos/img-comparison-slider/vertical.vue" />

## 自定义插槽与受控位置

使用 `handle`、`before-label`、`after-label` 插槽完全自定义外观，并通过 `v-model` 受控同步位置。

<demo vue="../demos/img-comparison-slider/custom.vue" />

## 语义化类名与样式

`classes` / `styles` 支持按部件注入：`root`、`before`、`after`、`image`、`label`、`beforeLabel`、`afterLabel`、`handle`、`line`、`knob`。

<demo vue="../demos/img-comparison-slider/styled.vue" />

```vue
<ImgComparisonSlider
  :classes="{ root: 'my-slider', line: 'my-line', knob: 'my-knob' }"
  :styles="{ line: { width: '3px' }, knob: { color: '#fff' } }"
/>
```

## API

### Props

| 属性           | 类型                         | 默认值             | 说明                                          |
| -------------- | ---------------------------- | ------------------ | --------------------------------------------- |
| `modelValue`   | `number`                     | —（内部初值 `50`） | 分割线位置百分比 0–100，支持 `v-model`        |
| `before`       | `string`                     | `''`               | 前图 URL，可被 `before` 插槽替换              |
| `after`        | `string`                     | `''`               | 后图 URL，可被 `after` 插槽替换               |
| `altBefore`    | `string`                     | `'Before'`         | 前图 `alt`                                    |
| `altAfter`     | `string`                     | `'After'`          | 后图 `alt`                                    |
| `direction`    | `'horizontal' \| 'vertical'` | `'horizontal'`     | 滑动方向                                      |
| `disabled`     | `boolean`                    | `false`            | 禁用鼠标、触摸和键盘交互                      |
| `showLabels`   | `boolean`                    | `false`            | 显示前后标签                                  |
| `beforeLabel`  | `string`                     | `'Before'`         | 前图标签                                      |
| `afterLabel`   | `string`                     | `'After'`          | 后图标签                                      |
| `aspectRatio`  | `string \| number`           | `'16 / 9'`         | CSS `aspect-ratio`；固定高度容器设为 `'auto'` |
| `keyboardStep` | `number`                     | `1`                | 方向键每次移动百分比（最小 `0.01`）           |
| `classes`      | `ImgComparisonSliderClasses` | —                  | 语义化类名，按部件注入                        |
| `styles`       | `ImgComparisonSliderStyles`  | —                  | 语义化内联样式，按部件注入                    |

### Emits

| 事件                | 参数                                      | 说明                     |
| ------------------- | ----------------------------------------- | ------------------------ |
| `update:modelValue` | `value: number`                           | 位置变化，用于 `v-model` |
| `change`            | `value: number`                           | 用户交互导致位置变化     |
| `dragstart`         | `value: number`                           | 开始拖动，值为位置更新前 |
| `dragend`           | `value: number`                           | 拖动结束或取消           |
| `error`             | `side: 'before' \| 'after', event: Event` | 对应图片加载失败         |

### Slots

| 插槽           | 参数                      | 说明         |
| -------------- | ------------------------- | ------------ |
| `before`       | —                         | 替换前图内容 |
| `after`        | —                         | 替换后图内容 |
| `handle`       | `{ position, direction }` | 替换手柄内容 |
| `before-label` | —                         | 替换前图标签 |
| `after-label`  | —                         | 替换后图标签 |

### 实例方法

| 方法                          | 类型                                        | 说明                           |
| ----------------------------- | ------------------------------------------- | ------------------------------ |
| `position`                    | `Readonly<Ref<number>>`                     | 当前分割线位置                 |
| `setPosition(value, notify?)` | `(value: number, notify?: boolean) => void` | 设置位置；`notify` 默认 `true` |
| `focus()`                     | `() => void`                                | 聚焦手柄                       |

### CSS 变量

| 变量                                  | 默认值                     | 说明         |
| ------------------------------------- | -------------------------- | ------------ |
| `--w-img-comparison-slider-radius`    | `var(--w-radius-lg, 12px)` | 根容器圆角   |
| `--w-img-comparison-slider-knob-size` | `30px`（小屏 `36px`）      | 手柄圆钮尺寸 |

### 类名

| 类名                                            | 说明                                       |
| ----------------------------------------------- | ------------------------------------------ |
| `.w-img-comparison-slider`                      | 根元素，配合 `--horizontal` / `--vertical` |
| `.is-dragging` / `.is-disabled` / `.has-labels` | 拖动、禁用、标签状态                       |
| `.w-img-comparison-slider__layer`               | 前后图片图层（`--before` / `--after`）     |
| `.w-img-comparison-slider__label`               | 前后标签（`--before` / `--after`）         |
| `.w-img-comparison-slider__handle`              | 可聚焦滑块手柄                             |
| `.w-img-comparison-slider__line` / `__knob`     | 分割线与圆钮                               |
