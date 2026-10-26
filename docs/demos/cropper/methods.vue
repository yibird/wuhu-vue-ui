<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { Cropper } from '@wuhu-vue-ui/cropper'
import type { CropperData, CropperExpose } from '@wuhu-vue-ui/cropper'

const cropperRef = ref<CropperExpose | null>(null)
const selection = ref<CropperData | null>(null)
const events = ref<string[]>([])

function log(message: string) {
  events.value = [message, ...events.value].slice(0, 5)
}

function handleCrop(data: CropperData) {
  selection.value = data
}

function zoomBy(scale: number) {
  cropperRef.value?.zoom(scale)
  log(`zoom(${scale > 0 ? '+' : ''}${scale})`)
}

function rotateBy(degrees: number) {
  cropperRef.value?.rotate(degrees)
  log(`rotate(${degrees})`)
}

function applySelection() {
  cropperRef.value?.setData({ x: 40, y: 40, width: 220, height: 140 })
  log('setData({ x: 40, y: 40, width: 220, height: 140 })')
}

function resetAll() {
  cropperRef.value?.reset()
  log('reset()')
}
</script>

<template>
  <div class="cropper-api">
    <Cropper
      ref="cropperRef"
      src="/samples/banner.png"
      alt="通过实例方法控制的裁剪器"
      :height="320"
      :initial-coverage="0.7"
      :show-action-bar="false"
      @crop="handleCrop"
    >
      <template #default="{ ready }">
        <div class="cropper-toolbar">
          <Button ghost :disabled="!ready" aria-label="缩小" @click="zoomBy(-0.1)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
          </Button>
          <Button ghost :disabled="!ready" aria-label="放大" @click="zoomBy(0.1)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Button>
          <Button ghost :disabled="!ready" aria-label="向左旋转" @click="rotateBy(-90)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </Button>
          <Button ghost :disabled="!ready" aria-label="向右旋转" @click="rotateBy(90)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </Button>
          <Button ghost :disabled="!ready" @click="resetAll">重置</Button>
        </div>
      </template>
    </Cropper>

    <div class="cropper-api__actions">
      <Button @click="applySelection">setData 应用选区</Button>
      <span class="hint">所有操作都通过 ref 暴露的实例方法完成，无需访问内部 DOM。</span>
    </div>

    <div class="cropper-readout">
      <div>
        <span>x / y</span>
        {{ selection ? `${Math.round(selection.x)}, ${Math.round(selection.y)}` : '—' }}
      </div>
      <div>
        <span>width × height</span>
        {{ selection ? `${Math.round(selection.width)} × ${Math.round(selection.height)}` : '—' }}
      </div>
      <div>
        <span>最近操作</span>
        {{ events[0] ?? '—' }}
      </div>
    </div>

    <div class="event-log">
      <span v-if="events.length === 0" class="hint">操作日志将显示在这里</span>
      <span v-for="event in events" :key="event" class="event-chip">{{ event }}</span>
    </div>
  </div>
</template>

<style lang="less">
/* Cropper demo variants */
.cropper-avatar {
  display: block;
  width: 96px;
  height: 96px;
  border: 3px solid var(--w-color-surface);
  border-radius: 50%;
  background: var(--w-color-surface-subtle);
  box-shadow: var(--w-shadow-md);
  object-fit: cover;

  &--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--w-color-border-strong);
    color: var(--w-color-text-tertiary);
    font-size: 11px;
    box-shadow: none;
  }
}

.cropper-api {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cropper-api__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.cropper-readout {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  > div {
    padding: 8px 10px;
    border: 1px solid var(--w-color-border);
    border-radius: 8px;
    background: var(--w-color-surface-subtle);
    color: var(--w-color-text);
    font-family: var(--w-font-family-mono);
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    display: block;
    margin-bottom: 2px;
    color: var(--w-color-text-tertiary);
    font-family: var(--w-font-family);
    font-size: 10px;
  }
}
/* Cropper demo */
.cropper-demo {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) 190px;
  gap: 16px;
}

.cropper-demo__stage {
  min-width: 0;
}

.cropper-demo__aspects {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;

  .button.is-active {
    border-color: var(--w-color-primary-soft-hover);
    background: var(--w-color-primary-soft);
    color: var(--w-color-primary);
  }
}

.cropper-demo__side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--w-color-border);
  border-radius: 14px;
  background: var(--w-color-surface-subtle);
}

.cropper-demo__label {
  color: var(--w-color-text-tertiary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cropper-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px dashed var(--w-color-border-strong);
  border-radius: 12px;
  background: var(--w-color-surface);
  color: var(--w-color-text-tertiary);
  font-size: 11px;
  text-align: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.cropper-toolbar {
  position: absolute;
  top: 10px;
  left: 50%;
  z-index: 2;
  display: flex;
  gap: 2px;
  transform: translateX(-50%);
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--w-radius-full, 9999px);
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.62));
  box-shadow:
    0 2px 6px rgba(15, 23, 42, 0.18),
    0 10px 24px -8px rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(12px) saturate(1.2);
  pointer-events: none;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    flex: none;
    padding: 0 8px;
    border: 0;
    border-radius: var(--w-radius-full, 9999px);
    background: transparent;
    color: rgba(255, 255, 255, 0.9);
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    pointer-events: auto;
    cursor: pointer;
    transition:
      background-color var(--w-duration-fast, 120ms) ease,
      color var(--w-duration-fast, 120ms) ease,
      transform var(--w-duration-fast, 120ms) ease;

    svg {
      width: 15px;
      height: 15px;
      fill: none;
      stroke: currentcolor;
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(0) scale(0.96);
    }

    &:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.8);
      outline-offset: 1px;
    }

    &:disabled {
      color: rgba(255, 255, 255, 0.38);
      cursor: default;
    }

    &:last-child {
      margin-left: 2px;
      padding: 0 10px;
    }
  }
}
@media (max-width: 900px) {
  .cropper-readout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
