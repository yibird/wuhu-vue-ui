<script setup lang="ts">
import { ref } from 'vue'
import { OrgTree } from '@wuhu-vue-ui/org-tree'
import type {
  OrgTreeId,
  OrgTreeInstance,
  OrgTreeMenuItem,
  OrgTreeNode,
} from '@wuhu-vue-ui/org-tree'
import DemoCard from '../components/demo-card.vue'

const treeRef = ref<OrgTreeInstance>()

const selectedKey = ref<OrgTreeId | null>('product')
const expandKeys = ref<OrgTreeId[]>(['company', 'product', 'engineering'])

const contextMenu: OrgTreeMenuItem[] = [
  { label: '查看详情', command: 'view' },
  { label: '新增下级', command: 'add' },
  { label: '归档节点', command: 'archive' },
  { label: '禁止删除', command: 'delete', disabled: true },
]

const treeData = ref<OrgTreeNode[]>([
  {
    id: 'company',
    label: 'Wuhu 科技',
    role: '总部',
    children: [
      {
        id: 'product',
        label: '产品中心',
        role: '产品',
        children: [
          { id: 'design', label: '体验设计组', role: '设计' },
          { id: 'pm', label: '产品规划组', role: '产品' },
        ],
      },
      {
        id: 'engineering',
        label: '研发中心',
        role: '研发',
        children: [
          {
            id: 'frontend',
            label: '前端团队',
            role: '研发',
            children: [
              { id: 'component', label: '组件平台', role: '研发' },
              { id: 'infra', label: '基础设施', role: '研发' },
            ],
          },
          { id: 'backend', label: '服务端团队', role: '研发' },
        ],
      },
      {
        id: 'operations',
        label: '运营中心',
        role: '运营',
        children: [
          { id: 'growth', label: '增长组', role: '运营' },
          { id: 'support', label: '客户成功', role: '运营' },
        ],
      },
    ],
  },
])

const horizontalData = ref<OrgTreeNode[]>([
  {
    id: 'root',
    label: '事业群',
    children: [
      { id: 'east', label: '华东大区' },
      { id: 'south', label: '华南大区' },
      { id: 'north', label: '华北大区' },
    ],
  },
])

const feedback = ref('拖动画布平移，滚轮缩放；按住节点拖到另一个节点即可改父级。')

function nodeOf(id: OrgTreeId): OrgTreeNode | undefined {
  return treeRef.value?.getNode(id)
}

function initials(label: string): string {
  return label.slice(0, 2)
}

function handleMenu(command: string, node: OrgTreeNode) {
  if (command === 'add') {
    const children = node.children ?? []
    node.children = children
    children.push({
      id: `new-${Date.now()}`,
      label: '新节点',
      role: '待分配',
    })
    expandKeys.value = [...new Set([...expandKeys.value, node.id])]
    feedback.value = `已为「${node.label}」新增子节点`
    return
  }

  if (command === 'archive') {
    feedback.value = `已归档「${node.label}」`
    return
  }

  feedback.value = `查看「${node.label}」详情`
}

function handleDragEnd(event: {
  node: OrgTreeNode
  parent: OrgTreeNode | null
  canceled: boolean
  changed: boolean
}) {
  if (event.changed && event.parent) {
    feedback.value = `「${event.node.label}」已移动到「${event.parent.label}」下`
  } else if (event.canceled) {
    feedback.value = '拖拽已取消（不能移动到自身、原父级或后代节点）'
  }
}

