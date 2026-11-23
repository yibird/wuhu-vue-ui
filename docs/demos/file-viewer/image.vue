<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { RadioGroup, Select } from 'antdv-next'
import { FileViewer } from '@wuhu-vue-ui/file-viewer'

const { isDark } = useData()
const viewerTheme = computed(() => (isDark.value ? 'dark' : 'light'))

const images = [
  { id: 'banner.png', label: 'PNG 位图' },
  { id: 'diagram.svg', label: 'SVG 矢量图' },
] as const

const active = ref<(typeof images)[number]['id']>('banner.png')
const fit = ref<'contain' | 'actual'>('contain')
const background = ref<'checkerboard' | 'solid' | 'transparent'>('checkerboard')

const imageOptions = images.map((image) => ({ label: image.label, value: image.id }))
const fitOptions = [
  { label: 'contain', value: 'contain' },
  { label: 'actual', value: 'actual' },
]
const backgroundOptions = [
  { label: 'checkerboard', value: 'checkerboard' },
  { label: 'solid', value: 'solid' },
  { label: 'transparent', value: 'transparent' },
]

const options = computed(() => ({
  image: { fit: fit.value, background: background.value },
}))
</script>

<template>
  <article class="viewer-card">
    <div class="viewer-card__controls">
      <RadioGroup
        v-model:value="active"
        option-type="button"
        button-style="solid"
        size="small"
        :options="imageOptions"
        class="demo-radio-group"
        aria-label="图片格式"
      />

      <div class="viewer-card__controls-right">
        <label class="demo-control">
          <span>Fit</span>
          <Select v-model:value="fit" :options="fitOptions" style="width: 120px" />
        </label>
        <label class="demo-control">
          <span>Background</span>
          <Select
            v-model:value="background"
            size="small"
            :options="backgroundOptions"
            style="width: 150px"
          />
        </label>
      </div>
    </div>

    <FileViewer
      :src="`/samples/${active}`"
      :name="active"
      :theme="viewerTheme"
      :options="options"
      height="360px"
    />
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
