<script setup lang="ts">
import { ref } from 'vue'
import { Scrollbar } from '@wuhu-ui/scrollbar'
import type { ScrollbarScrollEvent } from '@wuhu-ui/scrollbar'
import DemoCard from '../components/demo-card.vue'

const items = [
  { title: 'Scrollbar', desc: '复刻原生滚动体验，同时完全自定义滚动条样式。' },
  { title: 'Lazy Container', desc: '基于 IntersectionObserver 的懒加载容器。' },
  { title: 'Resize Container', desc: '基于 ResizeObserver 的尺寸监听。' },
  { title: 'Error Boundary', desc: '捕获子组件渲染错误，支持失败回退与重试。' },
  { title: 'Number Ticker', desc: '逐位滚动的数字动画，适合数据大屏与指标卡。' },
  { title: 'Time', desc: '自动刷新的相对时间，支持 Intl 与自定义格式化。' },
  { title: 'Copy', desc: '安全降级的剪贴板能力，成功与失败状态可感知。' },
]

const stripItems = [
  { title: 'Design', tag: 'Figma', color: '#4f46e5' },
  { title: 'Build', tag: 'Vue', color: '#059669' },
  { title: 'Review', tag: 'PR', color: '#d97706' },
  { title: 'Release', tag: 'CI', color: '#0284c7' },
  { title: 'Monitor', tag: 'Ops', color: '#db2777' },
  { title: 'Iterate', tag: 'Next', color: '#7c3aed' },
  { title: 'Analyze', tag: 'Data', color: '#0d9488' },
  { title: 'Archive', tag: 'S3', color: '#2563eb' },
  { title: 'Automate', tag: 'Bot', color: '#ca8a04' },
  { title: 'Scale', tag: 'K8s', color: '#e11d48' },
  { title: 'Document', tag: 'Docs', color: '#7c3aed' },
  { title: 'Educate', tag: 'Academy', color: '#0891b2' },
]

const scrollbarRef = ref<InstanceType<typeof Scrollbar> | null>(null)
const scrollOffset = ref(0)
const scrollTargets = [0, 300, 600, 900]

function scrollTo(left: number) {
  scrollbarRef.value?.scrollTo({ left, behavior: 'smooth' })
}

function handleScroll(event: ScrollbarScrollEvent) {
  scrollOffset.value = Math.round(event.scrollLeft)
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard title="纵向滚动" description="内容超出视口时显示自定义滚动条，支持拖拽与点击轨道。">
      <Scrollbar height="220px" class="demo-scrollbar">
        <div class="scroll-list">
          <div v-for="(item, index) in items" :key="item.title" class="scroll-list__item">
            <span class="scroll-list__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </Scrollbar>
    </DemoCard>

    <DemoCard
      title="原生滚动"
      description="通过 native 切换为浏览器原生滚动条，行为与系统保持一致。"
    >
      <Scrollbar native height="220px" class="demo-scrollbar">
        <div class="scroll-list">
          <div v-for="(item, index) in items" :key="item.title" class="scroll-list__item">
            <span class="scroll-list__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </Scrollbar>
    </DemoCard>

    <DemoCard
      title="横向滚动"
      description="内容宽度超出容器时自动出现横向滚动条，适合标签、流程与看板。"
      wide
    >
      <Scrollbar height="148px" always class="demo-scrollbar">
        <div class="scroll-strip">
          <article
            v-for="item in stripItems"
            :key="item.title"
            class="scroll-strip__card"
            :style="{ '--strip-color': item.color }"
          >
            <span class="scroll-strip__tag">{{ item.tag }}</span>
            <strong>{{ item.title }}</strong>
            <span class="scroll-strip__line" />
          </article>
        </div>
      </Scrollbar>
    </DemoCard>

    <DemoCard
      title="滚动到指定位置"
      description="调用 scrollTo() 平滑滚动到指定距离，并通过 scroll 事件实时读取当前偏移。"
      wide
    >
      <div class="scroll-to-demo">
        <div class="scroll-to-demo__actions">
          <button
            v-for="target in scrollTargets"
            :key="target"
            type="button"
            class="button button--small"
            @click="scrollTo(target)"
          >
            {{ target === 0 ? '回到起点' : `滚动到 ${target}px` }}
          </button>
          <span class="scroll-to-demo__meta">当前偏移：{{ scrollOffset }}px</span>
        </div>

        <Scrollbar
          ref="scrollbarRef"
          height="148px"
          always
          class="demo-scrollbar"
          @scroll="handleScroll"
        >
          <div class="scroll-strip">
            <article
              v-for="item in stripItems"
              :key="item.title"
              class="scroll-strip__card"
              :style="{ '--strip-color': item.color }"
            >
              <span class="scroll-strip__tag">{{ item.tag }}</span>
              <strong>{{ item.title }}</strong>
              <span class="scroll-strip__line" />
            </article>
          </div>
        </Scrollbar>
      </div>
    </DemoCard>

    <DemoCard
      title="自定义样式"
      description="通过 --w-scrollbar-* 变量与滑块类名定制粗细、颜色和轨道背景。"
    >
      <Scrollbar height="220px" always class="demo-scrollbar scrollbar-custom">
        <div class="scroll-list">
          <div v-for="(item, index) in items" :key="item.title" class="scroll-list__item">
            <span class="scroll-list__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </Scrollbar>
    </DemoCard>
  </div>
</template>
