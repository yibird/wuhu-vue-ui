<script setup lang="ts">
import { ref } from 'vue'
import { ResizeContainer } from '@wuhu-ui/resize-container'
import type { ResizeContainerResizeEvent } from '@wuhu-ui/resize-container'

const size = ref({ width: 0, height: 0 })
const count = ref(0)

function handleResize(event: ResizeContainerResizeEvent) {
  size.value = {
    width: Math.round(event.width),
    height: Math.round(event.height),
  }
  count.value += 1
}
</script>

<template>
  <ResizeContainer class="resize-demo" @resize="handleResize">
    <div class="resize-demo__content">
      <strong>{{ size.width }} × {{ size.height }}</strong>
      <span>拖拽右下角改变尺寸</span>
      <small>已触发 {{ count }} 次 resize 事件</small>
      <i aria-hidden="true" />
    </div>
  </ResizeContainer>
</template>

<style lang="less">
.resize-slot {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 150px;
  padding: 16px;
  border: 1px dashed var(--w-color-primary);
  border-radius: var(--w-radius-md);
  background: var(--w-color-surface-subtle);

  &__label {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-3xs);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    color: var(--w-color-primary);
    font-family: var(--w-font-family-mono);
    font-size: 22px;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0;
    color: var(--w-color-text-secondary);
    font-size: var(--w-font-size-xs);
  }
}

.resize-boxes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.resize-mini {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  min-height: 110px;
  padding: 14px;
  border: 1px dashed var(--w-color-border-strong);
  border-radius: var(--w-radius-md);
  background: var(--w-color-surface-subtle);

  span {
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-3xs);
  }

  strong {
    font-family: var(--w-font-family-mono);
    font-size: var(--w-font-size-lg);
  }
}
.resize-demo {
  width: 100%;
  height: 158px;
  min-width: 160px;
  min-height: 90px;
  max-width: 100%;
  max-height: 260px;
  overflow: auto;
  border: 1px dashed var(--w-color-primary);
  border-radius: 12px;
  background:
    linear-gradient(135deg, var(--w-color-primary-soft), transparent 55%),
    var(--w-color-surface-subtle);
  resize: both;

  &__content {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    min-width: 100%;
    min-height: 100%;
    padding: 14px;
    color: var(--w-color-text-secondary);

    strong {
      color: var(--w-color-primary);
      font-family: var(--w-font-family-mono);
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    span {
      font-size: 10px;
    }

    i {
      width: 10px;
      height: 10px;
      margin-top: 6px;
      border-right: 2px solid var(--w-color-primary);
      border-bottom: 2px solid var(--w-color-primary);
      border-radius: 0 0 2px;
      opacity: 0.55;
    }
  }
}
@media (max-width: 760px) {
  .resize-boxes {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
