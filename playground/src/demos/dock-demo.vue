<script setup lang="ts">
import { h, ref } from 'vue'
import type { Component } from 'vue'
import { Dock } from '@wuhu-vue-ui/dock'
import type { DockItem, DockPosition } from '@wuhu-vue-ui/dock'
import DemoCard from '../components/demo-card.vue'

const FinderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%234f46e5'/%3E%3Cpath d='M14 33V15h20v18' stroke='white' stroke-width='2.5' fill='none' stroke-linejoin='round'/%3E%3Cpath d='M14 26h20' stroke='white' stroke-width='2.5'/%3E%3C/svg%3E"

const BrowserIcon: Component = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none' }, [
    h('circle', {
      cx: 12,
      cy: 12,
      r: 9,
      stroke: 'currentColor',
      'stroke-width': 1.8,
    }),
    h('path', {
      d: 'M3 12h18M12 3c2.5 2.4 3.8 5.4 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.4-3.8-9S9.5 5.4 12 3Z',
      stroke: 'currentColor',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
    }),
  ])

const SettingsIcon: Component = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none' }, [
    h('circle', {
      cx: 12,
      cy: 12,
      r: 3,
      stroke: 'currentColor',
      'stroke-width': 1.8,
    }),
    h('path', {
      d: 'M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6',
      stroke: 'currentColor',
      'stroke-width': 1.8,
      'stroke-linecap': 'round',
    }),
  ])

const customModel: DockItem[] = [
  { label: '工作台', icon: FinderImage },
  { label: '浏览器', icon: BrowserIcon },
  { label: '设置', icon: SettingsIcon },
]

const model: DockItem[] = [
  { label: '访达', icon: FinderImage },
  { label: '浏览器', icon: BrowserIcon },
  { label: '文档' },
  { label: '下载', icon: SettingsIcon, disabled: true },
  { label: '分隔线', separator: true },
  { label: '设置', icon: SettingsIcon },
]

const positions: { label: string; value: DockPosition }[] = [
  { label: '底部', value: 'bottom' },
  { label: '顶部', value: 'top' },
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' },
]

const position = ref<DockPosition>('bottom')
const lastAction = ref('尚未点击任何项目')

function handleSelect(item: DockItem) {
  lastAction.value = `已选择「${item.label}」`
}

function isImageIcon(item: DockItem): boolean {
  return typeof item.icon === 'string'
}

function iconSource(item: DockItem): string | undefined {
  return typeof item.icon === 'string' ? item.icon : undefined
}

function iconComponent(item: DockItem): Component | undefined {
  return typeof item.icon === 'string' ? undefined : item.icon
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="位置与悬浮放大"
      description="切换停靠位置，指针靠近图标时按距离平滑放大；禁用项会被跳过。"
      wide
    >
      <div class="dock-demo">
        <div class="dock-demo__toolbar" role="group" aria-label="Dock 位置">
          <button
            v-for="option in positions"
            :key="option.value"
            type="button"
            class="dock-demo__position"
            :class="{ 'is-active': position === option.value }"
            @click="position = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="dock-demo__stage">
          <Dock :model="model" :position="position" aria-label="应用导航" @select="handleSelect">
            <template #icon="{ item }">
              <img
                v-if="isImageIcon(item)"
                class="dock-demo__icon"
                :src="iconSource(item)"
                alt=""
                draggable="false"
              />
              <component
                :is="iconComponent(item)"
                v-else-if="iconComponent(item)"
                class="w-dock__svg"
              />
              <span v-else class="w-dock__fallback" aria-hidden="true">{{ item.label[0] }}</span>
            </template>

            <template #tooltip="{ item }">
              <span class="w-dock__tooltip dock-demo__tip">{{ item.label }}</span>
            </template>
          </Dock>
        </div>

        <p class="dock-demo__feedback" aria-live="polite">{{ lastAction }}</p>
      </div>
    </DemoCard>

    <DemoCard
      title="自定义 item 插槽"
      description="通过 item 插槽完全接管项目内容，并获取 active 状态。"
    >
      <div class="dock-demo__stage">
        <Dock :model="customModel" aria-label="自定义导航" @select="handleSelect">
          <template #item="{ item, active }">
            <span class="dock-demo__tile" :class="{ 'is-active': active }">
              <img
                v-if="isImageIcon(item)"
                class="dock-demo__icon"
                :src="iconSource(item)"
                alt=""
                draggable="false"
              />
              <component
                :is="iconComponent(item)"
                v-else-if="iconComponent(item)"
                class="w-dock__svg"
              />
              <strong>{{ item.label }}</strong>
            </span>
          </template>
        </Dock>
      </div>
    </DemoCard>
  </div>
</template>

<style scoped>
.dock-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dock-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dock-demo__position {
  padding: 6px 14px;
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-full, 9999px);
  background: var(--w-color-surface, #ffffff);
  color: var(--w-color-text-secondary, #475569);
  font: inherit;
  font-size: var(--w-font-size-sm, 13px);
  cursor: pointer;
  transition:
    background-color var(--w-duration-fast, 120ms) ease,
    border-color var(--w-duration-fast, 120ms) ease,
    color var(--w-duration-fast, 120ms) ease;
}

.dock-demo__position:hover {
  background: var(--w-color-surface-hover, #f1f5f9);
  color: var(--w-color-text, #0f172a);
}

.dock-demo__position.is-active {
  border-color: var(--w-color-primary, #4f46e5);
  background: var(--w-color-primary-soft, rgba(79, 70, 229, 0.1));
  color: var(--w-color-primary, #4f46e5);
}

.dock-demo__position:focus-visible {
  outline: 2px solid var(--w-color-primary, #4f46e5);
  outline-offset: 2px;
}

.dock-demo__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 56px 16px 32px;
  border-radius: var(--w-radius-lg, 12px);
  background: var(--w-color-surface-subtle, #f1f5f9);
}

.dock-demo__feedback {
  margin: 0;
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-sm, 13px);
}

.dock-demo__icon {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.dock-demo__tip {
  color: var(--w-color-primary, #4f46e5);
}

.dock-demo__tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  height: 100%;
  padding: 2px;
  border-radius: var(--w-radius-lg, 12px);
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-3xs, 10px);
  white-space: nowrap;
}

.dock-demo__tile .dock-demo__icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
}

.dock-demo__tile svg {
  width: 18px;
  height: 18px;
}

.dock-demo__tile.is-active {
  color: var(--w-color-primary, #4f46e5);
}
</style>
