<script setup lang="ts">
import { ref } from 'vue'
import { CommandMenu } from '@wuhu-vue-ui/command-menu'
import type { CommandMenuItem, CommandMenuKey } from '@wuhu-vue-ui/command-menu'
import DemoCard from '../components/demo-card.vue'

const commandItems: CommandMenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    description: '查看今日概览与关键指标',
    group: '导航',
    keywords: ['首页', 'home', 'shouye'],
    shortcut: 'G D',
  },
  {
    key: 'users',
    label: '用户管理',
    description: '搜索、编辑与停用用户',
    group: '导航',
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
    key: 'settings',
    label: '系统设置',
    description: '主题、通知与安全策略',
    group: '设置',
    keywords: ['配置', 'settings'],
    shortcut: 'G S',
  },
  {
    key: 'billing',
    label: '账单与订阅',
    description: '查看发票并管理套餐',
    group: '设置',
    shortcut: 'G B',
  },
  {
    key: 'help',
    label: '帮助中心',
    description: '查看文档或联系技术支持',
    keywords: ['文档', 'docs'],
  },
  {
    key: 'legacy',
    label: '旧版控制台',
    group: '设置',
    shortcut: 'G L',
    disabled: true,
  },
]

const flatItems: CommandMenuItem[] = [
  { key: 'search', label: '全局搜索', description: '跨项目查找内容', shortcut: '/' },
  { key: 'new', label: '新建文档', description: '创建空白文档', shortcut: 'N' },
  { key: 'invite', label: '邀请成员', description: '发送工作区邀请', shortcut: 'I' },
  { key: 'archive', label: '归档项目', description: '已归档项目不可再编辑', disabled: true },
]

const selected = ref<CommandMenuKey>()
const query = ref('')
const action = ref('试试输入“gzt”“yonghu”或“添加”')

const flatSelected = ref<CommandMenuKey>()
const flatLog = ref<string[]>([])

function handleSelect(item: CommandMenuItem) {
  action.value = `已选择「${item.label}」（${String(item.key)}）`
}

function handleSearch(value: string) {
  query.value = value
  if (!value) action.value = '已清空搜索'
}

function handleFlatSelect(item: CommandMenuItem) {
  flatSelected.value = item.key
  flatLog.value = [`select · ${item.label}`, ...flatLog.value].slice(0, 4)
}

function handleFlatSearch(value: string) {
  flatLog.value = [`search · ${value || '（空）'}`, ...flatLog.value].slice(0, 4)
}

function handleFlatClose() {
  flatLog.value = ['close · Escape 已触发', ...flatLog.value].slice(0, 4)
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="分组 + 搜索"
      description="默认匹配标签、描述与关键词；方向键只移动活动项，Enter 才触发选择。"
      wide
    >
      <div class="command-demo">
        <div class="command-demo__panel">
          <CommandMenu
            v-model="selected"
            :items="commandItems"
            placeholder="搜索命令..."
            @select="handleSelect"
            @search="handleSearch"
          />
        </div>

        <div class="command-demo__meta">
          <div class="command-demo__row">
            <span>当前搜索</span>
            <strong>{{ query || '（空）' }}</strong>
          </div>
          <div class="command-demo__row">
            <span>选中 key</span>
            <strong>{{ selected ?? '（未选择）' }}</strong>
          </div>
          <p class="command-demo__message">{{ action }}</p>
          <p class="hint">
            输入 “gzt” 或 “gongzuotai” 可匹配工作台；禁用项“旧版控制台”会被键盘导航跳过。
          </p>
        </div>
      </div>
    </DemoCard>

    <DemoCard
      title="无分组 + 自定义 Escape 行为"
      description="items 不包含 group 字段时自动按扁平列表展示；escapeBehavior=close 时 Escape 触发 close 事件。"
      wide
    >
      <div class="command-demo">
        <div class="command-demo__panel">
          <CommandMenu
            v-model="flatSelected"
            :items="flatItems"
            escape-behavior="close"
            placeholder="输入命令名称..."
            @select="handleFlatSelect"
            @search="handleFlatSearch"
            @close="handleFlatClose"
          />
        </div>

        <div class="command-demo__meta">
          <div class="command-demo__row">
            <span>选中 key</span>
            <strong>{{ flatSelected ?? '（未选择）' }}</strong>
          </div>
          <div class="event-log">
            <span v-if="flatLog.length === 0" class="hint">事件将显示在这里</span>
            <span v-for="event in flatLog" :key="event" class="event-chip">{{ event }}</span>
          </div>
          <p class="hint">Escape 会发出 close 事件，由父组件决定是否真正关闭面板。</p>
        </div>
      </div>
    </DemoCard>
  </div>
</template>
