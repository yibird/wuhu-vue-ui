<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { ContextMenu } from '@wuhu-vue-ui/context-menu'
import { Copy } from '@wuhu-vue-ui/copy'
import { FileViewer } from '@wuhu-vue-ui/file-viewer'
import { Scrollbar } from '@wuhu-vue-ui/scrollbar'
import { Time } from '@wuhu-vue-ui/time'
import type { ContextMenuExpose, ContextMenuItem } from '@wuhu-vue-ui/context-menu'
import { lastSyncedAt, reviewComments } from './fixtures'
import type { ReviewComment } from './fixtures'

const { isDark } = useData()
const viewerTheme = computed(() => (isDark.value ? 'dark' : 'light'))
const options = { markdown: { baseUrl: '/scenarios/' } }

const menu = ref<ContextMenuExpose>()
const activeComment = ref<ReviewComment | null>(null)

const menuItems = computed<ContextMenuItem[]>(() => [
  { type: 'header', label: '批注操作' },
  { key: 'copy', label: '复制批注' },
  { key: 'resolve', label: '标记已解决' },
  { type: 'separator' },
  { key: 'delete', label: '删除批注', danger: true },
])

function openCommentMenu(event: MouseEvent, comment: ReviewComment) {
  activeComment.value = comment
  menu.value?.open(event)
}

function handleSelect({ item }: { item: ContextMenuItem }) {
  if (!('label' in item) || !activeComment.value) return
  activeComment.value = null
}
</script>

<template>
  <div class="scenario-app">
    <header class="scenario-app__bar">
      <div class="scenario-app__title">
        <strong>版本发布说明书 · v0.1</strong>
        <span>内部评审 · 4 条批注</span>
      </div>
      <div class="scenario-app__meta">
        <Copy :text="() => 'wuhu://docs/release-v0.1'">复制链接</Copy>
        <span>更新于 <Time :time="lastSyncedAt" /></span>
      </div>
    </header>

    <div class="scenario-app__body">
      <div class="scenario-app__main">
        <FileViewer
          src="/scenarios/release-v0.1.md"
          name="release-v0.1.md"
          height="100%"
          :theme="viewerTheme"
          :options="options"
        />
      </div>

      <aside class="scenario-app__side">
        <section class="scenario-app__section scenario-app__section--fill">
          <h3 class="scenario-app__section-title">评审批注</h3>
          <Scrollbar height="100%">
            <div class="scenario-app__list">
              <button
                v-for="comment in reviewComments"
                :key="comment.id"
                type="button"
                class="scenario-comment"
                @contextmenu.prevent="openCommentMenu($event, comment)"
              >
                <span class="scenario-comment__head">
                  <strong>{{ comment.author }}</strong>
                  <span>第 {{ comment.page }} 页</span>
                </span>
                <span class="scenario-comment__body">{{ comment.body }}</span>
                <span class="scenario-comment__time">{{ comment.time }}</span>
              </button>
            </div>
          </Scrollbar>
        </section>
      </aside>
    </div>

    <ContextMenu ref="menu" :items="menuItems" @select="handleSelect" />
  </div>
</template>

<style lang="less">
.scenario-app__section--fill {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.scenario-comment {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  border: 0;
  border-radius: var(--w-radius-md, 8px);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: context-menu;

  &:hover {
    background: var(--w-color-interactive-hover);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    strong {
      font-size: var(--w-font-size-xs);
      font-weight: 600;
    }

    span {
      color: var(--w-color-text-tertiary);
      font-size: var(--w-font-size-2xs);
    }
  }

  &__body {
    color: var(--w-color-text-secondary);
    font-size: var(--w-font-size-xs);
    line-height: 1.5;
  }

  &__time {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-2xs);
  }
}

.scenario-app__main .w-file-viewer {
  height: 100%;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
</style>
