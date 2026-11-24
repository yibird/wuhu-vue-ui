<script setup lang="ts">
import { ref } from 'vue'
import { TiptapEditor } from '@wuhu-vue-ui/tiptap-editor'
import DemoCard from '../components/demo-card.vue'

const content = ref(`
  <h2>发布计划</h2>
  <p>这是一个基于 <strong>Tiptap</strong> 的富文本编辑器，内置常用格式、链接与对齐能力。</p>
  <ul>
    <li>支持 <em>斜体</em>、<u>下划线</u>、<s>删除线</s>、<code>行内代码</code>、<mark>高亮</mark>、<span style="font-family: Georgia, serif">字体</span> 与文字颜色</li>
    <li>支持标题、列表、任务列表、引用、代码块、表格与 <a href="https://tiptap.dev">链接</a></li>
    <li>支持图片上传 / 拖拽 / 粘贴、撤销重做、全屏与清除格式</li>
  </ul>
  <blockquote>所有内容通过 v-model:value 以 HTML 形式同步。</blockquote>
`)

const readonlyContent = ref(
  '<p>只读模式保留完整排版，但隐藏工具栏并禁止编辑。</p><p>禁用模式同时降低整体不透明度。</p>',
)

const emptyContent = ref('')
</script>

<template>
  <div class="tiptap-demo">
    <DemoCard
      title="开箱即用"
      description="内置格式、标题、列表、任务列表、表格、图片、字体、颜色、高亮、链接、对齐、全屏与字数统计，通过 v-model:value 同步 HTML。"
      wide
    >
      <TiptapEditor v-model:value="content" placeholder="请输入内容…" />
      <details class="tiptap-demo__html">
        <summary>查看 HTML 输出</summary>
        <pre>{{ content }}</pre>
      </details>
    </DemoCard>

    <DemoCard title="空白与占位" description="空文档时显示 placeholder，可直接开始输入。" wide>
      <TiptapEditor
        v-model:value="emptyContent"
        placeholder="开始输入内容，试试工具栏的加粗与标题…"
      />
    </DemoCard>

    <DemoCard title="只读与禁用" description="通过 editable / disabled 控制交互状态。" wide>
      <div class="tiptap-demo__states">
        <div>
          <span class="tiptap-demo__label">editable=false</span>
          <TiptapEditor :value="readonlyContent" :editable="false" />
        </div>
        <div>
          <span class="tiptap-demo__label">disabled</span>
          <TiptapEditor :value="readonlyContent" disabled />
        </div>
      </div>
    </DemoCard>
  </div>
</template>

<style scoped>
.tiptap-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tiptap-demo__html {
  margin-top: 12px;
  color: var(--w-color-text-secondary, #475569);
  font-size: var(--w-font-size-xs, 12px);
}

.tiptap-demo__html summary {
  cursor: pointer;
}

.tiptap-demo__html pre {
  padding: 10px 12px;
  overflow-x: auto;
  color: var(--w-color-text, #0f172a);
  font-family: var(--w-font-family-mono, monospace);
  font-size: 11px;
  background: var(--w-color-surface-subtle, #f8fafc);
  border: 1px solid var(--w-color-border, #e2e8f0);
  border-radius: var(--w-radius-md, 8px);
}

.tiptap-demo__states {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.tiptap-demo__label {
  display: block;
  margin-bottom: 6px;
  color: var(--w-color-text-tertiary, #5b6678);
  font-family: var(--w-font-family-mono, monospace);
  font-size: 11px;
}
</style>
