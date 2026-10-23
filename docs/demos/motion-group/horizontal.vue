<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'antdv-next'
import { MotionGroup } from '@wuhu-vue-ui/motion-group'

interface Step {
  id: number
  label: string
}

const steps = ref<Step[]>([
  { id: 1, label: '收集需求' },
  { id: 2, label: '方案设计' },
  { id: 3, label: '开发实现' },
  { id: 4, label: '测试验收' },
  { id: 5, label: '上线发布' },
])

function shuffle() {
  const next = [...steps.value]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    const current = next[index]!
    next[index] = next[target]!
    next[target] = current
  }
  steps.value = next
}
</script>

<template>
  <div class="sortable-demo">
    <div class="sortable-demo__controls">
      <span class="hint">direction="horizontal" · animation="slide"</span>
      <Button @click="shuffle">打乱顺序</Button>
    </div>

    <MotionGroup
      animation="slide"
      direction="horizontal"
      :duration="280"
      :move-duration="320"
      tag="div"
      class="sortable-horizontal"
    >
      <div v-for="(step, index) in steps" :key="step.id" class="sortable-chip">
        <span class="sortable-chip__index">{{ index + 1 }}</span>
        {{ step.label }}
      </div>
    </MotionGroup>
  </div>
</template>

<style lang="less">
.sortable-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.sortable-filter-list {
  display: flex;
  flex-direction: column;
  gap: 7px;

  .status-card {
    margin: 0;
  }
}
/* Sortable transition demo variants */
.sortable-horizontal {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
  overflow-x: auto;
}

.sortable-chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--w-color-border);
  border-radius: 9999px;
  background: var(--w-color-surface);
  box-shadow: var(--w-shadow-sm);
  color: var(--w-color-text);
  font-size: 12px;
  white-space: nowrap;

  &__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--w-color-primary-soft);
    color: var(--w-color-primary);
    font-family: var(--w-font-family-mono);
    font-size: 10px;
    font-weight: 600;
  }
}

.sortable-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sortable-tag {
  margin-inline-end: 0;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 12px;
}

.sortable-timing {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  align-items: start;
  gap: 16px;
}

.sortable-timing__controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--w-color-border);
  border-radius: 12px;
  background: var(--w-color-surface-subtle);

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--w-color-text-secondary);
    font-size: 11px;
  }

  .sortable-timing__switch {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }
}
/* Sortable transition demo */
.sortable-demo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sortable-demo__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.sortable-demo__actions,
.demo-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.demo-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.sortable-demo__list {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-card, 12px);
  background: var(--w-color-surface);
  box-shadow: var(--w-shadow-sm);
  transition:
    border-color var(--w-duration-normal, 220ms) var(--w-easing-standard, ease),
    background-color var(--w-duration-normal, 220ms) var(--w-easing-standard, ease),
    box-shadow var(--w-duration-normal, 220ms) var(--w-easing-standard, ease);

  &__dot {
    width: 9px;
    height: 9px;
    flex: none;
    border-radius: 9999px;
    background: var(--w-color-text-tertiary);
    box-shadow: 0 0 0 4px var(--w-color-surface-subtle);
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    margin-right: auto;

    strong {
      overflow: hidden;
      font-size: 13px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--w-color-text-tertiary);
      font-size: 11px;
    }
  }

  &--doing {
    border-color: var(--w-color-info-soft);
    background: var(--w-color-info-soft);

    .status-card__dot {
      background: var(--w-color-info);
    }
  }

  &--todo {
    .status-card__dot {
      background: var(--w-color-warning);
    }
  }

  &--done {
    opacity: 0.78;

    .status-card__dot {
      background: var(--w-color-success);
    }
  }
}

@media (max-width: 900px) {
  .cropper-demo {
    grid-template-columns: minmax(0, 1fr);
  }

  .cropper-demo__side {
    flex-direction: row;
    align-items: center;
  }

  .cropper-preview {
    width: 120px;
    flex: none;
  }

  .command-demo {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
}

@media (max-width: 720px) {
  .sortable-demo__list {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .viewer-card__controls {
    align-items: stretch;
    flex-direction: column;
  }

  .viewer-card__controls-right {
    width: 100%;
  }

  .gantt-card__footer {
    align-items: flex-start;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 6px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .viewer-card,
  .gantt-task-panel,
  .status-card {
    transition: none;
  }
}
@media (max-width: 900px) {
  .sortable-timing {
    grid-template-columns: minmax(0, 1fr);
  }
}
.sortable-demo__actions .ant-btn,
.sortable-filters .ant-btn {
  height: 28px;
  padding-inline: 10px;
  font-size: 12px;
}
</style>
