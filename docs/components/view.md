# View 页面布局

可组合的页面布局容器：`Header`、`Sider`、`Content`、`Footer` 可以按需组合，支持折叠、间距与方向控制。

## 基础布局

`View` 作为容器，`ViewHeader` / `ViewContent` / `ViewFooter` 负责页面分区。`ViewHeader` 设置 `collapsible` 后会出现内置折叠触发器。`View` 不提供内边距配置，外层留白请通过自定义样式控制。

<demo vue="../demos/view/basic.vue" />

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { View, ViewHeader, ViewContent, ViewFooter } from '@wuhu-vue-ui/view'

const collapsed = ref(false)
</script>

<template>
  <View :full="false" :gap="10">
    <ViewHeader v-model:collapsed="collapsed" collapsible>
      <h2>团队概览</h2>
    </ViewHeader>
    <ViewContent>内容区</ViewContent>
    <ViewFooter>底部信息</ViewFooter>
  </View>
</template>
```

::: tip 折叠与内边距
`ViewHeader` 折叠时只会把内部内容收缩到 0，不会清除组件根节点上的 `padding` / `border`。因此可折叠场景下不要把内边距、边框和背景直接写在 `ViewHeader` 根节点上，而是放到默认插槽的内层容器中，这样才能完整收起。
:::

## 自定义间距

通过 `gap` 控制子元素间距；设置后 `View` 会启用 flex 布局。下面的示例可以切换不同的间距值。

<demo vue="../demos/view/gap.vue" />

## 侧栏布局

通过 `direction="horizontal"` 创建横向布局，`ViewSider` 支持 `collapsible`、`width` 与 `collapsedWidth`。

<demo vue="../demos/view/sider.vue" />

## 同时折叠侧栏与头部

侧栏和头部可以各自使用内置触发器，两个折叠状态互不影响。

<demo vue="../demos/view/nested-triggers.vue" />

## 自定义触发器

`ViewHeader` 与 `ViewSider` 都提供 `trigger` 插槽，可以完全替换内置按钮，并继续通过插槽参数控制折叠状态。

<demo vue="../demos/view/custom-trigger.vue" />

## 组合式导出

`View` 同时挂载了子组件，便于组合使用：

```vue
<View>
  <View.Header />
  <View.Sider />
  <View.Content />
  <View.Footer />
</View>
```

也可以按需从包中具名导入 `ViewHeader`、`ViewSider`、`ViewContent`、`ViewFooter`。

## API

### View Props

| 属性        | 类型                         | 默认值       | 说明                             |
| ----------- | ---------------------------- | ------------ | -------------------------------- |
| `full`      | `boolean`                    | `true`       | 是否绝对定位铺满最近的定位祖先   |
| `gap`       | `string \| number`           | —            | 子元素间距；设置后启用 flex 布局 |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | flex 布局方向                    |

### ViewHeader / ViewSider Props

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

| 组件          | 插槽      | 参数                    | 说明             |
| ------------- | --------- | ----------------------- | ---------------- |
| `View`        | `default` | —                       | 布局内容         |
| `ViewHeader`  | `default` | `{ collapsed }`         | 头部内容         |
| `ViewHeader`  | `trigger` | `{ collapsed, toggle }` | 自定义折叠触发器 |
| `ViewSider`   | `default` | `{ collapsed }`         | 侧栏内容         |
| `ViewSider`   | `trigger` | `{ collapsed, toggle }` | 自定义折叠触发器 |
| `ViewContent` | `default` | —                       | 内容区           |
| `ViewFooter`  | `default` | —                       | 底部区域         |
