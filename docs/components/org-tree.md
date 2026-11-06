# OrgTree 组织架构图

面向组织架构、审批流与层级关系的树形可视化组件，支持画布平移缩放、展开收起、节点选择、右键菜单与拖拽改父级。

<demo vue="../../playground/src/demos/org-tree-demo.vue" />

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { OrgTree } from '@wuhu-vue-ui/org-tree'
import type { OrgTreeNode } from '@wuhu-vue-ui/org-tree'

const data = ref<OrgTreeNode[]>([
  {
    id: 'root',
    label: '总部',
    children: [
      { id: 'design', label: '设计中心' },
      { id: 'engineering', label: '研发中心' },
    ],
  },
])
const selectedKey = ref<string | number | null>(null)
const expandKeys = ref<Array<string | number>>(['root'])
</script>

<template>
  <OrgTree
    v-model:selected-key="selectedKey"
    v-model:expand-keys="expandKeys"
    :data="data"
    node-draggable
    @node-click="(node) => console.log(node)"
  />
</template>
```

## 传入数据即渲染

只需传入 `data`，组件会按 `children` 自动布局、绘制连线，并默认展开前两层。

<demo vue="../demos/org-tree/basic.vue" />

## 自定义节点

通过 `node`（或 `default`）插槽渲染节点内容，插槽参数包含 `node`、`depth`、`expanded` 与 `toggle`。节点内的 `button`、`a`、`input`、`textarea`、`select` 以及带 `data-org-no-drag` 的元素不会触发选中或拖拽。

<demo vue="../demos/org-tree/custom-node.vue" />

## 自定义字段

通过 `keys` 映射业务数据字段，例如 `{ id: 'value', label: 'name', children: 'items' }`。

```vue
<OrgTree :data="data" :keys="{ id: 'value', label: 'name', children: 'items' }" />
```

## 受控展开

`expandKeys` 传入后组件进入受控模式：展开状态完全以 prop 为准，交互时只触发 `update:expandKeys`。不传时使用内部状态，并在数据更新时保留仍然存在的节点展开状态。

组件通过 `data` 的引用变化重新解析树结构。直接修改嵌套节点的属性（如 label、children）时，请替换为新的 `data` 引用；拖拽改父级且 `mutateData=true` 是唯一的原地修改场景。

<demo vue="../demos/org-tree/controlled-expand.vue" />

## 拖拽改父级

开启 `node-draggable` 后，将节点拖到另一个节点上即可改父级。默认直接移动原始节点对象，不会复制节点或产生重复 id；拖到自身、原父级或自身后代时自动取消。`beforeDragEnd` 可同步或异步否决改父级。

默认允许拖到空白画布移到根层级；设置 `:drop-on-empty="false"` 后，未拖到任何节点上会直接忽略，不改变数据。

若数据由外部状态管理或为只读数据，设置 `mutate-data="false"`：组件不再修改 `data`，而是触发 `node-reparent`，由父组件根据 `{ id, node, parent, previousParent }` 更新数据。

<demo vue="../demos/org-tree/drag-parent.vue" />

## 画布交互

- `draggable`（默认 `true`）：按住空白区域或节点平移画布，位移按 pointer 1:1 计算，并限制在合理边界内。
- `scalable`（默认 `true`）：滚轮以鼠标位置为锚点缩放，范围由 `minScale` / `maxScale` 限制。`wheelZoom` 可设为 `ctrl`（仅 Ctrl/Meta + 滚轮）或 `none`，避免拦截页面滚动。
- 节点支持键盘导航：`ArrowDown` / `ArrowUp` 在可见节点间移动焦点（首尾不循环），`ArrowRight` / `ArrowLeft` 展开/收起或进入父/子节点，`Home` / `End` 跳到首尾；右键菜单打开后自动聚焦首项并支持方向键，关闭后焦点回到触发节点。
- 节点采用 roving tabindex：同一时刻只有一个节点卡片进入 Tab 顺序，长树不会产生大量 Tab 停靠点。
- 节点 `id` 使用带类型前缀的内部 key（例如 `string:1` 与 `number:1` 不会冲突）；缺少可用 `id` 或 `label` 的节点会被跳过。
- `contextMenu=false`：完全关闭右键菜单。
- 右键菜单使用 `position: fixed` 与视口坐标，并限制在窗口范围内，全屏或页面滚动时不会错位。

## API

### Props

| 属性                 | 类型                                                  | 默认值                                               | 说明                                  |
| -------------------- | ----------------------------------------------------- | ---------------------------------------------------- | ------------------------------------- |
| `data`               | `OrgTreeNode \| OrgTreeNode[]`                        | —（必填）                                            | 树数据，支持单个根节点或多个根节点    |
| `keys`               | `{ id?; label?; children? }`                          | `{ id: 'id', label: 'label', children: 'children' }` | 自定义字段映射                        |
| `horizontal`         | `boolean`                                             | `false`                                              | 横向布局（根在左、子节点向右）        |
| `collapsable`        | `boolean`                                             | `true`                                               | 是否允许收起节点；`false` 时全部展开  |
| `defaultExpandLevel` | `number`                                              | `2`                                                  | 默认展开层级（`depth < value`）       |
| `defaultExpandKeys`  | `Array<string \| number>`                             | `[]`                                                 | 默认展开的节点 key                    |
| `expandKeys`         | `Array<string \| number>`                             | —                                                    | 受控展开 key（`v-model:expandKeys`）  |
| `selectedKey`        | `string \| number \| null`                            | —                                                    | 受控选中 key（`v-model:selectedKey`） |
| `draggable`          | `boolean`                                             | `true`                                               | 允许画布平移                          |
| `scalable`           | `boolean`                                             | `true`                                               | 允许滚轮缩放                          |
| `wheelZoom`          | `'always' \| 'ctrl' \| 'none'`                        | `'always'`                                           | 滚轮缩放触发方式                      |
| `nodeDraggable`      | `boolean`                                             | `false`                                              | 允许拖拽节点改父级                    |
| `dropOnEmpty`        | `boolean`                                             | `true`                                               | 拖到空白画布时是否移到根层级          |
| `mutateData`         | `boolean`                                             | `true`                                               | 拖拽改父级时是否直接修改 `data`       |
| `disabled`           | `boolean`                                             | `false`                                              | 禁用全部交互                          |
| `onlyOneNode`        | `boolean`                                             | `false`                                              | 拖到画布空白处时只允许一个根节点      |
| `center`             | `boolean`                                             | `false`                                              | 初始居中                              |
| `defaultScale`       | `number`                                              | `1`                                                  | 初始缩放                              |
| `minScale`           | `number`                                              | `0.3`                                                | 最小缩放                              |
| `maxScale`           | `number`                                              | `3`                                                  | 最大缩放                              |
| `defaultOffset`      | `{ x?: number; y?: number }`                          | `{ x: 0, y: 0 }`                                     | 初始位移                              |
| `beforeDragEnd`      | `(dragNode, dropNode) => boolean \| Promise<boolean>` | —                                                    | 返回 `false` 否决改父级               |
| `contextMenu`        | `OrgTreeMenuItem[] \| false`                          | 编辑 / 新增 / 删除                                   | 右键菜单项，`false` 完全禁用          |
| `emptyText`          | `string`                                              | `'暂无数据'`                                         | 空状态文本                            |
| `minHeight`          | `string \| number`                                    | `400`                                                | 根容器最小高度，数字按 `px` 处理      |
| `classes`            | `OrgTreeClasses`                                      | —                                                    | 语义化类名，按内部部件注入            |
| `styles`             | `OrgTreeStyles`                                       | —                                                    | 语义化内联样式，按内部部件注入        |

### Emits

| 事件                 | 参数                                     | 说明                                  |
| -------------------- | ---------------------------------------- | ------------------------------------- |
| `update:expandKeys`  | `keys: Array<string \| number>`          | 展开 key 变化                         |
| `update:selectedKey` | `key: string \| number \| null`          | 选中 key 变化                         |
| `node-click`         | `node: OrgTreeNode, event: MouseEvent`   | 点击节点                              |
| `node-dblclick`      | `node: OrgTreeNode, event: MouseEvent`   | 双击节点                              |
| `node-contextmenu`   | `node: OrgTreeNode, event: MouseEvent`   | 右键节点                              |
| `expand`             | `node: OrgTreeNode, expanded: boolean`   | 展开 / 收起节点                       |
| `expand-all`         | `expanded: boolean`                      | 全部展开 / 收起                       |
| `node-drag-start`    | `node: OrgTreeNode`                      | 开始拖拽节点                          |
| `node-drag`          | `node: OrgTreeNode, position: { x; y }`  | 拖拽中（视口坐标）                    |
| `node-drag-end`      | `{ node, parent, canceled, changed }`    | 拖拽结束                              |
| `node-reparent`      | `{ id, node, parent, previousParent }`   | `mutateData=false` 时请求父级更新数据 |
| `menu-click`         | `command: string, node: OrgTreeNode`     | 点击右键菜单项                        |
| `pan`                | `{ x: number; y: number }`               | 画布平移                              |
| `zoom`               | `{ scale: number; translate: { x; y } }` | 缩放变化                              |

### Slots

| 插槽      | 参数                                      | 说明                        |
| --------- | ----------------------------------------- | --------------------------- |
| `default` | `{ node, depth, expanded, toggle }`       | 节点内容（与 `node` 等价）  |
| `node`    | `{ node, depth, expanded, toggle }`       | 节点内容                    |
| `expand`  | `{ node, expanded, toggle, hasChildren }` | 连接线上的展开 / 收起触发器 |
| `empty`   | —                                         | 空状态                      |

`expand` 插槽渲染在节点卡片的连接线上：纵向布局位于节点下方，横向布局位于节点右侧；节点卡片内只保留 `node` 内容。

### Expose

| 方法 / 属性        | 类型                               | 说明                     |
| ------------------ | ---------------------------------- | ------------------------ |
| `zoomIn()`         | `() => void`                       | 放大                     |
| `zoomOut()`        | `() => void`                       | 缩小                     |
| `resetView()`      | `() => void`                       | 恢复初始缩放与位移       |
| `fit()`            | `() => void`                       | 缩放并居中以适应当前视口 |
| `center()`         | `() => void`                       | 内容居中                 |
| `expandAll()`      | `() => void`                       | 展开全部                 |
| `collapseAll()`    | `() => void`                       | 收起全部                 |
| `scrollToNode(id)` | `(id) => Promise<void>`            | 展开祖先并滚动到节点     |
| `getNode(id)`      | `(id) => OrgTreeNode \| undefined` | 按 id 查找节点           |
| `scale`            | `number`                           | 当前缩放                 |
| `translate`        | `{ x: number; y: number }`         | 当前位移                 |

### 语义化类名与样式

`classes` / `styles` 支持：`root`、`viewport`、`canvas`、`node`、`card`、`label`、`toggle`、`children`、`menu`、`menuItem`、`empty`。

```vue
<OrgTree
  :data="data"
  :classes="{ root: 'my-tree', card: 'my-card', toggle: 'my-toggle' }"
  :styles="{ card: { borderRadius: '14px' }, label: { fontWeight: 600 } }"
