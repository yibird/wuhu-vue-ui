<script setup lang="ts">
import { OrgTree } from '@wuhu-vue-ui/org-tree'
import type { OrgTreeNode } from '@wuhu-vue-ui/org-tree'

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
          { id: 'plan', label: '产品规划组' },
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
      { id: 'operations', label: '运营中心' },
    ],
  },
]
</script>

<template>
  <OrgTree :data="data" :min-height="380" :context-menu="false" />
</template>
