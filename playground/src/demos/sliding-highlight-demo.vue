<script setup lang="ts">
import { computed, ref } from 'vue'
import { SlidingHighlight } from '@wuhu-vue-ui/sliding-highlight'
import DemoCard from '../components/demo-card.vue'

interface NavItem {
  label: string
  value: string
  badge?: number
}

const navItems: NavItem[] = [
  { label: '概览', value: 'overview' },
  { label: '组件', value: 'components', badge: 16 },
  { label: '示例', value: 'examples', badge: 32 },
  { label: '文档', value: 'docs' },
]
const active = ref('components')
const activeLabel = computed(
  () => navItems.find((item) => item.value === active.value)?.label ?? '',
)
const navRef = ref<InstanceType<typeof SlidingHighlight> | null>(null)

const cardItems = [
  { label: 'Design', desc: '设计令牌与主题' },
  { label: 'Develop', desc: 'Vue 3 组件开发' },
  { label: 'Deliver', desc: '构建与发布' },
]

const verticalItems = ['工作台', '用户管理', '系统设置', '操作日志']

function handleFocusin(event: FocusEvent) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const item = target.closest<HTMLElement>('[data-nav-item]')?.closest('li')
  const root = navRef.value?.$el
  if (!item || !(root instanceof HTMLElement) || item.parentElement !== root) return

  navRef.value?.highlight(item)
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="悬浮跟随"
      description="高亮块会跟随鼠标在直接子项之间平滑移动，支持键盘聚焦与自定义内边距。"
      wide
    >
      <div class="sliding-demo">
        <SlidingHighlight
          ref="navRef"
          as="ul"
          class="sliding-nav"
          :inset="8"
          pill-class-name="sliding-nav__pill"
          @focusin="handleFocusin"
        >
          <li v-for="item in navItems" :key="item.value">
            <button
              type="button"
              data-nav-item
              :class="{ 'is-active': active === item.value }"
              :aria-current="active === item.value ? 'page' : undefined"
              @click="active = item.value"
            >
              {{ item.label }}
              <span v-if="item.badge" class="sliding-nav__badge">{{ item.badge }}</span>
            </button>
          </li>
        </SlidingHighlight>

        <div class="sliding-demo__footer">
          <span>当前选中：{{ activeLabel }}</span>
          <span class="hint">悬浮或使用 Tab 聚焦任意选项</span>
        </div>
      </div>
    </DemoCard>

    <DemoCard title="卡片网格" description="任意直接子元素都可以成为高亮目标，不限制子项结构。">
      <SlidingHighlight class="sliding-cards" :inset="4" pill-class-name="sliding-cards__pill">
        <button v-for="item in cardItems" :key="item.label" type="button" class="sliding-card">
          <strong>{{ item.label }}</strong>
          <span>{{ item.desc }}</span>
        </button>
      </SlidingHighlight>
    </DemoCard>

    <DemoCard title="纵向列表" description="通过外部布局控制排列方向，高亮块自动适配每一项的尺寸。">
      <SlidingHighlight class="sliding-list" :inset="6" pill-class-name="sliding-list__pill">
        <button v-for="item in verticalItems" :key="item" type="button" class="sliding-list__item">
          <span class="sliding-list__dot" />
          {{ item }}
        </button>
      </SlidingHighlight>
    </DemoCard>
  </div>
</template>