/>
```

### CSS 变量

| 变量                             | 默认值                                            | 说明         |
| -------------------------------- | ------------------------------------------------- | ------------ |
| `--w-org-tree-line-color`        | `var(--w-color-border-strong, #cbd5e1)`           | 连线颜色     |
| `--w-org-tree-line-width`        | `1.5px`                                           | 连线宽度     |
| `--w-org-tree-line-style`        | `solid`                                           | 连线样式     |
| `--w-org-tree-line-length`       | `44px`                                            | 连线长度     |
| `--w-org-tree-node-gap`          | `20px`                                            | 同级节点间距 |
| `--w-org-tree-card-bg`           | `var(--w-color-surface, #ffffff)`                 | 节点背景     |
| `--w-org-tree-card-border`       | `var(--w-color-border, #e2e8f0)`                  | 节点边框     |
| `--w-org-tree-card-hover`        | `var(--w-color-surface, #ffffff)`                 | 节点悬停背景 |
| `--w-org-tree-card-hover-shadow` | 淡阴影                                            | 节点悬停阴影 |
| `--w-org-tree-selected-bg`       | `var(--w-color-primary-soft, rgba(79,70,229,.1))` | 选中背景     |
| `--w-org-tree-selected-color`    | `var(--w-color-primary, #4f46e5)`                 | 选中颜色     |
| `--w-org-tree-menu-bg`           | `var(--w-color-surface, #ffffff)`                 | 菜单背景     |

### 类名

| 类名                                                | 说明                                           |
| --------------------------------------------------- | ---------------------------------------------- |
| `.w-org-tree`                                       | 根容器，配合 `.is-horizontal` / `.is-panning`  |
| `.w-org-tree__viewport` / `__canvas`                | 视口与变换画布                                 |
| `.w-org-tree__roots` / `__node` / `__children`      | 根层、节点与子节点容器                         |
| `.w-org-tree__node-card`                            | 节点卡片，配合 `.is-selected` / `.is-disabled` |
| `.w-org-tree__node.is-dragging` / `.is-drop-target` | 拖拽中与可放置目标                             |
| `.w-org-tree__toggle` / `__label`                   | 展开按钮与文本                                 |
| `.w-org-tree__menu` / `__menu-item`                 | 右键菜单                                       |
| `.w-org-tree__empty`                                | 空状态                                         |

导出类型：`OrgTreeNode`、`OrgTreeProps`、`OrgTreeKeys`、`OrgTreeMenuItem`、`OrgTreeInstance`、`OrgTreeDragEndEvent`、`OrgTreeTranslate`、`OrgTreeId` 以及各插槽 / 事件参数类型。
