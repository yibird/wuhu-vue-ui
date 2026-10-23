<script setup lang="ts">
import { ref } from 'vue'
import { IconPicker } from '@wuhu-vue-ui/icon-picker'
import { iconGroups } from './icons'

const selected = ref<string | null>(null)
</script>

<template>
  <IconPicker
    v-model="selected"
    :items="iconGroups"
    :show-search="false"
    :height="320"
    aria-label="无搜索图标选择"
  />
</template>
