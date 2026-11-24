<script setup lang="ts">
import { ref } from 'vue'
import { CommandMenu } from '@wuhu-vue-ui/command-menu'
import type { CommandMenuItem, CommandMenuKey } from '@wuhu-vue-ui/command-menu'

const items: CommandMenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    description: '查看今日概览与关键指标',
    group: '最近访问',
    keywords: ['首页', 'home', 'shouye'],
    shortcut: 'G D',
  },
  {
    key: 'users',
    label: '用户管理',
    description: '搜索、编辑与停用用户',
    group: '最近访问',
    keywords: ['账户', 'members'],
    shortcut: 'G U',
  },
  {
    key: 'create-user',
    label: '新建用户',
    description: '邀请成员加入当前工作区',
    group: '操作',
    keywords: ['添加用户', '邀请'],
    shortcut: 'N U',
  },
  {
    key: 'release',
    label: '发起发布',
    description: '创建版本并通知相关负责人',
    group: '操作',
    keywords: ['上线', 'release', 'fabu'],
    shortcut: 'N R',
  },
  {
    key: 'settings',
    label: '系统设置',
    description: '主题、通知与安全策略',
    group: '页面',
    keywords: ['配置', 'settings'],
    shortcut: 'G S',
  },
  {
    key: 'billing',
    label: '账单与订阅',
    description: '查看发票并管理套餐',
    group: '页面',
    shortcut: 'G B',
  },
  {
    key: 'legacy',
    label: '旧版控制台',
    group: '页面',
    shortcut: 'G L',
    disabled: true,
  },
]

const selected = ref<CommandMenuKey>()
const action = ref('输入“gzt”“yonghu”或“添加”可快速筛选')

function handleSelect(item: CommandMenuItem) {
  action.value = `已打开「${item.label}」`
}
</script>

<template>
  <div class="command-stage">
    <CommandMenu
      v-model:value="selected"
      :items="items"
      placeholder="搜索页面、操作或成员..."
      @select="handleSelect"
    />
    <p class="command-stage__feedback" aria-live="polite">{{ action }}</p>
  </div>
</template>

<style lang="less">
.command-stage {
  width: min(520px, 100%);

  &__feedback {
    margin: 10px 0 0;
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs);
  }
}
</style>
