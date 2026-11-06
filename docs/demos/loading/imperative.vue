<script setup lang="ts">
import { ref } from 'vue'
import { createLoading, destroyLoading } from '@wuhu-vue-ui/loading'
import type { LoadingInstance } from '@wuhu-vue-ui/loading'

const instance = ref<LoadingInstance | null>(null)

function show() {
  instance.value?.destroy()
  instance.value = createLoading({
    animation: 'spinner',
    title: '正在保存',
    description: '命令式实例，1.6 秒后自动调用 close()。',
  })
  window.setTimeout(() => instance.value?.close(), 1600)
}

function destroy() {
  if (instance.value) destroyLoading(instance.value)
  instance.value = null
}
</script>

<template>
  <div class="loading-demo__actions">
    <button type="button" class="loading-demo__button" @click="show">createLoading()</button>
    <button type="button" class="loading-demo__button loading-demo__button--ghost" @click="destroy">
      destroyLoading()
    </button>
  </div>
</template>

<style scoped>
.loading-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.loading-demo__button {
  padding: 8px 16px;
  border: 1px solid var(--w-color-primary, #4f46e5);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-primary, #4f46e5);
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.loading-demo__button--ghost {
  background: transparent;
  color: var(--w-color-primary, #4f46e5);
}
</style>
