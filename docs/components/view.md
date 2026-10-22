# View 页面布局

可组合的页面布局容器：`Header`、`Sider`、`Content`、`Footer` 可以按需组合，支持折叠、间距与方向控制。

## 基础布局

`WView` 作为容器，`WViewHeader` / `WViewContent` / `WViewFooter` 负责页面分区。`WViewHeader` 设置 `collapsible` 后会出现内置折叠触发器。

<demo vue="../demos/view/basic.vue" />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { WView, WViewHeader, WViewContent, WViewFooter } from '@wuhu-ui/view'

const collapsed = ref(false)
</script>

<template>
  <WView :full="false" padding :gap="10">
    <WViewHeader v-model:collapsed="collapsed" collapsible>
      <h2>团队概览</h2>
    </WViewHeader>
    <WViewContent>内容区</WViewContent>
    <WViewFooter>底部信息</WViewFooter>
  </WView>
</template>
```

## 侧栏布局

通过 `direction="horizontal"` 创建横向布局，`WViewSider` 支持 `collapsible`、`width` 与 `collapsedWidth`。

<demo vue="../demos/view/sider.vue" />

## 组合式导出

`WView` 同时挂载了子组件，便于组合使用：

```vue
<WView>
  <WView.Header />
  <WView.Sider />
  <WView.Content />
  <WView.Footer />
</WView>
```

也可以按需从包中具名导入 `WViewHeader`、`WViewSider`、`WViewContent`、`WViewFooter`。

## API

### WView Props

| 属性        | 类型                          | 默认值       | 说明                                 |
| ----------- | ----------------------------- | ------------ | ------------------------------------ |
| `padding`   | `boolean \| string \| number` | `true`       | 是否启用内边距，或直接指定内边距大小 |
| `full`      | `boolean`                     | `true`       | 是否绝对定位铺满最近的定位祖先       |
| `gap`       | `string \| number`            | —            | 子元素间距；设置后启用 flex 布局     |
| `direction` | `'vertical' \| 'horizontal'`  | `'vertical'` | flex 布局方向                        |

### WViewHeader / WViewSider Props

| 属性             | 类型               | 默认值  | 说明                   |
| ---------------- | ------------------ | ------- | ---------------------- |
| `collapsible`    | `boolean`          | `false` | 是否允许折叠           |
| `trigger`        | `boolean`          | `true`  | 是否显示内置触发器     |
| `collapseLabel`  | `string`           | —       | 收起时的无障碍标签     |
| `expandLabel`    | `string`           | —       | 展开时的无障碍标签     |
| `collapsed`      | `boolean`          | `false` | 折叠状态（`v-model`）  |
| `width`          | `string \| number` | `240`   | 仅 Sider：展开宽度     |
| `collapsedWidth` | `string \| number` | `0`     | 仅 Sider：收起后的宽度 |

### 事件

| 事件               | 参数                 | 说明         |
| ------------------ | -------------------- | ------------ |
| `update:collapsed` | `collapsed: boolean` | 折叠状态更新 |
| `collapse`         | `collapsed: boolean` | 折叠状态变化 |

### 插槽

| 组件           | 插槽      | 参数                    | 说明             |
| -------------- | --------- | ----------------------- | ---------------- |
| `WView`        | `default` | —                       | 布局内容         |
| `WViewHeader`  | `default` | `{ collapsed }`         | 头部内容         |
| `WViewHeader`  | `trigger` | `{ collapsed, toggle }` | 自定义折叠触发器 |
| `WViewSider`   | `default` | `{ collapsed }`         | 侧栏内容         |
| `WViewSider`   | `trigger` | `{ collapsed, toggle }` | 自定义折叠触发器 |
| `WViewContent` | `default` | —                       | 内容区           |
| `WViewFooter`  | `default` | —                       | 底部区域         |
