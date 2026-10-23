<script setup lang="ts">
import { computed, ref } from 'vue'
import { Highlight } from '@wuhu-vue-ui/highlight'
import DemoCard from '../components/demo-card.vue'

const query = ref('组件 Vue')
const keywords = computed(() => query.value.trim().split(/\s+/).filter(Boolean))
const wholeWord = ref(false)
const caseSensitive = ref(false)

const text =
  'Wuhu Vue UI 是一套面向复杂业务的 Vue 3 组件库。每个组件独立发布、按需引入，使用 TypeScript、Less 与设计令牌构建。Highlight 组件可以安全地高亮搜索结果中的关键词，支持多关键词与整词匹配。'

const customStyle = {
  padding: '0 3px',
  borderRadius: '4px',
  background: 'var(--w-color-warning-soft)',
  color: '#92400e',
}
</script>

<template>
  <div class="demo-grid">
    <DemoCard
      title="实时关键词高亮"
      description="输入多个关键词（空格分隔），所有匹配片段都会被安全地包裹为 mark。"
      wide
    >
      <input
        v-model="query"
        class="field"
        type="search"
        placeholder="输入关键词，例如：组件 Vue"
        aria-label="高亮关键词"
      />

      <div class="highlight-options">
        <label>
          <input v-model="wholeWord" type="checkbox" />
          整词匹配
        </label>
        <label>
          <input v-model="caseSensitive" type="checkbox" />
          区分大小写
        </label>
        <span class="hint">当前关键词：{{ keywords.join(' / ') || '（空）' }}</span>
      </div>

      <p class="highlight-copy">
        <Highlight
          :text="text"
          :keywords="keywords"
          :whole-word="wholeWord"
          :case-sensitive="caseSensitive"
        />
      </p>
    </DemoCard>

    <DemoCard
      title="自定义高亮样式"
      description="通过 highlightClass 或 highlightStyle 接入自己的设计语言。"
    >
      <p class="highlight-copy">
        <Highlight
          text="TypeScript 提供完整类型，Less 与设计令牌负责主题，Vue 3 负责响应式视图。"
          :keywords="['TypeScript', 'Less', 'Vue 3']"
          :highlight-style="customStyle"
        />
      </p>
    </DemoCard>

    <DemoCard title="自定义标签" description="tag 可替换默认的 mark 元素，例如 span 或 strong。">
      <p class="highlight-copy">
        <Highlight
          text="可访问性、键盘导航与 ARIA 属性都由组件负责。"
          :keywords="['可访问性', '键盘导航', 'ARIA']"
          tag="strong"
        />
      </p>
    </DemoCard>
  </div>
</template>
