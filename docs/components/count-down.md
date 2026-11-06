# Count Down 倒计时

支持目标时间与固定时长两种模式，基于 `Date.now()` 做漂移校正，并提供开始、暂停、重置与结束状态。

<demo vue="../../playground/src/demos/count-down-demo.vue" />

## 基础用法

传入 `duration`（毫秒）即可按固定时长倒计时；传入 `target` 时优先按目标时间计算，适合秒杀、开奖等场景。

```vue
<CountDown :duration="60000" />
<CountDown :target="new Date('2026-12-31T23:59:59')" format="DD 天 HH:mm:ss" />
```

`autoStart` 默认为 `true`。关闭后需要调用实例方法 `start()`，例如在用户点击按钮后再开始。

## 双向绑定剩余时间

传入 `remaining` 后组件会把它作为剩余时间的来源，并继续通过 `update:remaining` 回传，可直接使用 `v-model:remaining`：

```vue
<CountDown v-model:remaining="remaining" :duration="60000" />
```

外部修改 `remaining` 会同步到倒计时；回传的相同值不会触发重复更新。

## 格式化

`format` 支持字符串令牌或自定义函数：

| 令牌  | 说明         |
| ----- | ------------ |
| `DD`  | 天数（两位） |
| `HH`  | 小时（两位） |
| `mm`  | 分钟（两位） |
| `ss`  | 秒（两位）   |
| `SSS` | 毫秒（三位） |

默认值为 `HH:mm:ss`。也可以传入 `(state) => string` 完全自定义输出。

## 事件与插槽

- `update:remaining`：剩余毫秒变化时触发，可用于外部持久化或联动展示。
- `change`：任何状态变化时触发，参数为完整的 `CountDownState`。
- `start` / `pause` / `reset`：生命周期事件。
- `finish`：归零时触发且每次倒计时只触发一次。
- 默认插槽接收 `CountDownState`；`finished` 插槽在结束后渲染。

## API

### Props

| 属性         | 类型                                            | 默认值       | 说明                               |
| ------------ | ----------------------------------------------- | ------------ | ---------------------------------- |
| `target`     | `Date \| string \| number`                      | —            | 目标时间，优先于 `duration`        |
| `duration`   | `number`                                        | `0`          | 倒计时时长（毫秒）                 |
| `remaining`  | `number`                                        | —            | 剩余毫秒，支持 `v-model:remaining` |
| `autoStart`  | `boolean`                                       | `true`       | 挂载后是否自动开始                 |
| `interval`   | `number`                                        | `1000`       | 刷新间隔（毫秒），≤0 时回退到 1000 |
| `format`     | `string \| ((state: CountDownState) => string)` | `'HH:mm:ss'` | 输出格式                           |
| `finishText` | `string`                                        | —            | 结束后替代默认文本                 |

### 驱动源优先级

- **初始值**：`remaining` > `target` > `duration`。提供 `remaining` 时以它作为起始值；否则有 `target` 时按 `target - now` 计算；两者都没有时取 `duration`。
- **运行期**：存在 `target` 时每次 tick 都以 `target - now` 为准；否则基于 `duration` 或最近一次 `remaining` 加上单调时间推进。
- 运行中外部更新 `remaining` 会立即覆盖当前值并重置计时基准；如果同时设置了 `target`，下一次 tick 仍会回到 `target` 推导值。
- 因此同一倒计时请只使用 `remaining` / `target` / `duration` 中的一个作为驱动源。

根元素固定为 `<span>`。

### Emits

| 事件               | 参数                    | 说明                     |
| ------------------ | ----------------------- | ------------------------ |
| `update:remaining` | `remaining: number`     | 剩余毫秒变化             |
| `change`           | `state: CountDownState` | 状态变化                 |
| `start`            | —                       | 开始 / 继续              |
| `pause`            | —                       | 暂停                     |
| `reset`            | —                       | 重置                     |
| `finish`           | —                       | 倒计时归零（仅触发一次） |

### Slots

| 插槽       | 参数             | 说明                   |
| ---------- | ---------------- | ---------------------- |
| `default`  | `CountDownState` | 倒计时进行中的内容     |
| `finished` | `CountDownState` | 倒计时结束后的替代内容 |

### 实例

| 成员                                                      | 说明            |
| --------------------------------------------------------- | --------------- |
| `remaining`                                               | 剩余毫秒        |
| `running` / `finished`                                    | 运行中 / 已结束 |
| `days` / `hours` / `minutes` / `seconds` / `milliseconds` | 拆分后的时间    |
| `start()` / `pause()` / `reset()`                         | 控制倒计时      |

### 工具函数

`formatCountdown(remaining, format?)` 可独立用于格式化剩余毫秒。

### 类名

| 类名            | 说明         |
| --------------- | ------------ |
| `.w-count-down` | 根元素       |
| `.is-running`   | 倒计时进行中 |
| `.is-finished`  | 倒计时已结束 |
