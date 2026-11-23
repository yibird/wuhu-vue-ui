<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { FileViewer } from '@wuhu-vue-ui/file-viewer'

const { isDark } = useData()
const viewerTheme = computed(() => (isDark.value ? 'dark' : 'light'))
</script>

<template>
  <article class="viewer-card">
    <FileViewer
      src="/samples/sample.wav"
      name="sample.wav"
      :theme="viewerTheme"
      :allow-zoom="false"
      :allow-rotate="false"
      :show-status-bar="false"
      height="340px"
    />
    <div class="viewer-card__footer">
      <span>音频由浏览器原生 <code>audio</code> 播放，工具栏保留下载与打开能力。</span>
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
  border-radius: var(--w-radius-card, var(--w-radius-lg, 12px));
  background: var(--w-color-surface);
  transition: border-color var(--w-duration-fast, 120ms) var(--w-easing-standard, ease);

  &:hover {
    border-color: var(--w-color-border-hover, var(--w-color-border-strong));
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
    font-size: 11px;
    font-weight: 600;
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
