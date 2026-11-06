<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { OrgTree } from '@wuhu-vue-ui/org-tree'
import type { OrgTreeDragEndEvent, OrgTreeId, OrgTreeNode } from '@wuhu-vue-ui/org-tree'

function createData(): OrgTreeNode[] {
  return [
    {
      id: 'company',
      label: 'Wuhu 科技',
      children: [
        { id: 'design', label: '设计中心' },
        {
          id: 'engineering',
          label: '研发中心',
          children: [
            { id: 'frontend', label: '前端团队' },
            { id: 'backend', label: '服务端团队' },
          ],
        },
        { id: 'locked', label: '锁定中心（禁止接收）' },
      ],
    },
  ]
}

const data = ref<OrgTreeNode[]>(createData())
const expandKeys = ref<OrgTreeId[]>(['company', 'engineering'])
const feedback = ref('按住节点拖到另一个节点上即可改父级')

function beforeDragEnd(_dragNode: OrgTreeNode, dropNode: OrgTreeNode) {
  if (dropNode.id === 'locked') {
    feedback.value = '「锁定中心」禁止接收节点，本次拖拽已否决'
    return false
  }
  return true
}

function handleDragEnd(event: OrgTreeDragEndEvent) {
  if (event.changed && event.parent) {
    feedback.value = `「${event.node.label}」已移动到「${event.parent.label}」下`
    return
  }

  if (event.canceled) {
    feedback.value = '未拖到有效节点或目标禁止接收，本次拖拽未改变层级'
  }
}

function reset() {
  data.value = createData()
  expandKeys.value = ['company', 'engineering']
  feedback.value = '数据已重置'
}
</script>

<template>
  <div class="org-drag">
    <div class="org-drag__toolbar">
      <span class="hint">拖动节点到另一个节点上改变父级；拖到空白处不会改变层级。</span>
      <Button @click="reset">重置数据</Button>
    </div>

    <OrgTree
      v-model:expand-keys="expandKeys"
      :data="data"
      node-draggable
      :drop-on-empty="false"
      :before-drag-end="beforeDragEnd"
      :context-menu="false"
      :min-height="380"
      center
      @node-drag-end="handleDragEnd"
    />

    <div class="org-drag__status">{{ feedback }}</div>
  </div>
</template>

<style scoped>
.org-drag {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.org-drag__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;

  .hint {
    margin: 0;
  }
}

.org-drag__status {
  padding: 8px 12px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-md);
  background: var(--w-color-surface-subtle);
  color: var(--w-color-text-secondary);
  font-size: 12px;
}
</style>
