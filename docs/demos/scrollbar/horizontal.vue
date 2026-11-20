<script setup lang="ts">
import { Scrollbar } from '@wuhu-vue-ui/scrollbar'
</script>

<template>
  <Scrollbar height="148px" always class="demo-scrollbar">
    <div class="scroll-strip">
      <span v-for="index in 8" :key="index" class="scroll-strip__block" />
    </div>
  </Scrollbar>
</template>

<style lang="less">
.scroll-strip {
  display: flex;
  gap: 12px;
  width: max-content;
  padding: 12px;

  &__block {
    display: block;
    width: 184px;
    height: 112px;
    border-radius: 10px;
    background: var(--w-color-surface-subtle, #f1f5f9);
  }
}
</style>
