<script setup lang="ts">
import { ref } from 'vue'
import { Exception } from '@wuhu-ui/exception'
import type { ExceptionType } from '@wuhu-ui/exception'

const types: ExceptionType[] = [
  'badRequest',
  'forbidden',
  'notFound',
  'serverError',
  'networkError',
]
const labels: Record<ExceptionType, string> = {
  badRequest: '请求错误',
  forbidden: '无权限',
  notFound: '页面不存在',
  serverError: '服务端错误',
  networkError: '网络异常',
}
const type = ref<ExceptionType>('notFound')
</script>

<template>
  <div class="exception-demo">
    <div class="exception-demo__tabs" role="tablist" aria-label="错误类型">
      <button
        v-for="item in types"
        :key="item"
        type="button"
        role="tab"
        :class="{ 'is-active': type === item }"
        :aria-selected="type === item"
        @click="type = item"
      >
        <strong>{{ labels[item] }}</strong>
        <span>{{ item }}</span>
      </button>
    </div>

    <div class="exception-demo__stage">
      <Exception :type="type" />
    </div>
  </div>
</template>

<style lang="less">
.exception-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exception-demo__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 13px;
    border: 1px solid var(--w-color-border, #e2e8f0);
    border-radius: 9px;
    background: var(--w-color-surface, #ffffff);
    color: var(--w-color-text-secondary, #475569);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
    transition:
      border-color var(--w-duration-fast, 120ms) ease,
      background-color var(--w-duration-fast, 120ms) ease,
      color var(--w-duration-fast, 120ms) ease;

    &:hover {
      border-color: var(--w-color-border-strong, #cbd5e1);
      color: var(--w-color-text, #0f172a);
    }

    &.is-active {
      border-color: var(--w-color-primary-soft-hover, rgba(79, 70, 229, 0.16));
      background: var(--w-color-primary-soft, rgba(79, 70, 229, 0.1));
      color: var(--w-color-primary, #4f46e5);
    }

    &:focus-visible {
      outline: 2px solid var(--w-color-primary, #4f46e5);
      outline-offset: 2px;
    }
  }

  strong {
    font-family: var(--w-font-family-mono, inherit);
    font-size: 11px;
  }

  span {
    font-size: 11px;
  }
}

.exception-demo__stage {
  overflow: hidden;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: 16px;
  background: var(--w-color-surface, #ffffff);
  box-shadow: var(--w-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
}
</style>
