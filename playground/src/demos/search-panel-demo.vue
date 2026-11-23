<script setup lang="ts">
import { ref } from 'vue'
import { SearchPanel } from '@wuhu-vue-ui/search-panel'
import type { CommandMenuItem } from '@wuhu-vue-ui/command-menu'
import DemoCard from '../components/demo-card.vue'

const open = ref(false)
const selected = ref<string | number>()
const feedback = ref('按 Ctrl / Cmd + K 或点击按钮打开')

const items: CommandMenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    description: '查看今日概览与关键指标',
    group: '最近访问',
    shortcut: 'G D',
  },
  {
    key: 'users',
    label: '用户管理',
    description: '搜索、编辑与停用用户',
    group: '最近访问',
    shortcut: 'G U',
  },
  {
    key: 'release',
    label: '发起发布',
    description: '创建版本并通知相关负责人',
    group: '操作',
    shortcut: 'N R',
  },
  {
    key: 'settings',
    label: '系统设置',
    description: '主题、通知与安全策略',
    group: '页面',
    shortcut: 'G S',
  },
  {
    key: 'billing',
    label: '账单与订阅',
    description: '查看发票并管理套餐',
    group: '页面',
    shortcut: 'G B',
  },
]

function handleSelect(item: CommandMenuItem) {
  feedback.value = `已打开「${item.label}」`
}
</script>

<template>
  <DemoCard
    title="模态搜索面板"
    description="默认 Meta/Ctrl+K 唤起，支持 backdrop、Esc、焦点恢复与 body 滚动锁。"
    wide
  >
    <div class="search-panel-demo">
      <button type="button" class="button button--primary button--small" @click="open = true">
        打开搜索面板
      </button>
      <p class="hint">{{ feedback }}</p>

      <SearchPanel
        v-model:open="open"
        v-model:value="selected"
        :items="items"
        placeholder="搜索页面、操作或成员..."
        @select="handleSelect"
      />
    </div>
  </DemoCard>
</template>

<style lang="less">
.search-panel-demo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-height: 120px;
}
</style>
