# Lazy Container 懒加载容器

基于 IntersectionObserver 的懒渲染容器，提供进入、离开与一次性观察模式。

## 进入 / 离开视口

在自定义滚动容器内观察，内容进入可视区域后才挂载。

<demo vue="../demos/lazy-container/viewport.vue" />

## once 模式

只触发第一次进入事件，适合埋点或一次性动画。重新挂载即可再次体验。

<demo vue="../demos/lazy-container/once.vue" />

## API

### Props

| 属性         | 类型                          | 默认值  | 说明                              |
| ------------ | ----------------------------- | ------- | --------------------------------- |
| `root`       | `Element \| Document \| null` | `null`  | 滚动祖先或文档视口                |
| `rootMargin` | `string`                      | `'0px'` | IntersectionObserver 视口外扩边距 |
| `threshold`  | `number \| number[]`          | `0`     | 可见性阈值                        |
| `once`       | `boolean`                     | `false` | 首次进入后停止观察                |
| `tag`        | `string`                      | `'div'` | 根元素标签                        |

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

无。

### 类名

| 类名                             | 说明         |
| -------------------------------- | ------------ |
| `.w-lazy-container`              | 根元素       |
| `.w-lazy-container__placeholder` | 默认占位元素 |
