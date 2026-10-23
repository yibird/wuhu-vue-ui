<script setup lang="ts">
import { ref } from 'vue'
import { Cropper } from '@wuhu-vue-ui/cropper'
import type { CropperExpose } from '@wuhu-vue-ui/cropper'
import DemoCard from '../components/demo-card.vue'

const cropperRef = ref<CropperExpose | null>(null)
const croppedPreview = ref('')
const cropperExporting = ref(false)
const cropperAspectRatio = ref<number>()
const cropperAspectOptions: { label: string; value: number | undefined }[] = [
  { label: '自由', value: undefined },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
]

async function exportCrop() {
  if (!cropperRef.value || cropperExporting.value) return
  cropperExporting.value = true
  try {
    croppedPreview.value = (await cropperRef.value.getCroppedDataUrl({ type: 'image/png' })) ?? ''
  } finally {
    cropperExporting.value = false
  }
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="交互式裁剪与导出"
      description="支持拖拽、缩放、旋转、比例锁定与键盘微调，导出结果实时预览。"
      wide
    >
      <div class="cropper-demo">
        <div class="cropper-demo__stage">
          <Cropper
            ref="cropperRef"
            src="/samples/banner.png"
            alt="裁剪示例"
            :height="380"
            :aspect-ratio="cropperAspectRatio"
            :initial-coverage="0.72"
          >
            <template #default="{ ready, zoomIn, zoomOut, rotateLeft, rotateRight, reset }">
              <div class="cropper-toolbar">
                <button type="button" :disabled="!ready" aria-label="缩小" @click="zoomOut">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <button type="button" :disabled="!ready" aria-label="放大" @click="zoomIn">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <button type="button" :disabled="!ready" aria-label="向左旋转" @click="rotateLeft">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
                <button type="button" :disabled="!ready" aria-label="向右旋转" @click="rotateRight">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                </button>
                <button type="button" :disabled="!ready" @click="reset">重置</button>
              </div>
            </template>
          </Cropper>

          <div class="cropper-demo__aspects">
            <button
              v-for="option in cropperAspectOptions"
              :key="option.label"
              type="button"
              class="button button--small"
              :class="{ 'is-active': cropperAspectRatio === option.value }"
              @click="cropperAspectRatio = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <aside class="cropper-demo__side">
          <span class="cropper-demo__label">导出预览</span>
          <div class="cropper-preview">
            <img v-if="croppedPreview" :src="croppedPreview" alt="裁剪结果" />
            <span v-else>点击下方按钮生成</span>
          </div>
          <button
            type="button"
            class="button button--primary button--small"
            :disabled="cropperExporting"
            @click="exportCrop"
          >
            {{ cropperExporting ? '导出中…' : '导出 PNG' }}
          </button>
        </aside>
      </div>
    </DemoCard>

    <DemoCard
      title="固定 16:9 比例"
      description="传入 aspectRatio 后选择框会锁定比例，仍可移动与缩放。"
    >
      <Cropper
        src="/samples/banner.png"
        alt="16:9 裁剪"
        :height="260"
        :aspect-ratio="16 / 9"
        :initial-coverage="0.84"
      />
    </DemoCard>

    <DemoCard title="禁止旋转" description="通过 rotatable=false 等开关精确控制允许的交互。">
      <Cropper
        src="/samples/banner.png"
        alt="只读旋转裁剪"
        :height="260"
        :rotatable="false"
        :initial-coverage="0.7"
      />
    </DemoCard>
  </div>
</template>
