<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from 'antdv-next'
import { SlidingHighlight } from '@wuhu-ui/sliding-highlight'

const items = [
  { label: '概览', value: 'overview' },
  { label: '组件', value: 'components', badge: 16 },
  { label: '示例', value: 'examples', badge: 32 },
  { label: '文档', value: 'docs' },
]
const active = ref('components')
const activeLabel = computed(() => items.find((item) => item.value === active.value)?.label ?? '')
const nav = ref<InstanceType<typeof SlidingHighlight> | null>(null)

function handleFocusin(event: FocusEvent) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const item = target.closest<HTMLElement>('[data-nav-item]')?.closest('li')
  const root = nav.value?.$el
  if (!item || !(root instanceof HTMLElement) || item.parentElement !== root) return

  nav.value?.highlight(item)
}
</script>

<template>
  <SlidingHighlight
    ref="nav"
    as="ul"
    class="sliding-nav"
    :inset="0"
    pill-class-name="sliding-nav__pill"
    @focusin="handleFocusin"
  >
    <li v-for="item in items" :key="item.value">
      <Button
        type="text"
        html-type="button"
        data-nav-item
        :class="{ 'is-active': active === item.value }"
        @click="active = item.value"
      >
        {{ item.label }}
        <span v-if="item.badge" class="sliding-nav__badge">{{ item.badge }}</span>
      </Button>
    </li>
  </SlidingHighlight>

  <div class="sliding-demo__footer">
    <span>当前选中：{{ activeLabel }}</span>
    <span class="hint">悬浮或使用 Tab 聚焦任意选项</span>
  </div>
</template>

<style lang="less">
.sliding-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  width: fit-content;
  max-width: 100%;
  margin: 0;
  padding: 8px;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  background: var(--w-color-surface-subtle);
  list-style: none;

  > li {
    display: flex;
  }

  /* Text buttons from antdv add a hover background that would cover the pill. */
  .ant-btn.ant-btn-variant-text {
    --ant-btn-bg-color-hover: transparent;
    --ant-btn-bg-color-active: transparent;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--w-color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: color var(--w-duration-fast) ease;

    &:hover {
      color: var(--w-color-text);
    }

    &.is-active {
      color: var(--w-color-primary);
      font-weight: 600;
    }

    &:focus-visible {
      outline: 2px solid var(--w-color-primary);
      outline-offset: 1px;
    }
  }

  &__pill {
    border-radius: 8px;
    background: var(--w-color-surface);
    box-shadow: var(--w-shadow-sm);
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9999px;
    background: var(--w-color-primary-soft);
    color: var(--w-color-primary);
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
  }
}

/* VitePress 的 `.vp-doc ul` / `li + li` 会覆盖 demo 自身间距并造成纵向错位。 */
.vp-doc .sliding-nav {
  margin: 0;
  padding: 8px;
  list-style: none;

  > li {
    margin: 0;
  }
}

.sliding-cards {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  background: var(--w-color-surface-subtle);

  &__pill {
    border: 1px solid var(--w-color-border);
    border-radius: 10px;
    background: var(--w-color-surface);
    box-shadow: var(--w-shadow-sm);
  }
}

.sliding-card {
  display: flex;
  min-height: 88px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  padding: 14px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--w-color-text-secondary);
  text-align: left;
  cursor: pointer;
  transition: color var(--w-duration-fast) ease;

  strong {
    color: var(--w-color-text);
    font-size: 13px;
  }

  span {
    font-size: 11px;
  }

  &:hover,
  &:focus-visible {
    color: var(--w-color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--w-color-primary);
    outline-offset: -2px;
  }
}

.sliding-list {
  display: flex;
  width: min(100%, 320px);
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  background: var(--w-color-surface-subtle);

  &__pill {
    border-radius: 8px;
    background: var(--w-color-surface);
    box-shadow: var(--w-shadow-sm);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--w-color-text-secondary);
    font-size: 13px;
    text-align: left;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      color: var(--w-color-text);
    }

    &:focus-visible {
      outline: 2px solid var(--w-color-primary);
      outline-offset: -1px;
    }
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: var(--w-color-primary);
  }
}
.sliding-demo {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--w-color-border-subtle);
    color: var(--w-color-text-secondary);
    font-size: 11px;
  }
}
</style>
