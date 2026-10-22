<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from 'antdv-next'
import { OrgTree } from '@wuhu-ui/org-tree'
import type { OrgTreeId, OrgTreeNode } from '@wuhu-ui/org-tree'

const data: OrgTreeNode[] = [
  {
    id: 'company',
    label: 'Wuhu 科技',
    children: [
      {
        id: 'product',
        label: '产品中心',
        children: [
          { id: 'design', label: '体验设计组' },
          { id: 'planning', label: '产品规划组' },
        ],
      },
      {
        id: 'engineering',
        label: '研发中心',
        children: [
          { id: 'frontend', label: '前端团队' },
          { id: 'backend', label: '服务端团队' },
        ],
      },
    ],
  },
]

const expandKeys = ref<OrgTreeId[]>(['company', 'product'])
const lastEvent = ref('尚未交互')

const allKeys: OrgTreeId[] = ['company', 'product', 'engineering']

const expandedCount = computed(() => expandKeys.value.length)

function expandAll() {
  expandKeys.value = [...allKeys]
}

function collapseAll() {
  expandKeys.value = []
}

function toggleProduct() {
  expandKeys.value = expandKeys.value.includes('product')
    ? expandKeys.value.filter((key) => key !== 'product')
    : [...expandKeys.value, 'product']
}

function handleExpand(node: OrgTreeNode, expanded: boolean) {
  lastEvent.value = `${expanded ? '展开' : '收起'}了「${node.label}」`
}
</script>

<template>
  <div class="org-controlled">
    <div class="org-controlled__toolbar">
      <div class="demo-actions">
        <Button @click="expandAll">全部展开</Button>
        <Button @click="collapseAll">全部收起</Button>
        <Button @click="toggleProduct">切换产品中心</Button>
      </div>
      <span class="org-controlled__count">已展开 {{ expandedCount }} 个节点</span>
    </div>

    <OrgTree
      v-model:expand-keys="expandKeys"
      :data="data"
      :context-menu="false"
      :min-height="340"
      center
      @expand="handleExpand"
    />

    <div class="org-controlled__status">
      <span>{{ lastEvent }}</span>
      <code>expandKeys: [{{ expandKeys.map((key) => `'${key}'`).join(', ') }}]</code>
    </div>
  </div>
</template>

<style scoped>
.org-controlled {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.org-controlled__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.org-controlled__count {
  color: var(--w-color-text-tertiary);
  font-size: 12px;
}

.org-controlled__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--w-color-text-secondary);
  font-size: 12px;

  code {
    color: var(--w-color-text-tertiary);
    font-family: var(--w-font-family-mono);
    font-size: 11px;
  }
}
</style>
