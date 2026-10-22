<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { Button, RadioGroup, Select, Upload } from 'antdv-next'
import type { RadioChangeEvent, UploadProps } from 'antdv-next'
import { FileViewer } from '@wuhu-ui/file-viewer'
import type { FileViewerReadyEvent } from '@wuhu-ui/file-viewer'
import { fileSamples, type FileSampleId } from './shared'

const { isDark } = useData()
const activeSample = ref<FileSampleId>('sample.docx')
const uploadedFile = ref<File | null>(null)
const locale = ref<'en' | 'zh-CN'>('en')
const watermark = ref(false)
const readyInfo = ref('')

const activeInfo = computed(
  () => fileSamples.find((sample) => sample.id === activeSample.value) ?? fileSamples[0],
)
const source = computed(() => (uploadedFile.value ? '' : `/samples/${activeSample.value}`))
const fileName = computed(() => uploadedFile.value?.name ?? activeSample.value)
const displayName = computed(() =>
  uploadedFile.value
    ? uploadedFile.value.name
    : `${activeInfo.value.label} · ${activeInfo.value.extension}`,
)
const markdownOptions = { markdown: { baseUrl: '/samples/' } }
const viewerTheme = computed(() => (isDark.value ? 'dark' : 'light'))
const sampleOptions = fileSamples.map((sample) => ({ label: sample.label, value: sample.id }))
const localeOptions = [
  { label: 'English', value: 'en' },
  { label: '简体中文', value: 'zh-CN' },
]

function handleSampleChange(event: RadioChangeEvent) {
  activeSample.value = event.target.value as FileSampleId
  uploadedFile.value = null
  readyInfo.value = ''
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  uploadedFile.value = file
  readyInfo.value = ''
  return false
}

function handleReady(event: FileViewerReadyEvent) {
  const pages =
    event.pageCount > 0
      ? `${event.pageCount} page${event.pageCount === 1 ? '' : 's'}`
      : 'single view'
  readyInfo.value = `${event.meta.label} · ${pages} · ${event.capabilities.paged ? 'paged' : 'continuous'}`
}
</script>

<template>
  <article class="viewer-card">
    <div class="viewer-card__controls">
      <RadioGroup
        :value="uploadedFile ? undefined : activeSample"
        option-type="button"
        button-style="solid"
        size="small"
        :options="sampleOptions"
        class="demo-radio-group"
        aria-label="示例文件"
        @change="handleSampleChange"
      />

      <div class="viewer-card__controls-right">
        <label class="demo-control">
          <span>Locale</span>
          <Select
            v-model:value="locale"
            size="small"
            :options="localeOptions"
            style="width: 120px"
          />
        </label>
        <Button
          size="small"
          :type="watermark ? 'primary' : 'default'"
          @click="watermark = !watermark"
        >
          水印
        </Button>
        <Upload :show-upload-list="false" :before-upload="beforeUpload">
          <Button size="small">打开本地文件</Button>
        </Upload>
      </div>
    </div>

    <FileViewer
      :src="source"
      :file="uploadedFile"
      :name="fileName"
      :locale="locale"
      :theme="viewerTheme"
      :options="markdownOptions"
      :watermark="watermark ? 'WUHU UI · PREVIEW' : ''"
      height="600px"
      @ready="handleReady"
    />

    <div class="viewer-card__footer">
      <span>
        当前预览
        <strong>{{ displayName }}</strong>
      </span>
      <span class="hint">
        {{ readyInfo || '选择一个样例或上传本地文件，渲染器会自动按需加载。' }}
      </span>
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
