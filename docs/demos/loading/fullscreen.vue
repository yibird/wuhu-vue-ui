<script setup lang="ts">
import { ref } from 'vue'
import { Loading } from '@wuhu-vue-ui/loading'

const open = ref(false)

function show() {
  open.value = true
  window.setTimeout(() => {
    open.value = false
  }, 10000)
}
</script>

<template>
  <button type="button" class="loading-demo__button" @click="show">显示全屏 Loading</button>
  <Loading
    v-model:open="open"
    full
    animation="pulse"
    title="正在处理"
    description="全屏遮罩会默认锁定 body 滚动，1.6 秒后自动关闭。"
  />
</template>

<style scoped>
.loading-demo__button {
  padding: 8px 16px;
  border: 1px solid var(--w-color-primary, #4f46e5);
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-primary, #4f46e5);
  color: #fff;
  font: inherit;
  cursor: pointer;
}
</style>
