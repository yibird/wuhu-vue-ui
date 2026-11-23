<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconPicker } from '@wuhu-vue-ui/icon-picker'
import { iconGroups } from './icons'

const selected = ref<string[]>(['arrows-0', 'media-3'])
const summary = computed(() => (selected.value.length ? selected.value.join('、') : '尚未选择'))
</script>

<template>
  <div class="icon-picker-demo">
    <IconPicker v-model="selected" :items="iconGroups" multiple :height="320" />
    <p class="icon-picker-demo__hint">已选 {{ selected.length }} 个：{{ summary }}</p>
  </div>
</template>
