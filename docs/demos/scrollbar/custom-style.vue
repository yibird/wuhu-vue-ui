<script setup lang="ts">
import { Scrollbar } from '@wuhu-ui/scrollbar'

const items = [
  { title: 'Scrollbar', desc: '复刻原生滚动体验，同时完全自定义滚动条样式。' },
  { title: 'Lazy Container', desc: '基于 IntersectionObserver 的懒加载容器。' },
  { title: 'Resize Container', desc: '基于 ResizeObserver 的尺寸监听。' },
  { title: 'Error Boundary', desc: '捕获子组件渲染错误，支持失败回退与重试。' },
  { title: 'Number Ticker', desc: '逐位滚动的数字动画，适合数据大屏与指标卡。' },
  { title: 'Time', desc: '自动刷新的相对时间，支持 Intl 与自定义格式化。' },
  { title: 'Copy', desc: '安全降级的剪贴板能力，成功与失败状态可感知。' },
]
</script>

<template>
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
</template>

<style lang="less">
.scroll-strip {
  --strip-color: var(--w-color-primary);

  display: flex;
  gap: 12px;
  width: max-content;
  padding: 12px;

  &__card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 184px;
    padding: 15px 16px 14px;
    border: 0;
    border-radius: 10px;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--strip-color) 7%, var(--w-color-surface)),
      var(--w-color-surface) 52%
    );
    box-shadow: var(--w-shadow-sm);
    transition: box-shadow var(--w-duration-fast) ease;

    &:hover {
      box-shadow: var(--w-shadow-md);
    }

    strong {
      color: var(--w-color-text);
      font-size: var(--w-font-size-sm);
      font-weight: 600;
      letter-spacing: -0.01em;
    }
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 2px 7px;
    border-radius: var(--w-radius-full);
    background: color-mix(in srgb, var(--strip-color) 10%, var(--w-color-surface));
    color: color-mix(in srgb, var(--strip-color) 70%, var(--w-color-text));
    font-family: var(--w-font-family-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  &__line {
    height: 34px;
    border-radius: 8px;
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--strip-color) 18%, transparent),
        transparent 78%
      ),
      var(--w-color-surface-subtle);
    opacity: 0.85;
  }
}

.scroll-to-demo {
  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__meta {
    margin-left: auto;
    color: var(--w-color-text-tertiary);
    font-size: var(--w-font-size-xs);
    font-variant-numeric: tabular-nums;
  }
}

.scrollbar-layout-demo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  &__panel {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--w-color-border-subtle);
    border-radius: 14px;
    background: var(--w-color-surface);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--w-color-border-subtle);
    background: var(--w-color-surface-subtle);
    color: var(--w-color-text-secondary);
    font-size: 11px;

    span {
      color: var(--w-color-text);
      font-size: 12px;
      font-weight: 600;
    }

    code {
      padding: 2px 6px;
      border-radius: 5px;
      background: var(--w-color-surface);
      color: var(--w-color-text-tertiary);
      font-family: var(--w-font-family-mono);
      font-size: 9px;
      white-space: nowrap;
    }
  }

  &__flex,
  &__grid {
    height: 260px;
    min-height: 0;
  }

  &__flex {
    display: flex;
    flex-direction: column;
  }

  &__grid {
    display: grid;
    grid-template-rows: auto 1fr;
  }

  &__body {
    flex: 1;
    min-height: 0;
  }

  &__grid-body {
    min-height: 0;
  }

  &__fixed {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    height: 38px;
    border-bottom: 1px solid var(--w-color-border-subtle);
    background: var(--w-color-surface-subtle);
    color: var(--w-color-text-tertiary);
    font-size: 10px;
    letter-spacing: 0.04em;

    &.is-footer {
      border-top: 1px solid var(--w-color-border-subtle);
      border-bottom: 0;
    }
  }

  .scroll-list {
    padding: 8px;
  }
}

@media (max-width: 760px) {
  .scrollbar-layout-demo {
    grid-template-columns: minmax(0, 1fr);
  }
}

.scrollbar-custom {
  --w-scrollbar-size: 10px;
  --w-scrollbar-thumb: rgba(99, 102, 241, 0.9);
  --w-scrollbar-thumb-hover: rgba(168, 85, 247, 0.95);
  --w-scrollbar-opacity: 1;
  --w-scrollbar-hover-opacity: 1;

  .w-scrollbar__bar {
    background: var(--w-color-surface-subtle);
    border-radius: var(--w-radius-full);
  }

  .w-scrollbar__thumb {
    border-radius: var(--w-radius-full);
    background: linear-gradient(90deg, var(--w-color-primary), #a855f7);
  }
}
.demo-scrollbar {
  overflow: hidden;
  border: 1px solid var(--w-color-border-subtle);
  border-radius: 14px;
  background: var(--w-color-surface);
}

.scroll-list {
  padding: 8px;

  &__item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    transition: background-color var(--w-duration-fast) ease;

    & + & {
      margin-top: 2px;
    }

    &:hover {
      background: color-mix(in srgb, var(--w-color-surface-hover) 52%, transparent);
    }

    &:hover .scroll-list__index {
      background: var(--w-color-primary-soft);
      color: var(--w-color-primary);
    }

    > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    strong {
      color: var(--w-color-text);
      font-size: 12.5px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    span:not(.scroll-list__index) {
      overflow: hidden;
      color: var(--w-color-text-tertiary);
      font-size: 11px;
      line-height: 1.5;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    background: var(--w-color-surface-subtle);
    color: var(--w-color-text-tertiary);
    font-family: var(--w-font-family-mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.02em;
    transition:
      background-color var(--w-duration-fast) ease,
      color var(--w-duration-fast) ease;
  }
}
@media (max-width: 760px) {
  .scrollbar-layout-demo {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
