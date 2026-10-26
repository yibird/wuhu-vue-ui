<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { LazyContainer } from '@wuhu-vue-ui/lazy-container'

const root = ref<HTMLElement>()
const version = ref(0)

function scrollToPlaceholder() {
  root.value?.scrollTo({ top: root.value.scrollHeight, behavior: 'smooth' })
}

function reset() {
  version.value += 1
  root.value?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="lazy-placeholder-demo__actions">
    <Button @click="scrollToPlaceholder">滚动到占位区</Button>
    <Button @click="reset">重新挂载</Button>
    <span class="lazy-placeholder-demo__hint">扫描下方区域查看占位状态</span>
  </div>

  <div ref="root" class="lazy-placeholder-demo__viewport">
    <div class="lazy-placeholder-demo__spacer">
      <strong>向下滚动</strong>
      <span>内容首次进入视口前，placeholder 插槽会持续渲染</span>
    </div>

    <LazyContainer :key="version" :root="root ?? null" root-margin="24px">
      <div class="lazy-content">
        <span class="lazy-content__badge">Mounted</span>
        <strong>懒加载内容已渲染</strong>
        <span>进入视口后默认插槽替换 placeholder，且不会再次退回占位。</span>
      </div>
      <template #placeholder="{ isVisible, hasEntered }">
        <div class="lazy-placeholder-demo__custom" aria-live="polite">
          <span class="lazy-placeholder-demo__badge">placeholder</span>
          <strong>自定义占位内容</strong>
          <span>isVisible: {{ isVisible }} · hasEntered: {{ hasEntered }}</span>
        </div>
      </template>
    </LazyContainer>
  </div>

  <p class="lazy-placeholder-demo__note">
    未提供 <code>placeholder</code> 插槽时，组件会渲染一个空的
    <code>.w-lazy-container__placeholder</code> 占位元素。
  </p>
</template>

<style lang="less">
.lazy-placeholder-demo {
  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__hint {
    color: var(--w-color-text-tertiary);
    font-size: 10px;
  }

  &__viewport {
    height: 200px;
    overflow-y: auto;
    border: 1px solid var(--w-color-border);
    border-radius: 12px;
    background:
      linear-gradient(180deg, transparent, var(--w-color-surface-subtle)), var(--w-color-surface);
    scrollbar-width: thin;
    scrollbar-color: var(--w-scrollbar-thumb) transparent;
  }

  &__spacer {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    height: 320px;
    border-bottom: 1px dashed var(--w-color-border);
    color: var(--w-color-text-tertiary);

    strong {
      color: var(--w-color-text-secondary);
      font-size: 12px;
      font-weight: 600;
    }

    span {
      font-size: 10px;
    }
  }

  &__custom {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin: 10px;
    padding: 16px;
    border: 1px dashed var(--w-color-primary);
    border-radius: 11px;
    background: var(--w-color-primary-soft);
    color: var(--w-color-text-secondary);

    strong {
      color: var(--w-color-text);
      font-size: 12px;
      font-weight: 600;
    }

    span:last-child {
      color: var(--w-color-text-tertiary);
      font-family: var(--w-font-family-mono);
      font-size: 10px;
    }
  }

  &__badge {
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--w-color-primary);
    color: var(--w-color-text-inverse);
    font-family: var(--w-font-family-mono);
    font-size: var(--w-font-size-3xs, 10px);
    font-weight: 700;
    text-transform: uppercase;
  }

  &__note {
    margin: 10px 0 0;
    color: var(--w-color-text-tertiary);
    font-size: 11px;

    code {
      padding: 1px 5px;
      border-radius: 4px;
      background: var(--w-color-surface-subtle);
      font-family: var(--w-font-family-mono);
      font-size: 10px;
    }
  }
}

.lazy-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 10px;
  padding: 14px;
  border: 1px solid var(--w-color-success-soft);
  border-radius: 11px;
  background: var(--w-color-success-soft);

  strong {
    color: var(--w-color-text);
    font-size: 12px;
    font-weight: 600;
  }

  > span:last-child {
    color: var(--w-color-text-secondary);
    font-size: 10px;
  }

  &__badge {
    width: fit-content;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--w-color-success);
    color: var(--w-color-text-inverse);
    font-family: var(--w-font-family-mono);
    font-size: var(--w-font-size-3xs, 10px);
    font-weight: 700;
    text-transform: uppercase;
  }
}
</style>
