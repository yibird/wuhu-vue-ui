<script setup lang="ts">
import { ref } from 'vue'
import { Cropper } from '@wuhu-vue-ui/cropper'

const showActionBar = ref(true)
</script>

<template>
  <div class="cropper-action-demo">
    <label class="cropper-action-demo__toggle">
      <input v-model="showActionBar" type="checkbox" />
      <span>显示内置操作栏</span>
    </label>

    <Cropper
      src="/samples/banner.png"
      alt="内置操作栏示例"
      :height="340"
      :initial-coverage="0.72"
      :show-action-bar="showActionBar"
    />
  </div>
</template>

<style lang="less">
.cropper-action-demo {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    width: fit-content;
    color: var(--w-color-text-secondary);
    font-size: 12px;
    cursor: pointer;

    input {
      width: 14px;
      height: 14px;
      accent-color: var(--w-color-primary);
      cursor: pointer;
    }
  }
}
</style>
