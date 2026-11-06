# Lazy Container 懒加载容器

基于 IntersectionObserver 的懒渲染容器，提供进入、离开与一次性观察模式。

## 进入 / 离开视口

在自定义滚动容器内观察，内容进入可视区域后才挂载。

<demo vue="../demos/lazy-container/viewport.vue" />

## once 模式

只触发第一次进入事件，适合埋点或一次性动画。重新挂载即可再次体验。

<demo vue="../demos/lazy-container/once.vue" />

## placeholder 插槽

内容首次进入视口前渲染 `placeholder` 插槽，用于骨架屏、占位卡片等。插槽参数与默认插槽一致，包含 `isVisible`、`hasEntered` 与 `entry`。未提供该插槽时，组件会渲染一个带默认最小高度的 `.w-lazy-container__placeholder` 占位元素。

::: tip 占位高度
默认占位元素通过 `--w-lazy-container-placeholder-height` 保留 `48px` 高度，避免零尺寸目标难以稳定触发观察。若真实内容更高，建议通过 `placeholder` 插槽提供与内容接近的占位高度，减少内容挂载时的布局跳动：

```vue
<LazyContainer>
  <template #placeholder>
    <div style="height: 200px" />
  </template>
  <Article />
</LazyContainer>
```
:::

<demo vue="../demos/lazy-container/placeholder.vue" />

## API

### Props

| 属性         | 类型                          | 默认值  | 说明                              |
| ------------ | ----------------------------- | ------- | --------------------------------- |
| `root`       | `Element \| Document \| null` | `null`  | 滚动祖先或文档视口                |
| `rootMargin` | `string`                      | `'0px'` | IntersectionObserver 视口外扩边距 |
| `threshold`  | `number \| number[]`          | `0`     | 可见性阈值                        |
| `once`       | `boolean`                     | `false` | 首次进入后停止观察                |

- `root`：作为滚动祖先的元素或 `Document`；传 `null` 时使用视口。
- `rootMargin`：遵循 CSS margin 语法（1–4 个值，单位 `px` 或 `%`），例如 `'0px 10% 80px 0px'`。非法值会在创建观察器时抛出浏览器原生 `SyntaxError`，组件不会静默修正。
- `threshold`：`0`–`1` 之间的数字或数组；超出范围同样由浏览器校验。
- `root`、`rootMargin` 或 `threshold` 变化时会重建观察器；`once` 只在首次进入后断开。
- 重建观察器或手动调用 `observe()` 时，`isVisible` 会重置为 `false`，但不会派发 `leave` / `change`；请以后续观察结果或 `hasEntered` 判断状态。

### Emits

| 事件     | 参数                        | 说明             |
| -------- | --------------------------- | ---------------- |
| `enter`  | `{ isIntersecting, entry }` | 由不可见变为可见 |
| `leave`  | `{ isIntersecting, entry }` | 由可见变为不可见 |
| `change` | `{ isIntersecting, entry }` | 可见性发生变化   |

### Slots

| 插槽          | 参数                               | 说明               |
| ------------- | ---------------------------------- | ------------------ |
| `default`     | `{ isVisible, hasEntered, entry }` | 容器内容           |
| `placeholder` | `{ isVisible, hasEntered, entry }` | 未渲染时的占位内容 |

### 实例方法

| 方法           | 类型                                                      | 说明             |
| -------------- | --------------------------------------------------------- | ---------------- |
| `isVisible`    | `Readonly<Ref<boolean>>`                                  | 当前是否可见     |
| `hasEntered`   | `Readonly<Ref<boolean>>`                                  | 是否曾经进入视口 |
| `entry`        | `Readonly<ShallowRef<IntersectionObserverEntry \| null>>` | 最近一次观察记录 |
| `observe()`    | `() => void`                                              | 重新开始观察     |
| `disconnect()` | `() => void`                                              | 断开观察         |

### CSS 变量

| 变量                                    | 默认值 | 说明                   |
| --------------------------------------- | ------ | ---------------------- |
| `--w-lazy-container-placeholder-height` | `48px` | 默认占位元素的最小高度 |

### 类名

| 类名                             | 说明         |
| -------------------------------- | ------------ |
| `.w-lazy-container`              | 根元素       |
| `.w-lazy-container__placeholder` | 默认占位元素 |
