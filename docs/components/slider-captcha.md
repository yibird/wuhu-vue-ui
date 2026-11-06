# Slider Captcha 滑块拼图验证

基于 Canvas 的滑块拼图验证码。拖动滑块将拼图与缺口对齐即可完成验证，支持自定义背景图、键盘操作与失败自动刷新。

> 该组件是纯前端的交互挑战，目标位置由客户端生成并可通过 API 读取。请勿将其作为安全验证手段；生产环境需在服务端生成/校验 challenge token。

## 基础用法

未传入 `src` 时会生成渐变背景，开箱即用。验证结果通过 `success` / `fail` 事件返回；验证通过时滑块会移动到滑轨最右侧，并播放一次扫光动画。

<demo vue="../demos/slider-captcha/basic.vue" />

## 自定义背景图

通过 `src` 设置背景图，并结合 `width`、`height`、`pieceSize` 与 `tolerance` 调整难度。`src` 支持传入 URL 数组，此时每次刷新都会切换到不同的背景图，并重新生成缺口位置。

<demo vue="../demos/slider-captcha/image.vue" />

## 禁用状态

`disabled` 会关闭拖拽、键盘操作与提交验证。

<demo vue="../demos/slider-captcha/disabled.vue" />

## API

### Props

| 属性            | 类型                                     | 默认值                   | 说明                                         |
| --------------- | ---------------------------------------- | ------------------------ | -------------------------------------------- |
| `src`           | `string \| string[]`                     | `''`                     | 背景图 URL 或 URL 数组，未设置时使用生成背景 |
| `width`         | `number`                                 | `320`                    | 验证码图片宽度（固定像素，不会随容器缩放）   |
| `height`        | `number`                                 | `160`                    | 验证码图片高度                               |
| `pieceSize`     | `number`                                 | `48`                     | 拼图方块边长                                 |
| `tolerance`     | `number`                                 | `6`                      | 验证允许的水平误差（px）                     |
| `disabled`      | `boolean`                                | `false`                  | 禁用全部交互                                 |
| `crossOrigin`   | `'' \| 'anonymous' \| 'use-credentials'` | `''`                     | 加载背景图时使用的 `crossorigin`             |
| `text`          | `string`                                 | `'向右拖动滑块完成拼图'` | 滑轨提示文案                                 |
| `successText`   | `string`                                 | `'验证通过'`             | 成功文案                                     |
| `failText`      | `string`                                 | `'验证失败，请重试'`     | 失败文案                                     |
| `loadingText`   | `string`                                 | `'拼图加载中…'`          | 背景图加载中文案                             |
| `refreshOnFail` | `boolean`                                | `true`                   | 失败后自动生成新的验证码                     |
| `ariaLabel`     | `string`                                 | `'滑块拼图验证'`         | 无障碍名称                                   |
| `classes`       | `SliderCaptchaClasses`                   | —                        | 语义化类名，按部件注入                       |
| `styles`        | `SliderCaptchaStyles`                    | —                        | 语义化内联样式，按部件注入                   |

### Emits

| 事件      | 参数                                     | 说明           |
| --------- | ---------------------------------------- | -------------- |
| `success` | `{ offset, target, duration, attempts }` | 拼图位置匹配   |
| `fail`    | `{ offset, target, duration, attempts }` | 拼图位置不匹配 |
| `refresh` | —                                        | 重新生成验证码 |
| `error`   | `Error`                                  | 背景图加载失败 |

### 实例方法

| 方法        | 类型                       | 说明                                             |
| ----------- | -------------------------- | ------------------------------------------------ |
| `refresh()` | `() => void`               | 生成新验证码并重置滑块；`src` 为数组时切换背景图 |
| `reset()`   | `() => void`               | 重置滑块与状态，保留当前缺口                     |
| `verify()`  | `() => boolean`            | 立即校验当前偏移并触发对应事件                   |
| `offset`    | `Ref<number>`              | 当前滑块偏移                                     |
| `target`    | `Ref<SliderCaptchaTarget>` | 当前缺口坐标                                     |

### 键盘操作

- `ArrowLeft` / `ArrowRight`：每次移动 2px，按住 `Shift` 时移动 10px。
- `Home` / `End`：跳到最左 / 最右。
- `Enter` / `Space`：提交验证。

### CSS 变量

| 变量                              | 默认值                          | 说明           |
| --------------------------------- | ------------------------------- | -------------- |
| `--w-slider-captcha-radius`       | `var(--w-radius-lg, 12px)`      | 图片区域圆角   |
| `--w-slider-captcha-track-bg`     | `var(--w-color-surface-subtle)` | 滑轨背景       |
| `--w-slider-captcha-fill-bg`      | `var(--w-color-primary-soft)`   | 已拖动区域背景 |
| `--w-slider-captcha-handle-bg`    | `var(--w-color-surface)`        | 滑块背景       |
| `--w-slider-captcha-handle-color` | `var(--w-color-text-secondary)` | 滑块图标颜色   |
| `--w-slider-captcha-handle-size`  | `44px`                          | 滑块与滑轨高度 |
| `--w-slider-captcha-sweep-color`  | `rgba(255, 255, 255, 0.86)`     | 成功扫光颜色   |

### 语义化类名与样式

`classes` / `styles` 支持按部件注入：`root`、`image`、`canvas`、`piece`、`refresh`、`loading`、`slider`、`fill`、`tip`、`handle`、`live`。

```vue
<SliderCaptcha
  :classes="{ root: 'my-captcha', handle: 'my-handle' }"
  :styles="{ image: { borderRadius: '16px' }, handle: { color: '#4f46e5' } }"
/>
```

### 类名

| 类名                         | 说明                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `.w-slider-captcha`          | 根元素，配合 `.is-loading` / `.is-dragging` / `.is-success` / `.is-error` / `.is-disabled` |
| `.w-slider-captcha__image`   | 验证码图片区域                                                                             |
| `.w-slider-captcha__canvas`  | 背景与缺口画布                                                                             |
| `.w-slider-captcha__piece`   | 拼图块画布                                                                                 |
| `.w-slider-captcha__refresh` | 换一张按钮                                                                                 |
| `.w-slider-captcha__slider`  | 滑轨                                                                                       |
| `.w-slider-captcha__fill`    | 已拖动进度                                                                                 |
| `.w-slider-captcha__handle`  | 滑块手柄（`role="slider"`）                                                                |
| `.w-slider-captcha__loading` | 加载遮罩                                                                                   |
