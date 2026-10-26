# Permission 权限控制

基于 provide / inject 的权限守卫，支持 `all` / `any` 校验、显式权限列表与指令式隐藏。

## 基础用法

`Permission` 仅在具备所需权限时渲染默认插槽，否则渲染 `fallback` 插槽。组件默认 fail-closed：没有注入上下文且未传 `permissions` 时拒绝渲染。

<demo vue="../../playground/src/demos/permission-demo.vue" />

## 提供权限上下文

在应用或页面根组件调用 `providePermissions`，来源可以是数组、`Set`、ref 或 getter，更新后所有子级校验会同步刷新：

```ts
import { ref } from 'vue'
import { providePermissions } from '@wuhu-vue-ui/permission'

const permissions = ref(['user:read', 'user:write'])
providePermissions(permissions)
```

## 校验模式

- `mode="all"`（默认）：`value` 中的所有权限都必须具备。
- `mode="any"`：具备任意一个权限即可。
- `value` 为空数组时按集合语义处理：`all` 模式空列表视为全部满足（渲染默认插槽），`any` 模式视为无匹配（渲染 `fallback`）。没有提供者时始终拒绝。

```vue
<Permission :value="['user:read', 'user:write']">
  <button>编辑用户</button>
</Permission>

<Permission :value="['order:read', 'order:write']" mode="any">
  <button>查看订单</button>
</Permission>
```

## 显式权限列表

传入 `permissions` 时会优先使用该列表，不再读取注入上下文，适合局部覆盖或独立场景。

```vue
<Permission value="admin" :permissions="['admin']">
  <button>管理后台</button>
</Permission>
```

## 指令 v-permission

没有权限时把元素设为 `display: none`；权限恢复或组件卸载时还原原始 `display` 值。指令值支持字符串、数组或 `{ value, mode }`：

```vue
<script setup lang="ts">
import { vPermission } from '@wuhu-vue-ui/permission'
</script>

<template>
  <button v-permission="'order:delete'">删除订单</button>
  <button v-permission="{ value: ['user:read', 'user:write'], mode: 'all' }">编辑用户</button>
</template>
```

## API

### Props

| 属性          | 类型                 | 默认值  | 说明                           |
| ------------- | -------------------- | ------- | ------------------------------ |
| `value`       | `string \| string[]` | —       | 需要的权限                     |
| `mode`        | `'all' \| 'any'`     | `'all'` | 全部满足或任意满足             |
| `permissions` | `string[]`           | —       | 显式权限列表，优先于注入上下文 |

### Slots

| 插槽       | 说明         |
| ---------- | ------------ |
| `default`  | 有权限时渲染 |
| `fallback` | 无权限时渲染 |

### 导出 API

| 名称                 | 类型                                                          | 说明                                     |
| -------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| `PERMISSION_KEY`     | `InjectionKey<PermissionContext>`                             | 注入键，可用于自定义 provide             |
| `providePermissions` | `(source: MaybeRefOrGetter<string[] \| Set<string>>) => void` | 向子级提供响应式权限来源                 |
| `usePermission`      | `() => PermissionContext`                                     | 读取上下文；无提供者时返回默认拒绝的实现 |
| `vPermission`        | `ObjectDirective<HTMLElement, PermissionDirectiveValue>`      | 指令形式，无权限时隐藏元素               |

### 类型

```ts
type PermissionMode = 'all' | 'any'
type PermissionValue = string | string[]

interface PermissionContext {
  has: (value: PermissionValue, mode?: PermissionMode) => boolean
}

type PermissionDirectiveValue = PermissionValue | { value: PermissionValue; mode?: PermissionMode }
```

### usePermission 示例

```ts
import { usePermission } from '@wuhu-vue-ui/permission'

const { has } = usePermission()

if (has(['user:read', 'user:write'], 'all')) {
  // 执行需要权限的逻辑
}
```
