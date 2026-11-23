<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    /** Span both columns of the demo grid. */
    wide?: boolean
    /** Remove body padding for edge-to-edge previews. */
    flush?: boolean
  }>(),
  {
    description: undefined,
    wide: false,
    flush: false,
  },
)
</script>

<template>
  <section class="demo-card" :class="{ 'demo-card--wide': wide, 'demo-card--flush': flush }">
    <header class="demo-card__head">
      <div class="demo-card__copy">
        <h3>{{ title }}</h3>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="demo-card__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="demo-card__body">
      <slot />
    </div>
  </section>
</template>

<style lang="less" scoped>
.demo-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--w-color-border);
  border-radius: var(--w-radius-card, var(--w-radius-lg, 12px));
  background: var(--w-color-surface);
  transition: border-color var(--w-duration-fast, 120ms) var(--w-easing-standard, ease);

  &:hover {
    border-color: var(--w-color-border-hover, var(--w-color-border-strong));
  }

  &--wide {
    grid-column: 1 / -1;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 18px 20px 0;
  }

  &__copy {
    min-width: 0;

    h3 {
      margin: 0;
      font-size: var(--w-font-size-md);
      font-weight: var(--w-font-weight-semibold, 600);
      letter-spacing: var(--w-letter-spacing-tight, -0.01em);
    }

    p {
      margin: 4px 0 0;
      color: var(--w-color-text-secondary);
      font-size: var(--w-font-size-xs);
      line-height: 1.6;
    }
  }

  &__actions {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__body {
    flex: 1;
    min-width: 0;
    padding: 18px 20px 20px;
  }

  &--flush &__body {
    padding: 16px;
  }

  &--flush &__head {
    padding-bottom: 12px;
  }
}

@media (max-width: 900px) {
  .demo-card--wide {
    grid-column: auto;
  }
}
</style>