function handleSelect(key: OrgTreeId | null) {
  const node = key === null ? undefined : nodeOf(key)
  if (node) feedback.value = `已选中「${node.label}」`
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="组织架构图"
      description="画布平移 / 滚轮缩放、自定义节点、右键菜单与拖拽改父级。"
      wide
      flush
    >
      <div class="org-tree-demo">
        <div class="org-tree-demo__toolbar">
          <div class="org-tree-demo__actions">
            <button
              type="button"
              class="button button--ghost button--small"
              @click="treeRef?.zoomIn()"
            >
              放大
            </button>
            <button
              type="button"
              class="button button--ghost button--small"
              @click="treeRef?.zoomOut()"
            >
              缩小
            </button>
            <button
              type="button"
              class="button button--ghost button--small"
              @click="treeRef?.fit()"
            >
              适应画布
            </button>
            <button
              type="button"
              class="button button--ghost button--small"
              @click="treeRef?.center()"
            >
              居中
            </button>
            <button
              type="button"
              class="button button--ghost button--small"
              @click="treeRef?.resetView()"
            >
              重置
            </button>
          </div>
          <span class="org-tree-demo__status">{{ feedback }}</span>
        </div>

        <OrgTree
          ref="treeRef"
          v-model:expand-keys="expandKeys"
          v-model:selected-key="selectedKey"
          :data="treeData"
          :context-menu="contextMenu"
          node-draggable
          center
          :min-height="560"
          :default-scale="0.9"
          :min-scale="0.35"
          :max-scale="2.5"
          @menu-click="handleMenu"
          @node-drag-end="handleDragEnd"
          @update:selected-key="handleSelect"
        >
          <template #node="{ node, depth, expanded }">
            <span class="org-node" :class="{ 'is-root': depth === 0 }">
              <span class="org-node__avatar" aria-hidden="true">{{ initials(node.label) }}</span>
              <span class="org-node__body">
                <strong class="org-node__label">{{ node.label }}</strong>
                <small class="org-node__meta">
                  {{ node.role ?? '成员' }}
                  <template v-if="node.children?.length">
                    · {{ expanded ? '已展开' : '已收起' }}
                  </template>
                </small>
              </span>
              <button
                type="button"
                class="org-node__action"
                :aria-label="`查看 ${node.label}`"
                @click.stop="feedback = `快捷操作：${node.label}`"
              >
                ⋯
              </button>
            </span>
          </template>
        </OrgTree>

        <div class="org-tree-demo__footer">
          <span>
            当前选中
            <strong>{{ selectedKey === null ? '无' : nodeOf(selectedKey)?.label }}</strong>
          </span>
          <span class="hint"> 右键节点打开菜单；点击节点内的按钮不会触发拖拽或选中。 </span>
        </div>
      </div>
    </DemoCard>

    <DemoCard
      title="横向布局"
      description="horizontal 将子节点排布到右侧，连线使用同一套 CSS 变量。"
      wide
      flush
    >
      <div class="org-tree-demo">
        <OrgTree :data="horizontalData" horizontal center :min-height="300" :context-menu="false" />
      </div>
    </DemoCard>
  </div>
</template>

<style scoped>
.org-tree-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.org-tree-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--w-color-border);
  border-radius: 10px;
  background: var(--w-color-surface-subtle);
}

.org-tree-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.org-tree-demo__status {
  margin-left: auto;
  color: var(--w-color-text-secondary);
  font-size: 12px;
}

.org-tree-demo__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px;
  color: var(--w-color-text-secondary);
  font-size: 12px;
}

.org-tree-demo__footer strong {
  color: var(--w-color-text);
}

.org-node {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.org-node__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 999px;
  background: var(--w-color-primary-soft);
  color: var(--w-color-primary);
  font-size: 11px;
  font-weight: 700;
}

.org-node.is-root .org-node__avatar {
  background: var(--w-color-primary);
  color: #ffffff;
}

.org-node__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.org-node__label {
  overflow: hidden;
  font-size: 13px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-node__meta {
  color: var(--w-color-text-tertiary);
  font-size: 10px;
  line-height: 1.2;
}

.org-node__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: none;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--w-color-text-tertiary);
  cursor: pointer;
}

.org-node__action:hover {
  background: var(--w-color-surface-hover);
  color: var(--w-color-text);
}

.org-node__action:focus-visible {
  outline: 2px solid var(--w-color-primary);
  outline-offset: 1px;
}
</style>
