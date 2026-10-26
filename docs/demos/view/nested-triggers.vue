<script setup lang="ts">
import { ref } from 'vue'
import { View, ViewContent, ViewHeader, ViewSider } from '@wuhu-vue-ui/view'

const siderCollapsed = ref(false)
const headerCollapsed = ref(false)
const items = ['概览', '成员', '权限', '通知']
const active = ref('概览')
</script>

<template>
  <div class="nested-triggers">
    <View :full="false" direction="horizontal" gap="12">
      <ViewSider
        v-model:collapsed="siderCollapsed"
        collapsible
        :width="190"
        :collapsed-width="0"
        :style="{ borderWidth: siderCollapsed ? 0 : '1px' }"
        class="nested-triggers__sider"
      >
        <nav class="nested-triggers__nav">
          <button
            v-for="item in items"
            :key="item"
            type="button"
            :class="{ 'is-active': item === active }"
            @click="active = item"
          >
            {{ item }}
          </button>
        </nav>
      </ViewSider>

      <View :full="false" :gap="10" class="nested-triggers__main">
        <ViewHeader v-model:collapsed="headerCollapsed" collapsible class="nested-triggers__header">
          <div class="nested-triggers__header-inner">
            <div>
              <strong>{{ active }}</strong>
              <p>侧栏与头部都使用内置触发器。</p>
            </div>
            <span class="nested-triggers__hint">Header trigger</span>
          </div>
        </ViewHeader>

        <ViewContent>
          <section class="nested-triggers__panel">
            <h3>两个触发器可以同时存在</h3>
            <p>
              左侧的 Sider trigger 位于侧栏右边缘，Header trigger
              位于头部下边缘。两者互不影响，可分别收起对应区域。
            </p>
          </section>
        </ViewContent>
      </View>
    </View>
  </div>
</template>

<style scoped>
.nested-triggers {
  height: 380px;
  padding: 20px;
  overflow: visible;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-lg, 12px);
  background: var(--w-color-surface-subtle, #f8fafc);
}

.nested-triggers__sider {
  position: relative;
  z-index: 2;
  border-right: 1px solid var(--w-color-border, #e2e8f0);
  background: var(--w-color-surface, #fff);
}

.nested-triggers__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
}

.nested-triggers__nav button {
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

.nested-triggers__nav button.is-active {
  background: var(--w-color-primary-soft, rgba(79, 70, 229, 0.1));
  color: var(--w-color-primary, #4f46e5);
}

.nested-triggers__main {
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  padding: 0 10px;
  background-color: #eee;
}

.nested-triggers__header-inner {
  display: flex;
  padding: 12px 14px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nested-triggers__header-inner strong {
  font-size: var(--w-font-size-md, 15px);
}

.nested-triggers__header-inner p {
  margin: 4px 0 0;
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
}

.nested-triggers__hint {
  color: var(--w-color-text-tertiary, #5b6678);
  font-size: 11px;
}

.nested-triggers__panel {
  padding: 14px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
}

.nested-triggers__panel h3 {
  margin: 0 0 6px;
  font-size: var(--w-font-size-sm, 13px);
}

.nested-triggers__panel p {
  margin: 0;
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
  line-height: 1.6;
}
</style>
