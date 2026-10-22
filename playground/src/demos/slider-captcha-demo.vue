<script setup lang="ts">
import { ref } from 'vue'
import { SliderCaptcha } from '@wuhu-ui/slider-captcha'

const status = ref('拖动滑块完成拼图')

function onSuccess(): void {
  status.value = '验证通过'
}

function onFail(): void {
  status.value = '验证失败，已刷新'
}

function onRefresh(): void {
  status.value = '已生成新的拼图'
}
</script>

<template>
  <div class="slider-captcha-demo">
    <SliderCaptcha @success="onSuccess" @fail="onFail" @refresh="onRefresh" />
    <p class="hint">{{ status }}</p>
  </div>
</template>

<style scoped>
.slider-captcha-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
</style>
