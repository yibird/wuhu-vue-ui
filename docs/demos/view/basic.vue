<script setup lang="ts">
import { ref } from 'vue'
import { View, ViewContent, ViewHeader } from '@wuhu-vue-ui/view'

const collapsed = ref(false)
</script>

<template>
  <div class="view-demo">
    <View :full="false" :gap="10">
      <ViewHeader v-model:collapsed="collapsed" collapsible class="view-demo__header">
        <div class="view-demo__header-inner">
          <div>
            <strong>团队概览</strong>
            <p>头部支持折叠，内容区独立布局。</p>
          </div>
          <button type="button" class="button button--primary button--small">新建报表</button>
        </div>
      </ViewHeader>

      <ViewContent>
        <section class="view-demo__panel">
          <h3>内容区</h3>
          <p>Header、Content、Footer 可以自由组合；点击头部下方的按钮可折叠头部。</p>
        </section>
      </ViewContent>
    </View>
  </div>
</template>

<style scoped>
.view-demo {
  box-sizing: border-box;
  height: 340px;
  padding: 20px;
  overflow: hidden;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-lg, 12px);
}

.view-demo__header-inner {
  display: flex;
  padding: 12px 14px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
  background: #fff;
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

.view-demo__panel {
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

.view-demo__footer {
  color: var(--w-color-text-tertiary, #94a3b8);
  font-size: 11px;
}
</style>
