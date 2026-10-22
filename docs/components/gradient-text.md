# Gradient Text 渐变文字

线性、径向与锥形渐变文字，支持背景流动动画与任意品牌色。

## 线性渐变 + 流动动画

最常用的品牌标题场景，颜色、角度与时长都可配置。

<demo vue="../demos/gradient-text/linear.vue" />

## 动画控制

实时切换动画开关、时长与方向，观察背景流动效果的变化。

<demo vue="../demos/gradient-text/animation.vue" />

## 径向渐变

`type="radial"`，适合强调数字、状态或徽章。

<demo vue="../demos/gradient-text/radial.vue" />

## 锥形渐变

`type="conic"`，可通过 `angle` 调整起始方向。

<demo vue="../demos/gradient-text/conic.vue" />

## 原始 CSS 渐变

`gradient` 属性可传入任意 `background-image` 值。

<demo vue="../demos/gradient-text/raw.vue" />

## API

### Props

| 属性                 | 类型                                                          | 默认值                              | 说明                                            |
| -------------------- | ------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| `colors`             | `string[]`                                                    | `['#4f46e5', '#9333ea', '#0ea5e9']` | 渐变色列表，建议至少两项                        |
| `gradient`           | `string`                                                      | `''`                                | 原始 CSS `background-image`，优先于其他渐变配置 |
| `type`               | `'linear' \| 'radial' \| 'conic'`                             | `'linear'`                          | 渐变类型                                        |
| `angle`              | `number`                                                      | `90`                                | 线性 / 锥形渐变角度（度）                       |
| `animate`            | `boolean`                                                     | `false`                             | 开启背景流动动画                                |
| `duration`           | `number`                                                      | `6000`                              | 动画时长（ms）                                  |
| `animationDirection` | `'normal' \| 'reverse' \| 'alternate' \| 'alternate-reverse'` | `'alternate'`                       | CSS `animation-direction`                       |
| `tag`                | `string`                                                      | `'span'`                            | 根元素标签                                      |

### Emits

无。

### Slots

| 插槽      | 参数                   | 说明                                    |
| --------- | ---------------------- | --------------------------------------- |
| `default` | `{ gradient: string }` | 文本内容；`gradient` 为实际生成的背景值 |

### 实例方法

无。

### CSS 变量

无。

### 类名

| 类名                           | 说明                 |
| ------------------------------ | -------------------- |
| `.w-gradient-text`             | 根元素，文字渐变裁剪 |
| `.w-gradient-text.is-animated` | 开启背景流动动画     |
