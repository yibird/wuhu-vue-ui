<script setup lang="ts">
import { ref } from 'vue'
import { Ellipsis } from '@wuhu-vue-ui/ellipsis'
import DemoCard from '../components/demo-card.vue'

const longText =
  'Wuhu Vue UI 是一套面向复杂业务场景的 Vue 3 组件库，采用 pnpm monorepo 组织，一个组件一个独立包。Ellipsis 组件负责在有限空间内展示长文本，并提供多行省略、展开收起与完整内容提示。'

const expanded = ref(false)
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="单行省略" description="lines 默认为 1，折叠时使用 -webkit-line-clamp 截断。">
      <Ellipsis :text="longText" tooltip style="max-width: 420px" />
    </DemoCard>

    <DemoCard
      title="多行省略与展开"
      description="lines 控制折叠行数；只有内容真实溢出时才渲染操作按钮。"
    >
      <Ellipsis :text="longText" :lines="3" expandable style="max-width: 480px" />
    </DemoCard>

    <DemoCard
      title="受控展开"
      description="通过 v-model:expanded 同步展开状态，便于在外部控制或持久化。"
    >
      <Ellipsis
        v-model:expanded="expanded"
        :text="longText"
        :lines="2"
        expandable
        style="max-width: 480px"
      />
      <p class="hint">当前状态：{{ expanded ? '已展开' : '已折叠' }}</p>
    </DemoCard>

    <DemoCard
      title="自定义操作与提示"
      description="action 插槽接收 expanded、toggle、overflowed；tooltip 插槽接收完整 text。"
      wide
    >
      <Ellipsis
        :text="longText"
        :lines="2"
        expandable
        tooltip
        tooltip-placement="bottom"
        style="max-width: 560px"
      >
        <template #action="{ expanded: opened }">
          <span>{{ opened ? '收起全文' : '阅读全文' }}</span>
        </template>
        <template #tooltip="{ text }">
          <span>完整内容 · {{ text.length }} 字</span>
        </template>
      </Ellipsis>
    </DemoCard>
  </div>
</template>
