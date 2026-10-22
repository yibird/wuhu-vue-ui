<script setup lang="ts">
defineOptions({
  name: 'WLoadingBars',
})
</script>

<template>
  <div class="w-loading__bars">
    <span v-for="index in 5" :key="index" />
  </div>
</template>
