<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { Scrollbar } from '@wuhu-vue-ui/scrollbar'
import type { ScrollbarScrollEvent } from '@wuhu-vue-ui/scrollbar'

const scrollbarRef = ref<InstanceType<typeof Scrollbar> | null>(null)
const position = ref({ top: 0, left: 0 })

const tags = ['基础', '交互', '数据', '视觉']
const items = Array.from({ length: 32 }, (_, index) => ({
  title: `模块 ${String(index + 1).padStart(2, '0')}`,
  tag: tags[index % tags.length],
}))

function handleScroll(event: ScrollbarScrollEvent) {
  position.value = {
    top: Math.round(event.scrollTop),
    left: Math.round(event.scrollLeft),
  }
}

function scrollToStart() {
  scrollbarRef.value?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
}

function scrollToPosition() {
  scrollbarRef.value?.scrollTo(360, 240)
}

function jumpVertical() {
  scrollbarRef.value?.setScrollTop(180)
}

function jumpHorizontal() {
  scrollbarRef.value?.setScrollLeft(320)
}

function moveRight() {
  scrollbarRef.value?.scrollTo({ left: position.value.left + 20, behavior: 'smooth' })
}

function moveDown() {
  scrollbarRef.value?.scrollTo({ top: position.value.top + 20, behavior: 'smooth' })
}
</script>

<template>
  <div class="scroll-methods-demo">
    <div class="scroll-methods-demo__actions">
      <Button @click="scrollToStart">scrollTo 平滑回到起点</Button>
      <Button @click="scrollToPosition">scrollTo(360, 240)</Button>
      <Button @click="jumpVertical">setScrollTop(180)</Button>
      <Button @click="jumpHorizontal">setScrollLeft(320)</Button>
      <Button @click="moveRight">向右移动20px</Button>
      <Button @click="moveDown">向下移动20px</Button>
      <span class="scroll-methods-demo__meta">
        top {{ position.top }}px · left {{ position.left }}px
      </span>
    </div>

    <Scrollbar
      ref="scrollbarRef"
      height="260px"
      always
      class="demo-scrollbar"
      @scroll="handleScroll"
    >
      <div class="scroll-methods-demo__grid">
        <article v-for="item in items" :key="item.title" class="scroll-methods-demo__card">
          <span class="scroll-methods-demo__tag">{{ item.tag }}</span>
          <strong>{{ item.title }}</strong>
          <span class="scroll-methods-demo__line" />
        </article>
      </div>
    </Scrollbar>
  </div>
</template>

<style lang="less">
.scroll-methods-demo {
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;
  }

  &__meta {
    margin-left: auto;
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs);
    font-variant-numeric: tabular-nums;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(8, 170px);
    gap: 12px;
    width: max-content;
    padding: 12px;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    background: var(--w-color-surface);
    border: 1px solid var(--w-color-border-subtle);
    border-radius: 10px;
    box-shadow: var(--w-shadow-sm);
  }

  &__tag {
    width: fit-content;
    padding: 2px 7px;
    color: var(--w-color-primary);
    font-size: 10px;
    background: var(--w-color-primary-soft);
    border-radius: var(--w-radius-full);
  }

  &__line {
    height: 28px;
    background: var(--w-color-surface-subtle);
    border-radius: 6px;
  }

  strong {
    color: var(--w-color-text);
    font-size: 12.5px;
    font-weight: 600;
  }
}
</style>
