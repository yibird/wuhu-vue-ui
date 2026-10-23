<script setup lang="ts">
import { ref } from 'vue'
import { OrgTree } from '@wuhu-vue-ui/org-tree'
import type { OrgTreeId, OrgTreeNode } from '@wuhu-vue-ui/org-tree'

const data: OrgTreeNode[] = [
  {
    id: 'company',
    label: 'Wuhu 科技',
    role: '总部',
    children: [
      {
        id: 'design',
        label: '体验设计组',
        role: '设计',
        headcount: 8,
      },
      {
        id: 'engineering',
        label: '研发中心',
        role: '研发',
        headcount: 26,
        children: [
          { id: 'frontend', label: '前端团队', role: '研发', headcount: 12 },
          { id: 'backend', label: '服务端团队', role: '研发', headcount: 14 },
        ],
      },
    ],
  },
]

const selectedKey = ref<OrgTreeId | null>('design')
const expandKeys = ref<OrgTreeId[]>(['company', 'engineering'])
const action = ref('点击节点卡片或节点内按钮试试')

function initials(label: string) {
  return label.slice(0, 2)
}

function handleAction(node: OrgTreeNode) {
  action.value = `节点内按钮已触发：查看「${node.label}」详情`
}
</script>

<template>
  <div class="org-custom">
    <OrgTree
      v-model:selected-key="selectedKey"
      v-model:expand-keys="expandKeys"
      :data="data"
      :context-menu="false"
      :min-height="320"
      center
    >
      <template #node="{ node, depth, expanded }">
        <span class="org-node" :class="{ 'is-root': depth === 0 }">
          <span class="org-node__avatar" aria-hidden="true">{{ initials(node.label) }}</span>
          <span class="org-node__body">
            <strong class="org-node__label">{{ node.label }}</strong>
            <span class="org-node__meta">
              {{ node.role }}
              <template v-if="node.headcount"> · {{ node.headcount }} 人</template>
              <template v-if="node.children?.length">
                · {{ expanded ? '已展开' : '已收起' }}
              </template>
            </span>
          </span>
          <button
            type="button"
            class="org-node__action"
            :aria-label="`查看 ${node.label} 详情`"
            @click.stop="handleAction(node)"
          >
            详情
          </button>
        </span>
      </template>
    </OrgTree>

    <div class="org-custom__status">
      <span>{{ action }}</span>
      <span class="hint">节点内的 button 不会触发选中或拖拽</span>
    </div>
  </div>
</template>

<style scoped>
.org-custom {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.org-custom__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--w-color-text-secondary);
  font-size: 12px;
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
  border-radius: var(--w-radius-full);
  background: var(--w-color-primary-soft);
  color: var(--w-color-primary);
  font-size: 11px;
  font-weight: 700;
}

.org-node.is-root .org-node__avatar {
  background: var(--w-color-primary);
  color: var(--w-color-text-inverse);
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
  height: 22px;
  flex: none;
  padding: 0 7px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-full);
  background: var(--w-color-surface);
  color: var(--w-color-text-tertiary);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
  transition:
    border-color var(--w-duration-fast) var(--w-easing-standard),
    background-color var(--w-duration-fast) var(--w-easing-standard),
    color var(--w-duration-fast) var(--w-easing-standard);
}

.org-node__action:hover {
  border-color: var(--w-color-primary-soft-hover);
  background: var(--w-color-primary-soft);
  color: var(--w-color-primary);
}

.org-node__action:focus-visible {
  outline: var(--w-focus-ring-width) solid var(--w-focus-ring-color);
  outline-offset: var(--w-focus-ring-offset);
}
</style>
