<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileViewer } from '@wuhu-ui/file-viewer'
import type { FileViewerReadyEvent } from '@wuhu-ui/file-viewer'
import DemoCard from '../components/demo-card.vue'
import { theme } from '../theme'

const fileSamples = [
  { id: 'sample.docx', label: 'Word', extension: 'DOCX' },
  { id: 'sample.rtf', label: 'Rich Text', extension: 'RTF' },
  { id: 'sample.xlsx', label: 'Excel', extension: 'XLSX' },
  { id: 'sample.pptx', label: 'PowerPoint', extension: 'PPTX' },
  { id: 'sample.pdf', label: 'PDF', extension: 'PDF' },
  { id: 'sample.epub', label: 'EPUB', extension: 'EPUB' },
  { id: 'sample.zip', label: 'Archive', extension: 'ZIP' },
  { id: 'readme.md', label: 'Markdown', extension: 'MD' },
  { id: 'code.ts', label: 'TypeScript', extension: 'TS' },
  { id: 'data.json', label: 'JSON', extension: 'JSON' },
  { id: 'table.csv', label: 'CSV', extension: 'CSV' },
  { id: 'diagram.svg', label: 'SVG', extension: 'SVG' },
  { id: 'page.html', label: 'HTML', extension: 'HTML' },
  { id: 'captions.srt', label: 'Subtitles', extension: 'SRT' },
  { id: 'sample.wav', label: 'Audio', extension: 'WAV' },
] as const

type FileSampleId = (typeof fileSamples)[number]['id']

const activeFileSample = ref<FileSampleId>('sample.docx')
const uploadedFile = ref<File | null>(null)
const viewerLocale = ref<'en' | 'zh-CN'>('en')
const viewerWatermark = ref(false)
const viewerReadyInfo = ref('')

const activeFileSampleInfo = computed(
  () => fileSamples.find((sample) => sample.id === activeFileSample.value) ?? fileSamples[0],
)
const viewerSource = computed(() =>
  uploadedFile.value ? '' : `/samples/${activeFileSample.value}`,
)
const viewerFileName = computed(() => uploadedFile.value?.name ?? activeFileSample.value)
const viewerDisplayName = computed(() =>
  uploadedFile.value
    ? uploadedFile.value.name
    : `${activeFileSampleInfo.value.label} · ${activeFileSampleInfo.value.extension}`,
)
const markdownOptions = {
  markdown: { baseUrl: '/samples/' },
}

function selectFileSample(id: FileSampleId) {
  activeFileSample.value = id
  uploadedFile.value = null
  viewerReadyInfo.value = ''
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    uploadedFile.value = file
    viewerReadyInfo.value = ''
  }
  target.value = ''
}

function handleViewerReady(event: FileViewerReadyEvent) {
  const pages =
    event.pageCount > 0
      ? `${event.pageCount} page${event.pageCount === 1 ? '' : 's'}`
      : 'single view'
  viewerReadyInfo.value = `${event.meta.label} · ${pages} · ${event.capabilities.paged ? 'paged' : 'continuous'}`
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="多格式文件预览"
      description="切换样例或上传本地文件，渲染器按需加载；支持主题、水印与国际化。"
      wide
    >
      <article class="viewer-card">
        <div class="viewer-card__controls">
          <div class="sample-tabs" role="tablist" aria-label="示例文件">
            <button
              v-for="sample in fileSamples"
              :key="sample.id"
              type="button"
              role="tab"
              class="sample-tab"
              :class="{ 'is-active': !uploadedFile && activeFileSample === sample.id }"
              :aria-selected="!uploadedFile && activeFileSample === sample.id"
              @click="selectFileSample(sample.id)"
            >
              <span>{{ sample.label }}</span>
              <small>{{ sample.extension }}</small>
            </button>
          </div>

          <div class="viewer-card__controls-right">
            <label class="viewer-select">
              <span>Locale</span>
              <select v-model="viewerLocale">
                <option value="en">English</option>
                <option value="zh-CN">简体中文</option>
              </select>
            </label>
            <button
              type="button"
              class="button button--ghost button--small"
              :class="{ 'is-active': viewerWatermark }"
              @click="viewerWatermark = !viewerWatermark"
            >
              水印
            </button>
            <label class="button button--small file-picker">
              打开本地文件
              <input type="file" @change="handleFileUpload" />
            </label>
          </div>
        </div>

        <FileViewer
          :src="viewerSource"
          :file="uploadedFile"
          :name="viewerFileName"
          :locale="viewerLocale"
          :theme="theme"
          :options="markdownOptions"
          :watermark="viewerWatermark ? 'WUHU UI · PREVIEW' : ''"
          height="640px"
          @ready="handleViewerReady"
        />

        <div class="viewer-card__footer">
          <span>
            当前预览
            <strong>{{ viewerDisplayName }}</strong>
          </span>
          <span class="hint">
            {{ viewerReadyInfo || '选择一个样例或上传本地文件，渲染器会自动按需加载。' }}
          </span>
        </div>
      </article>
    </DemoCard>

    <DemoCard title="精简工具栏" description="隐藏工具栏与状态栏，只保留内容区域，适合文档内嵌。">
      <FileViewer
        src="/samples/readme.md"
        name="readme.md"
        :theme="theme"
        :options="markdownOptions"
        :height="360"
        :show-toolbar="false"
        :show-status-bar="false"
        :show-file-info="false"
        :allow-download="false"
        :allow-print="false"
        :allow-open="false"
        :allow-fullscreen="false"
        :allow-zoom="false"
        :allow-rotate="false"
      />
    </DemoCard>

    <DemoCard title="自定义主题变量" description="themeVars 可在实例级覆盖品牌色与圆角。">
      <FileViewer
        src="/samples/code.ts"
        name="code.ts"
        theme="light"
        :theme-vars="{ '--w-file-viewer-primary': '#059669', '--w-file-viewer-radius': '10px' }"
        :height="300"
        :show-toolbar="false"
        :show-status-bar="false"
        :show-file-info="false"
        :allow-download="false"
        :allow-print="false"
        :allow-open="false"
        :allow-fullscreen="false"
      />
    </DemoCard>
  </div>
</template>
