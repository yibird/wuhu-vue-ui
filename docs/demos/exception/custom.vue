<script setup lang="ts">
import { ref } from 'vue'
import { Exception } from '@wuhu-ui/exception'

const message = ref('')

function goHome() {
  message.value = '已触发返回首页操作'
}

function retry() {
  message.value = '已触发重试操作'
}
</script>

<template>
  <div class="exception-custom">
    <Exception
      type="serverError"
      title="保存失败了"
      description="服务暂时不可用，请稍后重试。如果问题持续存在，请联系管理员。"
      :image-width="300"
    >
      <template #image>
        <svg viewBox="0 0 240 180" fill="none" aria-hidden="true">
          <circle cx="120" cy="90" r="72" fill="rgba(220, 38, 38, 0.1)" />
          <rect
            x="66"
            y="42"
            width="108"
            height="96"
            rx="14"
            fill="var(--w-color-surface, #ffffff)"
            stroke="var(--w-color-danger, #dc2626)"
            stroke-width="2.5"
          />
          <path
            d="M120 68v30"
            stroke="var(--w-color-danger, #dc2626)"
            stroke-width="4"
            stroke-linecap="round"
          />
          <circle cx="120" cy="114" r="4" fill="var(--w-color-danger, #dc2626)" />
          <path
            d="M88 54h16M88 130h32"
            stroke="var(--w-color-danger, #dc2626)"
            stroke-width="2"
            stroke-linecap="round"
            opacity="0.35"
          />
        </svg>
      </template>

      <template #title="{ title }">
        <span class="exception-custom__title">{{ title }}</span>
      </template>

      <template #description="{ description }">
        <span class="exception-custom__description">{{ description }}</span>
      </template>

      <template #default>
        <div class="exception-custom__footer">
          <div class="exception-custom__actions">
            <button type="button" class="exception-custom__button is-primary" @click="retry">
              重新加载
            </button>
            <button type="button" class="exception-custom__button" @click="goHome">返回首页</button>
          </div>
          <p v-if="message" class="exception-custom__message" role="status">{{ message }}</p>
        </div>
      </template>
    </Exception>
  </div>
</template>

<style lang="less">
.exception-custom {
  overflow: hidden;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: 16px;
  background: var(--w-color-surface, #ffffff);
  box-shadow: var(--w-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.06));
}

.exception-custom__title {
  display: inline-block;
}

.exception-custom__description {
  display: inline-block;
  max-width: 460px;
}

.exception-custom__footer {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 12px;
}

.exception-custom__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.exception-custom__button {
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: 8px;
  background: var(--w-color-surface, #ffffff);
  color: var(--w-color-text, #0f172a);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color var(--w-duration-fast, 120ms) ease,
    background-color var(--w-duration-fast, 120ms) ease;

  &:hover {
    border-color: var(--w-color-border-strong, #cbd5e1);
    background: var(--w-color-surface-hover, #f1f5f9);
  }

  &.is-primary {
    border-color: transparent;
    background: var(--w-color-primary, #4f46e5);
    color: var(--w-color-text-inverse, #ffffff);

    &:hover {
      background: var(--w-color-primary-hover, #6366f1);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--w-color-primary, #4f46e5);
    outline-offset: 2px;
  }
}

.exception-custom__message {
  margin: 0;
  color: var(--w-color-text-secondary, #475569);
  font-size: 12px;
}
</style>
