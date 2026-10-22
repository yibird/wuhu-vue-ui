<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { LazyContainer } from '@wuhu-ui/lazy-container'

const root = ref<HTMLElement>()
const visible = ref(false)
const events = ref<string[]>([])

function push(message: string) {
  events.value = [message, ...events.value].slice(0, 4)
}

function handleEnter() {
  visible.value = true
  push('enter · 内容进入视口')
}

function handleLeave() {
  visible.value = false
  push('leave · 内容离开视口')
}

function scrollToSentinel() {
  root.value?.scrollTo({ top: root.value.scrollHeight, behavior: 'smooth' })
}
</script>

<template>
  <div class="lazy-head">
    <span class="status-pill" :class="{ 'is-active': visible }">
      {{ visible ? '内容可见' : '等待进入视口' }}
    </span>
    <Button @click="scrollToSentinel">滚动到哨兵</Button>
  </div>

  <div ref="root" class="lazy-viewport">
    <div class="lazy-spacer">
      <strong>向下滚动</strong>
      <span>内容会在进入根容器视口时挂载</span>
    </div>
    <LazyContainer
      :root="root ?? null"
      root-margin="32px"
      @enter="handleEnter"
      @leave="handleLeave"
    >
      <div class="lazy-content">
        <span class="lazy-content__badge">Mounted</span>
        <strong>懒加载内容已渲染</strong>
        <span>IntersectionObserver 正在持续监听进入与离开事件。</span>
      </div>
      <template #placeholder>
        <div class="lazy-placeholder">占位中 · 等待进入可视区域</div>
      </template>
    </LazyContainer>
  </div>

  <div class="event-log">
    <span v-if="events.length === 0" class="hint">事件将显示在这里</span>
    <span v-for="event in events" :key="event" class="event-chip">{{ event }}</span>
  </div>
</template>

<style lang="less">
.lazy-once {
  display: block;
  margin-bottom: 10px;
  border: 1px dashed var(--w-color-border);
  border-radius: var(--w-radius-md);
}
.lazy-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 9px;
  border-radius: 9999px;
  background: var(--w-color-surface-subtle);
  color: var(--w-color-text-tertiary);
  font-size: 10px;
  font-weight: 500;

  &::before {
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: var(--w-color-text-tertiary);
    content: '';
  }

  &.is-active {
    background: var(--w-color-success-soft);
    color: var(--w-color-success);

    &::before {
      background: var(--w-color-success);
      box-shadow: 0 0 0 3px var(--w-color-success-soft);
    }
  }
}

.lazy-viewport {
  height: 190px;
  overflow-y: auto;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  background:
    linear-gradient(180deg, transparent, var(--w-color-surface-subtle)), var(--w-color-surface);
  scrollbar-width: thin;
  scrollbar-color: var(--w-scrollbar-thumb) transparent;
}

.lazy-spacer {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  height: 330px;
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

.lazy-placeholder {
  margin: 10px;
  padding: 16px;
  border: 1px dashed var(--w-color-border);
  border-radius: 11px;
  color: var(--w-color-text-tertiary);
  font-size: 10px;
  text-align: center;
}
</style>
