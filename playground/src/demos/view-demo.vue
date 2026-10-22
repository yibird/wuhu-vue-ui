<script setup lang="ts">
import { ref } from 'vue'
import { WView, WViewContent, WViewFooter, WViewHeader, WViewSider } from '@wuhu-ui/view'
import DemoCard from '../components/demo-card.vue'

const headerCollapsed = ref(false)
const siderCollapsed = ref(false)

const navItems = ['概览', '成员', '权限', '通知', '审计日志']
const activeNav = ref('概览')

const metrics = [
  { label: '活跃用户', value: '12,480', delta: '+8.2%' },
  { label: '转化率', value: '4.6%', delta: '+1.1%' },
  { label: '平均响应', value: '182ms', delta: '-12ms' },
]
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="组合式页面布局"
      description="Header / Sider / Content / Footer 独立组合，均支持折叠与插槽。"
      wide
    >
      <div class="view-demo__stage">
        <WView :full="false" :padding="false" direction="horizontal" gap="12">
          <WViewSider
            v-model:collapsed="siderCollapsed"
            collapsible
            :width="190"
            :collapsed-width="0"
            class="view-demo__sider"
          >
            <nav class="view-demo__nav">
              <button
                v-for="item in navItems"
                :key="item"
                type="button"
                :class="{ 'is-active': item === activeNav }"
                @click="activeNav = item"
              >
                {{ item }}
              </button>
            </nav>
          </WViewSider>

          <WView :full="false" padding :gap="10" class="view-demo__main">
            <WViewHeader v-model:collapsed="headerCollapsed" collapsible class="view-demo__header">
              <div class="view-demo__header-inner">
                <div>
                  <strong>团队概览</strong>
                  <p>查看关键指标、成员动态与待办事项。</p>
                </div>
                <button type="button" class="button button--primary button--small">新建报表</button>
              </div>
            </WViewHeader>

            <WViewContent>
              <div class="view-demo__grid">
                <article v-for="metric in metrics" :key="metric.label" class="view-demo__card">
                  <span>{{ metric.label }}</span>
                  <strong>{{ metric.value }}</strong>
                  <small>{{ metric.delta }}</small>
                </article>
              </div>
            </WViewContent>

            <WViewFooter>
              <span class="view-demo__footer">数据每 5 分钟自动刷新</span>
            </WViewFooter>
          </WView>
        </WView>
      </div>
    </DemoCard>
  </div>
</template>

<style scoped>
.view-demo__stage {
  height: 460px;
  overflow: hidden;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-lg, 12px);
  background: var(--w-color-surface-subtle, #f8fafc);
}

.view-demo__sider {
  border-right: 1px solid var(--w-color-border, #e2e8f0);
  background: var(--w-color-surface, #fff);
}

.view-demo__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
}

.view-demo__nav button {
  padding: 8px 10px;
  border: 0;
  border-radius: var(--w-radius-sm, 6px);
  background: transparent;
  color: var(--w-color-text-secondary, #475569);
  font: inherit;
  font-size: var(--w-font-size-sm, 13px);
  text-align: left;
  cursor: pointer;
}

.view-demo__nav button.is-active {
  background: var(--w-color-primary-soft, rgba(79, 70, 229, 0.1));
  color: var(--w-color-primary, #4f46e5);
}

.view-demo__main {
  min-width: 0;
  background: var(--w-color-bg, #f8fafc);
}

.view-demo__header {
  padding: 12px 14px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
}

.view-demo__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.view-demo__header-inner strong {
  font-size: var(--w-font-size-md, 15px);
}

.view-demo__header-inner p {
  margin: 4px 0 0;
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
}

.view-demo__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.view-demo__card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
}

.view-demo__card span {
  color: var(--w-color-text-tertiary, #94a3b8);
  font-size: 11px;
}

.view-demo__card strong {
  font-size: 20px;
  letter-spacing: -0.02em;
}

.view-demo__card small {
  color: #047857;
  font-size: 10px;
}

.view-demo__footer {
  color: var(--w-color-text-tertiary, #94a3b8);
  font-size: 11px;
}
</style>
