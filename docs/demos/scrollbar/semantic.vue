<script setup lang="ts">
import { Scrollbar } from '@wuhu-vue-ui/scrollbar'
import type { ScrollbarClasses, ScrollbarStyles } from '@wuhu-vue-ui/scrollbar'

const items = [
  { title: '创建项目', desc: '初始化仓库与 pnpm workspace。' },
  { title: '安装依赖', desc: '安装 Vue、Less 与构建工具链。' },
  { title: '编写组件', desc: '实现 SFC、类型与样式约定。' },
  { title: '补充测试', desc: '覆盖默认渲染、交互与卸载清理。' },
  { title: '接入文档', desc: '登记元数据并复用 Demo。' },
  { title: '质量检查', desc: '执行 lint、format、typecheck 与 test。' },
  { title: '构建产物', desc: '输出 ESM、类型声明与样式文件。' },
  { title: '发布版本', desc: '打标签并推送到 npm registry。' },
]

const classes: ScrollbarClasses = {
  wrap: 'semantic-scroll-demo__wrap',
  view: 'semantic-scroll-demo__view',
  thumb: 'semantic-scroll-demo__thumb',
}

const styles: ScrollbarStyles = {
  view: { padding: '10px' },
  thumb: {
    background: 'linear-gradient(180deg, var(--w-color-primary, #4f46e5), #a855f7)',
    opacity: '1',
  },
}
</script>

<template>
  <div class="semantic-scroll-demo">
    <div class="semantic-scroll-demo__legend">
      <span>语义化键名</span>
      <code>wrap</code>
      <code>view</code>
      <code>thumb</code>
      <span class="semantic-scroll-demo__hint">thumb 同时作用于横向与纵向滑块</span>
    </div>

    <Scrollbar height="236px" always :classes="classes" :styles="styles">
      <ol class="semantic-scroll-demo__list">
        <li v-for="(item, index) in items" :key="item.title">
          <span class="semantic-scroll-demo__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <strong>{{ item.title }}</strong>
            <span>{{ item.desc }}</span>
          </div>
        </li>
      </ol>
    </Scrollbar>
  </div>
</template>

<style lang="less">
.semantic-scroll-demo {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    color: var(--w-color-text-tertiary, #64748b);
    font-size: 11px;

    code {
      padding: 2px 7px;
      border: 1px solid var(--w-color-border-subtle, #e2e8f0);
      border-radius: 9999px;
      background: var(--w-color-surface-subtle, #f8fafc);
      color: var(--w-color-primary, #4f46e5);
      font-family: var(--w-font-family-mono, monospace);
      font-size: 10px;
      font-weight: 600;
    }
  }

  &__hint {
    margin-left: auto;
    font-size: 10px;
  }

  &__wrap {
    border: 1px solid var(--w-color-border-subtle, #e2e8f0);
    border-radius: 14px;
    background: var(--w-color-surface, #ffffff);
  }

  &__view {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__thumb {
    box-shadow: 0 0 8px color-mix(in srgb, var(--w-color-primary, #4f46e5) 45%, transparent);
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;

      &:hover {
        background: var(--w-color-surface-hover, #f1f5f9);
      }

      > div {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
    }

    strong {
      color: var(--w-color-text, #0f172a);
      font-size: 12.5px;
      font-weight: 600;
    }

    span:not(.semantic-scroll-demo__index) {
      color: var(--w-color-text-tertiary, #64748b);
      font-size: 11px;
      line-height: 1.5;
    }
  }

  &__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    flex: none;
    border-radius: 7px;
    background: var(--w-color-surface-subtle, #f1f5f9);
    color: var(--w-color-text-tertiary, #64748b);
    font-family: var(--w-font-family-mono, monospace);
    font-size: 9px;
    font-weight: 600;
  }
}
</style>
