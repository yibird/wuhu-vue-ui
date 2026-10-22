<script setup lang="ts">
import { componentCategories, componentMetas } from '../../../playground/src/docs/component-meta'

const groups = componentCategories.map((category) => ({
  ...category,
  items: componentMetas.filter((meta) => meta.category === category.id),
}))
</script>

<template>
  <div class="home-catalog">
    <div v-for="group in groups" :key="group.id" class="home-catalog__group">
      <h3>{{ group.title }}</h3>
      <p>{{ group.description }}</p>
      <div class="home-catalog__grid">
        <a
          v-for="item in group.items"
          :key="item.slug"
          class="home-catalog__card"
          :href="`/components/${item.slug}`"
        >
          <strong
            >{{ item.name }} <span>{{ item.title }}</span></strong
          >
          <p>{{ item.summary }}</p>
        </a>
      </div>
    </div>
  </div>
</template>
