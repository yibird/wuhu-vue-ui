# Number Ticker 数字滚动

逐位滚动的数字动画，支持千分位、小数、前后缀与本地化格式。

## 货币指标

前缀、小数与千分位组合，适合营收或金额看板。

<demo vue="../demos/number-ticker/currency.vue" />

## 百分比与本地化

`locale`、`suffix` 与 `decimals` 可以自由组合。

<demo vue="../demos/number-ticker/locale.vue" />

## 动效参数

`startValue`、`duration` 与 `useGrouping` 控制首屏动画与格式。

<demo vue="../demos/number-ticker/params.vue" />

## 负值与涨跌

负号会作为普通字符参与滚动，适合盈亏、差值等需要正负切换的指标。

<demo vue="../demos/number-ticker/negative.vue" />

## 挂载动画与缓动

`animateOnMount=false` 跳过首屏动画；`easing` 可切换线性、回弹等滚动曲线。改变 `key` 可重新触发挂载动画。

<demo vue="../demos/number-ticker/animation.vue" />

## 实时数据流

数值快速变化时会逐位滚动；跨越位数（如 `9,999 → 10,000`）时会即时调整布局。

> `aria-live` 默认关闭，避免看板中的高频数字持续打断屏幕阅读器。需要播报的实时指标可显式开启：

```vue
<NumberTicker :value="onlineUsers" aria-live="polite" aria-atomic="true" />
```

<demo vue="../demos/number-ticker/live.vue" />

## API

### Props

| 属性             | 类型                               | 默认值                             | 说明                                         |
| ---------------- | ---------------------------------- | ---------------------------------- | -------------------------------------------- |
| `value`          | `number`                           | —（必填）                          | 目标数值                                     |
| `startValue`     | `number`                           | `0`                                | 挂载时数字滚动的起始值                       |
| `duration`       | `number`                           | `800`                              | 滚动动画时长（ms）                           |
| `decimals`       | `number`                           | `0`                                | 小数位数（0–20）                             |
| `locale`         | `string`                           | `'zh-CN'`                          | 数字格式化区域                               |
| `useGrouping`    | `boolean`                          | `true`                             | 是否启用千分位分隔                           |
| `prefix`         | `string`                           | `''`                               | 数值前缀                                     |
| `suffix`         | `string`                           | `''`                               | 数值后缀                                     |
| `easing`         | `string`                           | `'cubic-bezier(0.22, 1, 0.36, 1)'` | CSS 缓动函数                                 |
| `animateOnMount` | `boolean`                          | `true`                             | 首次挂载时是否从 `startValue` 动画到 `value` |
| `ariaLive`       | `'off' \| 'polite' \| 'assertive'` | —                                  | 可选：让无障碍标签作为实时区域播报           |
| `ariaAtomic`     | `boolean`                          | —                                  | 可选：实时区域是否整段播报                   |

### Emits

无。

### Slots

无。

### 实例方法

| 方法        | 类型                  | 说明                       |
| ----------- | --------------------- | -------------------------- |
| `formatted` | `ComputedRef<string>` | 带前后缀的无障碍格式化文本 |

### CSS 变量

| 变量                         | 默认值                            | 说明             |
| ---------------------------- | --------------------------------- | ---------------- |
| `--w-number-ticker-duration` | `800ms`（由 `duration` 内联覆盖） | 数字滚轮过渡时长 |
| `--w-number-ticker-easing`   | `ease`（由 `easing` 内联覆盖）    | 数字滚轮过渡缓动 |

### 类名

| 类名                       | 说明                    |
| -------------------------- | ----------------------- |
| `.w-number-ticker`         | 根元素                  |
| `.w-number-ticker__visual` | 视觉层（`aria-hidden`） |
| `.w-number-ticker__digit`  | 单个数字窗口            |
| `.w-number-ticker__strip`  | 数字滚动条带            |
| `.w-number-ticker__char`   | 小数点、分隔符等字符    |
| `.w-number-ticker__affix`  | 前缀 / 后缀             |
