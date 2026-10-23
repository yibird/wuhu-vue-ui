<script setup lang="ts">
import { Scrollbar } from '@wuhu-vue-ui/scrollbar'

const items = [
  { title: 'Always', desc: '滚动条始终显示，不依赖鼠标悬浮。' },
  { title: 'Scrollbar', desc: '通过 always 属性开启常显模式。' },
  { title: 'Accessible', desc: '仍然保留拖拽与键盘滚动能力。' },
  { title: 'Consistent', desc: '适合需要持续提示可滚动区域的场景。' },
  { title: 'Customizable', desc: '颜色与尺寸通过 CSS 变量覆盖。' },
  { title: 'Lightweight', desc: '没有额外运行时依赖。' },
]
</script>

<template>
  <Scrollbar height="180px" always class="demo-scrollbar">
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
