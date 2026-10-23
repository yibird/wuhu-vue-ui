<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { LazyContainer } from '@wuhu-vue-ui/lazy-container'

const launched = ref(0)
</script>

<template>
  <LazyContainer :key="launched" once class="lazy-once">
    <template #default="{ hasEntered }">
      <div class="lazy-content">
        <span class="lazy-content__badge">{{ hasEntered ? 'Entered' : 'Visible' }}</span>
        <strong>只观察第一次进入</strong>
        <span>重新挂载组件即可再次体验。</span>
      </div>
    </template>
    <template #placeholder>
      <div class="lazy-placeholder">等待首次进入…</div>
    </template>
  </LazyContainer>

  <Button @click="launched += 1">重新挂载</Button>
</template>

<style lang="less">
.lazy-once {
  display: block;
  margin-bottom: 10px;
  border: 1px dashed var(--w-color-border);
  border-radius: var(--w-radius-md);
}
.lazy-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 9px;
  border-radius: 9999px;
  background: var(--w-color-surface-subtle);
  color: var(--w-color-text-tertiary);
  font-size: 10px;
  font-weight: 500;

  &::before {
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: var(--w-color-text-tertiary);
    content: '';
  }

  &.is-active {
    background: var(--w-color-success-soft);
    color: var(--w-color-success);

    &::before {
      background: var(--w-color-success);
      box-shadow: 0 0 0 3px var(--w-color-success-soft);
    }
  }
}

.lazy-viewport {
  height: 190px;
  overflow-y: auto;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  background:
    linear-gradient(180deg, transparent, var(--w-color-surface-subtle)), var(--w-color-surface);
  scrollbar-width: thin;
  scrollbar-color: var(--w-scrollbar-thumb) transparent;
}

.lazy-spacer {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  height: 330px;
  border-bottom: 1px dashed var(--w-color-border);
  color: var(--w-color-text-tertiary);

  strong {
    color: var(--w-color-text-secondary);
    font-size: 12px;
    font-weight: 600;
  }

  span {
    font-size: 10px;
  }
}

.lazy-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 10px;
  padding: 14px;
  border: 1px solid var(--w-color-success-soft);
  border-radius: 11px;
  background: var(--w-color-success-soft);

  strong {
    color: var(--w-color-text);
    font-size: 12px;
    font-weight: 600;
  }

  > span:last-child {
    color: var(--w-color-text-secondary);
    font-size: 10px;
  }

  &__badge {
    width: fit-content;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--w-color-success);
    color: var(--w-color-text-inverse);
    font-family: var(--w-font-family-mono);
    font-size: var(--w-font-size-3xs, 10px);
    font-weight: 700;
    text-transform: uppercase;
  }
}

.lazy-placeholder {
  margin: 10px;
  padding: 16px;
  border: 1px dashed var(--w-color-border);
  border-radius: 11px;
  color: var(--w-color-text-tertiary);
  font-size: 10px;
  text-align: center;
}
</style>
