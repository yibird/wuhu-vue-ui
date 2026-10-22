<script setup lang="ts">
import { ref } from 'vue'
import { LazyContainer } from '@wuhu-ui/lazy-container'
import DemoCard from '../components/demo-card.vue'

const lazyRoot = ref<HTMLElement>()
const lazyVisible = ref(false)
const lazyEvents = ref<string[]>([])
const launched = ref(0)

function pushLazyEvent(message: string) {
  lazyEvents.value = [message, ...lazyEvents.value].slice(0, 4)
}

function handleLazyEnter() {
  lazyVisible.value = true
  pushLazyEvent('enter · 内容进入视口')
}

function handleLazyLeave() {
  lazyVisible.value = false
  pushLazyEvent('leave · 内容离开视口')
}

function scrollLazy() {
  lazyRoot.value?.scrollTo({
    top: lazyRoot.value.scrollHeight,
    behavior: 'smooth',
  })
}

function relaunchOnce() {
  launched.value += 1
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="进入 / 离开视口"
      description="在自定义滚动容器内观察，内容可见后才挂载，离场时仍会收到事件。"
      wide
    >
      <div class="lazy-head">
        <span class="status-pill" :class="{ 'is-active': lazyVisible }">
          {{ lazyVisible ? '内容可见' : '等待进入视口' }}
        </span>
        <button type="button" class="button button--ghost button--small" @click="scrollLazy">
          滚动到哨兵
        </button>
      </div>

      <div ref="lazyRoot" class="lazy-viewport" tabindex="0">
        <div class="lazy-spacer">
          <strong>向下滚动</strong>
          <span>内容会在进入根容器视口时挂载</span>
        </div>
        <LazyContainer
          :root="lazyRoot ?? null"
          root-margin="32px"
          @enter="handleLazyEnter"
          @leave="handleLazyLeave"
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
        <span v-if="lazyEvents.length === 0" class="hint">事件将显示在这里</span>
        <span v-for="event in lazyEvents" :key="event" class="event-chip">{{ event }}</span>
      </div>
    </DemoCard>

    <DemoCard title="once 模式" description="只触发一次进入事件，适合埋点或一次性动画。">
      <LazyContainer :key="launched" once class="lazy-once">
        <template #default="{ hasEntered }">
          <div class="lazy-content">
            <span class="lazy-content__badge">{{ hasEntered ? 'Entered' : 'Visible' }}</span>
            <strong>只观察第一次进入</strong>
            <span>重新挂载组件即可再次体验。</span>
          </div>
        </template>
        <template #placeholder>
          <div class="lazy-placeholder">等待首次进入…</div>
        </template>
      </LazyContainer>
      <button type="button" class="button button--ghost button--small" @click="relaunchOnce">
        重新挂载
      </button>
    </DemoCard>
  </div>
</template>
