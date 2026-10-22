<script setup lang="ts">
import { ref } from 'vue'
import { WView, WViewContent, WViewSider } from '@wuhu-ui/view'

const collapsed = ref(false)
const items = ['概览', '成员', '权限', '通知', '审计日志']
const active = ref('概览')
</script>

<template>
  <div class="view-demo">
    <WView :full="false" :padding="false" direction="horizontal" gap="0">
      <WViewSider
        v-model:collapsed="collapsed"
        collapsible
        :width="180"
        :collapsed-width="0"
        class="view-demo__sider"
      >
        <nav class="view-demo__nav">
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
      </WViewSider>

      <WViewContent>
        <section class="view-demo__panel">
          <h3>{{ active }}</h3>
          <p>
            Sider 支持 collapsible、自定义宽度与收起宽度；横向布局通过 direction="horizontal" 实现。
          </p>
        </section>
      </WViewContent>
    </WView>
  </div>
</template>

<style scoped>
.view-demo {
  height: 320px;
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

.view-demo__panel {
  margin: 12px;
  padding: 14px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface, #fff);
}

.view-demo__panel h3 {
  margin: 0 0 6px;
  font-size: var(--w-font-size-sm, 13px);
}

.view-demo__panel p {
  margin: 0;
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
  line-height: 1.6;
}
</style>
