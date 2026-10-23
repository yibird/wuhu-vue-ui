<script setup lang="ts">
import { ref } from 'vue'
import { ResizeContainer } from '@wuhu-vue-ui/resize-container'
import type { ResizeContainerResizeEvent } from '@wuhu-vue-ui/resize-container'
import DemoCard from '../components/demo-card.vue'

const resizeSize = ref({ width: 0, height: 0 })
const resizeCount = ref(0)

function handleResize(event: ResizeContainerResizeEvent) {
  resizeSize.value = {
    width: Math.round(event.width),
    height: Math.round(event.height),
  }
  resizeCount.value += 1
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="拖拽改变尺寸" description="拖拽右下角手柄，容器会实时上报内容盒尺寸。">
      <ResizeContainer class="resize-demo" @resize="handleResize">
        <div class="resize-demo__content">
          <strong>{{ resizeSize.width }} × {{ resizeSize.height }}</strong>
          <span>拖拽右下角改变尺寸</span>
          <small>已触发 {{ resizeCount }} 次 resize 事件</small>
          <i aria-hidden="true" />
        </div>
      </ResizeContainer>
    </DemoCard>

    <DemoCard title="防抖与插槽" description="debounce=200 减少高频回调，默认插槽直接提供宽高。">
      <ResizeContainer v-slot="{ width, height }" :debounce="200" immediate>
        <div class="resize-slot">
          <span class="resize-slot__label">Debounced</span>
          <strong>{{ Math.round(width) }} × {{ Math.round(height) }}</strong>
          <p>父级宽度变化时，这里的数字会在 200ms 后更新。</p>
        </div>
      </ResizeContainer>
    </DemoCard>

    <DemoCard
      title="border-box 观察"
      description="box 可切换 content-box、border-box 或 device-pixel-content-box。"
      wide
    >
      <div class="resize-boxes">
        <ResizeContainer v-slot="{ width, height }" box="border-box">
          <div class="resize-mini">
            <span>border-box</span>
            <strong>{{ Math.round(width) }} × {{ Math.round(height) }}</strong>
          </div>
        </ResizeContainer>
        <ResizeContainer v-slot="{ width, height }" immediate>
          <div class="resize-mini">
            <span>content-box</span>
            <strong>{{ Math.round(width) }} × {{ Math.round(height) }}</strong>
          </div>
        </ResizeContainer>
      </div>
    </DemoCard>
  </div>
</template>
