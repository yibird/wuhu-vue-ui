<script setup lang="ts">
import { computed, ref } from 'vue'
import { Checkbox, Input } from 'antdv-next'
import { Highlight } from '@wuhu-ui/highlight'

const query = ref('组件 Vue')
const keywords = computed(() => query.value.trim().split(/\s+/).filter(Boolean))
const wholeWord = ref(false)
const caseSensitive = ref(false)

const text =
  'Wuhu Vue UI 是一套面向复杂业务的 Vue 3 组件库。每个组件独立发布、按需引入，使用 TypeScript、Less 与设计令牌构建。Highlight 组件可以安全地高亮搜索结果中的关键词，支持多关键词与整词匹配。'
</script>

<template>
  <Input
    v-model:value="query"
    allow-clear
    placeholder="输入关键词，例如：组件 Vue"
    aria-label="高亮关键词"
  />

  <div class="highlight-options">
    <Checkbox v-model:checked="wholeWord">整词匹配</Checkbox>
    <Checkbox v-model:checked="caseSensitive">区分大小写</Checkbox>
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
</template>

<style lang="less">
.highlight-options {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  color: var(--w-color-text-secondary);
  font-size: var(--w-font-size-xs);

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .hint {
    margin: 0 0 0 auto;
  }
}
.highlight-copy {
  margin: 14px 0 0;
  color: var(--w-color-text-secondary);
  font-size: 13px;
  line-height: 1.95;
}
@media (max-width: 760px) {
  .highlight-options .hint {
    margin-left: 0;
  }
}
</style>
