# Error Boundary 错误边界

捕获后代组件渲染错误，提供可重试的默认回退与完全自定义回退。

## 默认回退与重试

捕获后代渲染错误，展示错误信息并支持重置。

<demo vue="../demos/error-boundary/default.vue" />

## 自定义回退

`fallback` 插槽拿到 `error`、`reset` 与实例，可替换整个降级界面。

<demo vue="../demos/error-boundary/custom.vue" />

## 自动重置

`resetOn` 用于在外部状态变化时自动清空错误并重新渲染。该 prop 以 `deep: true` 深度监听：

- 对象/数组内部任意属性变化都会触发重置；组件处于健康状态（未捕获错误）时不会重置，也不会产生额外渲染。
- 监听大对象或高频变化的数据源会带来遍历开销。推荐传入标量“版本号”或只包含关键字段的浅对象，例如 `:reset-on="route.fullPath"`、`:reset-on="retryKey"`。
- 需要手动控制时调用实例方法 `reset()`，或通过 `fallback` 插槽拿到 `reset`。

## API

### Props

| 属性          | 类型      | 默认值                                     | 说明               |
| ------------- | --------- | ------------------------------------------ | ------------------ |
| `title`       | `string`  | `'页面组件运行出错'`                       | 默认回退标题       |
| `description` | `string`  | `'你可以重试，或联系管理员查看错误详情。'` | 默认回退描述       |
| `showDetails` | `boolean` | `false`                                    | 显示原始错误信息   |
| `showReset`   | `boolean` | `true`                                     | 显示重置按钮       |
| `resetText`   | `string`  | `'重新加载'`                               | 重置按钮文字       |
| `propagate`   | `boolean` | `false`                                    | 继续向上传播错误   |
| `resetOn`     | `unknown` | —                                          | 该值变化时自动重置 |

### Emits

| 事件    | 参数                        | 说明               |
| ------- | --------------------------- | ------------------ |
| `error` | `{ error, info, instance }` | 捕获到后代组件错误 |
| `reset` | —                           | 执行重置后触发     |

### Slots

| 插槽       | 参数                               | 说明           |
| ---------- | ---------------------------------- | -------------- |
| `default`  | —                                  | 正常渲染的内容 |
| `fallback` | `{ error, info, instance, reset }` | 自定义降级界面 |

### 实例方法

| 方法      | 类型                     | 说明                   |
| --------- | ------------------------ | ---------------------- |
| `failed`  | `Readonly<Ref<boolean>>` | 是否处于错误状态       |
| `error`   | `Readonly<Ref<unknown>>` | 捕获的错误             |
| `info`    | `Readonly<Ref<string>>`  | Vue 错误信息           |
| `reset()` | `() => void`             | 清除错误并重新渲染内容 |

### CSS 变量

无组件专属变量，使用全局设计令牌（如 `--w-color-danger-soft`、`--w-color-primary`、`--w-radius-lg`）。

### 类名

| 类名                                         | 说明                         |
| -------------------------------------------- | ---------------------------- |
| `.w-error-boundary`                          | 根元素                       |
| `.w-error-boundary__content`                 | 正常内容容器                 |
| `.w-error-boundary__fallback-container`      | 回退区容器（`role="alert"`） |
| `.w-error-boundary__fallback`                | 默认回退面板                 |
| `.w-error-boundary__title` / `__description` | 回退标题与描述               |
| `.w-error-boundary__details`                 | 错误详情                     |
| `.w-error-boundary__reset`                   | 重置按钮                     |
