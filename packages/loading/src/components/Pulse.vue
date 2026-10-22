<script setup lang="ts">
defineOptions({
  name: 'WLoadingPulse',
})
</script>

<template>
  <div class="w-loading__pulse">
    <span v-for="index in 3" :key="index" />
  </div>
</template>
