<script setup lang="ts">
import { ref } from 'vue'
import { View, ViewContent, ViewHeader, ViewSider } from '@wuhu-vue-ui/view'

const siderCollapsed = ref(false)
const headerCollapsed = ref(false)
</script>

<template>
  <div class="custom-trigger-demo">
    <section class="custom-trigger-demo__block">
      <h3>自定义 Sider trigger</h3>
      <div class="custom-trigger-demo__stage">
        <View :full="false" direction="horizontal" gap="12">
          <ViewSider
            v-model:collapsed="siderCollapsed"
            collapsible
            :width="200"
            :collapsed-width="0"
            :style="{ borderWidth: siderCollapsed ? 0 : '1px' }"
            class="custom-trigger-demo__sider"
          >
            <template #trigger="{ collapsed, toggle }">
              <button
                type="button"
                class="custom-trigger-demo__sider-trigger"
                :aria-label="collapsed ? '展开侧栏' : '收起侧栏'"
                @click="toggle"
              >
                {{ collapsed ? '»' : '«' }}
              </button>
            </template>
            <nav class="custom-trigger-demo__nav">
              <span>概览</span>
              <span>成员</span>
              <span>设置</span>
            </nav>
          </ViewSider>

          <ViewContent>
            <div class="custom-trigger-demo__content">
              侧栏使用 <code>#trigger</code> 插槽替换内置按钮。
            </div>
          </ViewContent>
        </View>
      </div>
    </section>

    <section class="custom-trigger-demo__block">
      <h3>自定义 Header trigger</h3>
      <div class="custom-trigger-demo__stage">
        <View :full="false" :gap="10">
          <ViewHeader v-model:collapsed="headerCollapsed" collapsible>
            <template #trigger="{ collapsed, toggle }">
              <button
                type="button"
                class="custom-trigger-demo__header-trigger"
                :aria-label="collapsed ? '展开头部' : '收起头部'"
                @click="toggle"
              >
                {{ collapsed ? '展开头部' : '收起头部' }}
              </button>
            </template>
            <div class="custom-trigger-demo__header-inner">
              <strong>团队概览</strong>
              <p>Header 使用自定义触发器，位置与内置按钮一致。</p>
            </div>
          </ViewHeader>
          <ViewContent>
            <div class="custom-trigger-demo__content">内容区域保持独立折叠。</div>
          </ViewContent>
        </View>
      </div>
    </section>
  </div>
</template>

<style scoped>
.custom-trigger-demo {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.custom-trigger-demo__block h3 {
  margin: 0 0 8px;
  font-size: var(--w-font-size-sm, 13px);
}

.custom-trigger-demo__stage {
  box-sizing: border-box;
  height: 240px;
  padding: 20px;
  overflow: visible;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-lg, 12px);
  background: var(--w-color-surface-subtle, #f8fafc);
}

.custom-trigger-demo__sider {
  position: relative;
  z-index: 2;
  border-right: 1px solid var(--w-color-border, #e2e8f0);
  background: var(--w-color-surface, #fff);
}

.custom-trigger-demo__sider-trigger {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 48px;
  padding: 0;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: 6px;
  background: var(--w-color-surface, #fff);
  color: var(--w-color-text-secondary, #475569);
  font: inherit;
  cursor: pointer;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}

.custom-trigger-demo__nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-sm, 13px);
}

.custom-trigger-demo__header-trigger {
  padding: 4px 10px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-full, 9999px);
  background: var(--w-color-surface, #fff);
  color: var(--w-color-primary, #4f46e5);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}

.custom-trigger-demo__header-inner {
  padding: 12px 14px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
}

.custom-trigger-demo__header-inner strong {
  font-size: var(--w-font-size-md, 15px);
}

.custom-trigger-demo__header-inner p {
  margin: 4px 0 0;
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
}

.custom-trigger-demo__content {
  margin: 12px;
  padding: 14px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
}

.custom-trigger-demo__content code {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--w-color-surface-subtle, #f1f5f9);
  color: var(--w-color-primary, #4f46e5);
}
</style>
