<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { Button } from 'antdv-next'
import { FileViewer } from '@wuhu-ui/file-viewer'
import type { FileViewerLoadEvent, FileViewerReadyEvent } from '@wuhu-ui/file-viewer'

const { isDark } = useData()
const viewerTheme = computed(() => (isDark.value ? 'dark' : 'light'))

const viewerRef = ref<InstanceType<typeof FileViewer> | null>(null)
const page = ref(1)
const zoom = ref(1)
const readyInfo = ref('等待加载')
const events = ref<string[]>([])

function log(message: string) {
  events.value = [message, ...events.value].slice(0, 7)
}

function handleLoad(event: FileViewerLoadEvent) {
  log(`load · ${event.meta.name}`)
}

function handleReady(event: FileViewerReadyEvent) {
  readyInfo.value = `${event.meta.label} · ${event.pageCount} 页 · ${event.capabilities.paged ? '分页' : '连续'}`
  log(`ready · ${event.pageCount} 页`)
}

function handlePageChange(value: number) {
  log(`page-change · ${value}`)
}

function handleZoomChange(value: number) {
  log(`zoom-change · ${Math.round(value * 100)}%`)
}

function handleRotationChange(value: number) {
  log(`rotation-change · ${value}°`)
}

function handleError(error: Error) {
  log(`error · ${error.message}`)
}

function externalZoomIn() {
  viewerRef.value?.zoomIn()
}

function externalZoomOut() {
  viewerRef.value?.zoomOut()
}

function externalNextPage() {
  viewerRef.value?.nextPage()
}

function externalPreviousPage() {
  viewerRef.value?.previousPage()
}
</script>

<template>
  <article class="viewer-card">
    <div class="viewer-card__controls">
      <div class="demo-actions">
        <Button aria-label="上一页" @click="externalPreviousPage">上一页</Button>
        <Button aria-label="下一页" @click="externalNextPage">下一页</Button>
        <Button aria-label="缩小" @click="externalZoomOut">缩小</Button>
        <Button aria-label="放大" @click="externalZoomIn">放大</Button>
      </div>
      <span class="hint">{{ readyInfo }}</span>
    </div>

    <FileViewer
      ref="viewerRef"
      v-model:page="page"
      v-model:zoom="zoom"
      src="/samples/sample.docx"
      name="sample.docx"
      :theme="viewerTheme"
      height="440px"
      @load="handleLoad"
      @ready="handleReady"
      @page-change="handlePageChange"
      @zoom-change="handleZoomChange"
      @rotation-change="handleRotationChange"
      @error="handleError"
    />

    <div class="viewer-card__footer">
      <span>
        当前状态
        <strong>{{ page }} 页 · {{ Math.round(zoom * 100) }}%</strong>
      </span>
      <div class="event-log">
        <span v-if="events.length === 0" class="hint">事件将显示在这里</span>
        <span v-for="event in events" :key="event" class="event-chip">{{ event }}</span>
      </div>
    </div>
  </article>
</template>

<style lang="less">
.highlight-options {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  color: var(--w-color-text-secondary);
  font-size: var(--w-font-size-xs);

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .hint {
    margin: 0 0 0 auto;
  }
}
.viewer-card {
  position: relative;
  padding: 16px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-panel, 16px);
  background: var(--w-color-surface);
  box-shadow: var(--w-shadow-sm);
  transition:
    border-color var(--w-duration-normal, 220ms) var(--w-easing-standard, ease),
    box-shadow var(--w-duration-normal, 220ms) var(--w-easing-standard, ease);

  &:hover {
    border-color: var(--w-color-border-hover, var(--w-color-border-strong));
    box-shadow: var(--w-shadow-md);
  }
}

.viewer-card__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.sample-tabs {
  display: flex;
  flex: 1 1 520px;
  flex-wrap: wrap;
  gap: 4px;
}

.sample-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: var(--w-radius-md, 8px);
  background: var(--w-color-surface-subtle);
  color: var(--w-color-text-secondary);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--w-duration-fast) var(--w-easing-standard),
    border-color var(--w-duration-fast) var(--w-easing-standard),
    color var(--w-duration-fast) var(--w-easing-standard);

  small {
    color: var(--w-color-text-tertiary);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  &:hover {
    background: var(--w-color-surface-hover);
    color: var(--w-color-text);
  }

  &.is-active {
    border-color: var(--w-color-primary-soft-hover);
    background: var(--w-color-primary-soft);
    color: var(--w-color-primary);

    small {
      color: var(--w-color-primary);
      opacity: 0.72;
    }
  }

  &:focus-visible {
    outline: var(--w-focus-ring-width, 2px) solid var(--w-focus-ring-color, #4f46e5);
    outline-offset: var(--w-focus-ring-offset, 2px);
  }
}

.viewer-card__controls-right {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.viewer-select {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--w-color-text-tertiary);
  font-size: 12px;

  select {
    height: 32px;
    padding: 0 8px;
    border: 1px solid var(--w-color-border);
    border-radius: var(--w-radius-md);
    background: var(--w-color-surface);
    color: var(--w-color-text);
    font-family: inherit;
    font-size: 12px;
    outline: none;

    &:focus-visible {
      border-color: var(--w-color-primary);
      outline: var(--w-focus-ring-width, 2px) solid var(--w-focus-ring-color, #4f46e5);
      outline-offset: var(--w-focus-ring-offset, 2px);
    }
  }
}

.file-picker {
  position: relative;
  overflow: hidden;
  cursor: pointer;

  input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
}

.viewer-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 4px 2px;
  color: var(--w-color-text-tertiary);
  font-size: 12px;
  flex-wrap: wrap;

  strong {
    margin-left: 4px;
    color: var(--w-color-text-secondary);
    font-weight: 600;
  }
}
.viewer-card .ant-btn {
  height: 28px;
  padding-inline: 10px;
  font-size: 12px;
}
@media (max-width: 640px) {
  .viewer-card__controls {
    align-items: stretch;
    flex-direction: column;
  }
  .viewer-card__controls-right {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .viewer-card {
    transition: none;
  }
}
</style>
