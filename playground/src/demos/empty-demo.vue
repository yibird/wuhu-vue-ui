<script setup lang="ts">
import { ref } from 'vue'
import { Empty } from '@wuhu-vue-ui/empty'
import DemoCard from '../components/demo-card.vue'

const message = ref('')

function handleAction(label: string) {
  message.value = `已触发「${label}」`
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="默认空状态" description="未传入图片时展示内置插图，默认标题为「暂无数据」。">
      <Empty />
    </DemoCard>

    <DemoCard
      title="自定义图片"
      description="image 传入自定义图片地址；加载失败时自动回退到内置插图。"
    >
      <Empty
        image="/samples/banner.png"
        title="还没有项目"
        description="创建第一个项目，开始管理你的任务。"
      />
      <p class="hint">把 image 换成无效地址即可观察回退效果。</p>
    </DemoCard>

    <DemoCard
      title="尺寸变体"
      description="size 支持 sm / md / lg，统一调整插图尺寸、文字与间距。"
      wide
    >
      <div class="empty-demo__sizes">
        <Empty size="sm" title="小尺寸" description="用于紧凑列表" />
        <Empty size="md" title="中尺寸" description="默认尺寸" />
        <Empty size="lg" title="大尺寸" description="用于整页占位" />
      </div>
    </DemoCard>

    <DemoCard title="自定义操作" description="默认插槽用于放置创建、刷新等操作按钮。">
      <Empty title="暂无收藏" description="收藏的内容会显示在这里。">
        <button
          type="button"
          class="button button--primary button--small"
          @click="handleAction('去逛逛')"
        >
          去逛逛
        </button>
        <button
          type="button"
          class="button button--ghost button--small"
          @click="handleAction('刷新')"
        >
          刷新
        </button>
      </Empty>
      <p v-if="message" class="hint" role="status">{{ message }}</p>
    </DemoCard>
  </div>
</template>

<style scoped>
.empty-demo__sizes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.empty-demo__sizes > * {
  border: 1px dashed var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
}

@media (max-width: 900px) {
  .empty-demo__sizes {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
