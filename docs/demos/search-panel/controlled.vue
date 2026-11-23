<script setup lang="ts">
import { ref } from 'vue'
import { SearchPanel } from '@wuhu-vue-ui/search-panel'
import type { SearchPanelExpose } from '@wuhu-vue-ui/search-panel'
import type { CommandMenuItem } from '@wuhu-vue-ui/command-menu'

const panel = ref<SearchPanelExpose>()
const open = ref(false)
const message = ref('面板当前关闭')

const items: CommandMenuItem[] = [
  { key: 'profile', label: '个人资料', group: '账户' },
  { key: 'security', label: '安全设置', group: '账户' },
  { key: 'logout', label: '退出登录', group: '账户' },
]

function toggle() {
  if (open.value) {
    panel.value?.close('api')
    return
  }
  panel.value?.open()
}
</script>

<template>
  <SearchPanel
    ref="panel"
    v-model:open="open"
    :items="items"
    :shortcut="false"
    @open="message = '面板已打开'"
    @close="(reason) => (message = `面板已关闭：${reason}`)"
  />

  <div class="search-panel-controlled">
    <button type="button" class="search-panel-controlled__trigger" @click="toggle">
      {{ open ? '关闭面板' : '打开面板' }}
    </button>
    <span
      >open：<strong>{{ open }}</strong></span
    >
    <span>{{ message }}</span>
  </div>
</template>

<style lang="less">
.search-panel-controlled {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-lg, 12px);
  background: var(--w-color-surface);
  color: var(--w-color-text-tertiary);
  font-size: var(--w-font-size-xs, 12px);

  &__trigger {
    padding: 7px 12px;
    border: 1px solid var(--w-color-border-strong);
    border-radius: var(--w-radius-sm, 6px);
    background: var(--w-color-surface-elevated);
    color: var(--w-color-text);
    font: inherit;
    cursor: pointer;

    &:focus-visible {
      outline: var(--w-focus-ring-width, 2px) solid var(--w-focus-ring-color);
      outline-offset: var(--w-focus-ring-offset, 2px);
    }
  }

  strong {
    color: var(--w-color-text);
  }
}
</style>
