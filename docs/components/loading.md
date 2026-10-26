# Loading 加载中

内置 5 种加载动画，支持内联展示、全屏遮罩与命令式创建 / 销毁。

## 动画类型

`animation` 支持 `bars`、`beat`、`pulse`、`ring`、`spinner`，默认 `ring`。

<demo vue="../demos/loading/animations.vue" />

## 全屏模式

`full` 渲染固定遮罩层，默认锁定 `body` 滚动；`mask=false` 可关闭遮罩背景。全屏内容没有卡片、边框或阴影，仅在遮罩层中垂直居中。

<demo vue="../demos/loading/fullscreen.vue" />

## 渐变背景

`gradient` 作用于 Loading 容器的**背景**，不会改变动画图形的颜色。支持三种写法：

- `true`：左上角径向高光 + 158deg 线性渐变，以主题面底色为基底并混入少量主色，亮/暗主题自动适配且尺寸自适应容器
- CSS 字符串：例如 `linear-gradient(90deg, #4f46e5, #0ea5e9)`
- 颜色数组：自动生成 `135deg` 线性渐变，例如 `['#4f46e5', '#c026d3']`

动画图形仍使用 `color` 或主题主色。

<demo vue="../demos/loading/gradient.vue" />

## 插槽

- `default`：替换内置动画
- `title`：标题区域
- `description`：描述区域

也可以直接使用 `title` / `description` props。

<demo vue="../demos/loading/slots.vue" />

## 命令式 API

```ts
import { createLoading, destroyLoading } from '@wuhu-vue-ui/loading'

const loading = createLoading({
  animation: 'spinner',
  title: '正在保存',
})

loading.update({ description: '还剩 2 个文件' })
loading.close()
// 或立即销毁
loading.destroy()
```

命令式实例默认 `full: true`，返回：

| 成员        | 类型                                         | 说明                   |
| ----------- | -------------------------------------------- | ---------------------- |
| `id`        | `number`                                     | 实例 ID                |
| `close()`   | `() => void`                                 | 隐藏并在过渡结束后销毁 |
| `update()`  | `(options: Partial<LoadingOptions>) => void` | 动态更新内容与配置     |
| `destroy()` | `() => void`                                 | 立即卸载               |

还可以使用：

```ts
import { destroyAllLoadings, destroyLoading, useLoading } from '@wuhu-vue-ui/loading'

destroyLoading(loading) // 传入实例或 id
destroyAllLoadings()

const { visible, open, close, toggle } = useLoading()
```

<demo vue="../demos/loading/imperative.vue" />

## API

### Props

| 属性          | 类型                                                 | 默认值   | 说明                              |
| ------------- | ---------------------------------------------------- | -------- | --------------------------------- |
| `animation`   | `'bars' \| 'beat' \| 'pulse' \| 'ring' \| 'spinner'` | `'ring'` | 内置动画                          |
| `full`        | `boolean`                                            | `false`  | 全屏遮罩                          |
| `open`        | `boolean`                                            | `true`   | 是否显示，支持 `v-model:open`     |
| `size`        | `string \| number`                                   | `40`     | 动画尺寸，数字按像素处理          |
| `color`       | `string`                                             | 主题主色 | 动画颜色                          |
| `gradient`    | `boolean \| string \| string[]`                      | `false`  | Loading 背景渐变；数组生成 135deg |
| `title`       | `string`                                             | —        | 标题                              |
| `description` | `string`                                             | —        | 描述                              |
| `mask`        | `boolean`                                            | `true`   | 全屏模式是否显示遮罩背景          |
| `lockScroll`  | `boolean`                                            | `true`   | 全屏显示时锁定 body 滚动          |
| `zIndex`      | `number`                                             | `2000`   | 全屏层级                          |
| `teleport`    | `string \| HTMLElement`                              | `'body'` | 全屏 Teleport 目标                |
| `classes`     | `LoadingClasses`                                     | —        | 语义化类名，按内部部件注入        |
| `styles`      | `LoadingStyles`                                      | —        | 语义化内联样式，按内部部件注入    |

`classes` / `styles` 支持：`root`、`content`、`indicator`、`title`、`description`。

```vue
<Loading
  :classes="{ indicator: 'brand-spinner', title: 'brand-title' }"
  :styles="{ content: { gap: '20px' }, title: { color: 'var(--w-color-primary)' } }"
/>
```

全屏遮罩默认使用主题表面色（亮色主题下为白色），并通过滚动条宽度补偿避免打开时页面横向抖动。

### Slots

| 插槽          | 参数 | 说明         |
| ------------- | ---- | ------------ |
| `default`     | —    | 替换内置动画 |
| `title`       | —    | 自定义标题   |
| `description` | —    | 自定义描述   |

### CSS 变量

| 变量                  | 默认值                    | 说明                             |
| --------------------- | ------------------------- | -------------------------------- |
| `--w-loading-primary` | `var(--w-color-primary)`  | 动画颜色                         |
| `--w-loading-size`    | `40px`                    | 动画尺寸                         |
| `--w-loading-radius`  | `var(--w-radius-md, 8px)` | beat 动画圆角                    |
| `--w-loading-mask`    | `var(--w-color-surface)`  | 全屏遮罩背景色（跟随主题表面色） |

动画时长与延迟也可通过令牌统一调整：

| 变量                              | 默认值   | 说明                   |
| --------------------------------- | -------- | ---------------------- |
| `--w-loading-transition-duration` | `120ms`  | 淡入淡出过渡时长       |
| `--w-loading-bars-duration`       | `860ms`  | bars 单次跳动时长      |
| `--w-loading-bars-delay-step`     | `80ms`   | bars 相邻柱体延迟步长  |
| `--w-loading-beat-duration`       | `580ms`  | beat 跳动时长          |
| `--w-loading-pulse-duration`      | `1350ms` | pulse 单次扩散时长     |
| `--w-loading-pulse-delay-step`    | `280ms`  | pulse 相邻圆环延迟步长 |
| `--w-loading-ring-duration`       | `780ms`  | ring 旋转一周时长      |
| `--w-loading-ring-core-duration`  | `1100ms` | ring 中心脉冲时长      |
| `--w-loading-spinner-duration`    | `1100ms` | spinner 旋转一周时长   |

组件会自动遵循 `prefers-reduced-motion: reduce`，关闭持续动画。
