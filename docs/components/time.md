# Time 相对时间

基于 Intl.RelativeTimeFormat 的自动刷新相对时间，支持本地化与自定义格式。

## 相对时间样例

默认每 30 秒刷新一次，也可以传入固定的 `now` 便于预览。同一页面中 `refreshInterval` 相同的实例共享一个定时器；长列表也可以设置 `refreshInterval=0` 后自行统一刷新。月 / 年按 30 / 365 天近似换算，跨自然月边界时文案可能存在偏差。

<demo vue="../demos/time/relative.vue" />

## 本地化与格式

`locale`、`numeric` 与 `formatStyle` 对应 Intl.RelativeTimeFormat 的配置。`formatStyle` 控制相对时间长度（`long` / `short` / `narrow`），因此组件的 `style` 属性可正常用于内联样式。

<demo vue="../demos/time/locale.vue" />

## 自定义格式化

`formatter` 接收 `date`、`now` 与 `locale`，可输出完全自定义的文案。

<demo vue="../demos/time/custom.vue" />

## useRelativeTime

相对时间的响应式逻辑同时以组合式函数导出，可在自定义组件或逻辑层复用：

```ts
import { useRelativeTime } from '@wuhu-vue-ui/time'

const { relative, date, now, refresh, stop } = useRelativeTime({
  time: () => props.time,
  locale: 'zh-CN',
  refreshInterval: 30_000,
  emptyText: '--',
})
```

所有选项都支持 ref 或 getter，返回的 `date`、`now`、`relative` 为只读计算属性；`refresh()` 会立即重新读取当前时间，`stop()` 可手动停止自动刷新。传入固定的 `now` 时不会启动自动刷新；函数型 `now` 只在依赖的响应式数据变化或调用 `refresh()` 时重新求值，普通外部变量的变化不会被监听。没有组件或 effect scope 时不会自动启动定时器，避免遗漏清理；组件卸载或作用域销毁后会自动取消订阅。相同 `refreshInterval` 的实例复用一个共享时钟。

## API

### Props

| 属性              | 类型                                            | 默认值    | 说明                         |
| ----------------- | ----------------------------------------------- | --------- | ---------------------------- |
| `time`            | `Date \| string \| number \| null \| undefined` | —         | 要显示的日期                 |
| `locale`          | `string`                                        | `'zh-CN'` | BCP 47 语言区域              |
| `numeric`         | `'always' \| 'auto'`                            | `'auto'`  | 相对时间数字模式             |
| `formatStyle`     | `'long' \| 'short' \| 'narrow'`                 | `'long'`  | 相对时间格式长度             |
| `refreshInterval` | `number`                                        | `30000`   | 自动刷新间隔（ms），`0` 关闭 |
| `now`             | `TimeInput \| (() => TimeInput)`                | —         | 覆盖“当前时间”来源           |
| `showTitle`       | `boolean`                                       | `true`    | 在 `title` 中显示绝对时间    |
| `titleFormat`     | `Intl.DateTimeFormatOptions`                    | —         | `title` 绝对时间的格式化选项 |
| `emptyText`       | `string`                                        | `'--'`    | 无效 / 缺失日期时的文本      |
| `formatter`       | `(date, now, locale) => string`                 | —         | 完全自定义相对时间格式       |

### Emits

| 事件      | 参数        | 说明                           |
| --------- | ----------- | ------------------------------ |
| `refresh` | `now: Date` | 每次刷新（含定时器触发）后触发 |

### Slots

| 插槽      | 参数                                                | 说明           |
| --------- | --------------------------------------------------- | -------------- |
| `default` | `{ relative, date, now, title, datetime, refresh }` | 自定义显示内容 |

### 实例方法

| 方法        | 类型                        | 说明               |
| ----------- | --------------------------- | ------------------ |
| `date`      | `ComputedRef<Date \| null>` | 解析后的目标日期   |
| `relative`  | `ComputedRef<string>`       | 格式化后的相对时间 |
| `refresh()` | `() => void`                | 立即刷新当前时间   |

### CSS 变量

无组件专属变量；空状态使用共享令牌 `--w-color-text-tertiary`。

### 类名

| 类名               | 说明                     |
| ------------------ | ------------------------ |
| `.w-time`          | 根元素，等宽数字、不换行 |
| `.w-time.is-empty` | 无有效日期状态           |

### 导出工具

`formatDateTime`、`formatRelativeTime`、`toDate`、`useRelativeTime`，以及类型 `RelativeTimeOptions`、`TimeInput`、`UseRelativeTimeOptions`、`UseRelativeTimeReturn`。
