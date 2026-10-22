<script setup lang="ts">
import { ref } from 'vue'
import { Exception } from '@wuhu-ui/exception'
import type { ExceptionType } from '@wuhu-ui/exception'
import DemoCard from '../components/demo-card.vue'

const types: ExceptionType[] = [
  'badRequest',
  'forbidden',
  'notFound',
  'serverError',
  'networkError',
]
const type = ref<ExceptionType>('notFound')
const message = ref('')

function handleBack() {
  message.value = '已触发返回首页操作'
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="内置错误类型"
      description="badRequest / forbidden / notFound / serverError / networkError 自动切换插图、标题与描述。"
      wide
      flush
    >
      <div class="exception-demo">
        <div class="exception-demo__tabs" role="tablist" aria-label="错误类型">
          <button
            v-for="item in types"
            :key="item"
            type="button"
            role="tab"
            class="exception-demo__tab"
            :class="{ 'is-active': type === item }"
            :aria-selected="type === item"
            @click="type = item"
          >
            {{ item }}
          </button>
        </div>
        <Exception :type="type" />
      </div>
    </DemoCard>

    <DemoCard
      title="自定义标题与操作"
      description="通过 props 覆盖标题，使用默认插槽放置操作按钮。"
      wide
    >
      <Exception type="serverError" title="保存失败了" description="服务暂时不可用，请稍后重试。">
        <button type="button" class="button button--primary button--small" @click="handleBack">
          返回首页
        </button>
      </Exception>
      <p v-if="message" class="hint" role="status">{{ message }}</p>
    </DemoCard>
  </div>
</template>

<style lang="less" scoped>
.exception-demo__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 16px 16px 0;
}

.exception-demo__tab {
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--w-color-border);
  border-radius: 8px;
  background: var(--w-color-surface);
  color: var(--w-color-text-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;

  &.is-active {
    border-color: var(--w-color-primary-soft-hover);
    background: var(--w-color-primary-soft);
    color: var(--w-color-primary);
  }
}
</style>
