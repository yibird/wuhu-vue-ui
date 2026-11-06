<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import HomeView from './home/home-view.vue'
import {
  componentCategories,
  componentDocs,
  docsByCategory,
  type ComponentDoc,
} from './docs/catalog'
import { theme, toggleTheme } from './theme'

function normalizeRoute(hash: string): string {
  const value = hash.replace(/^#\/?/, '').trim()
  return value || 'home'
}

const route = ref(normalizeRoute(window.location.hash))
const sidebarOpen = ref(false)

const activeDoc = computed<ComponentDoc | undefined>(() =>
  componentDocs.find((doc) => doc.slug === route.value),
)

const activeCategory = computed(() => {
  if (!activeDoc.value) return undefined
  return componentCategories.find((category) => category.id === activeDoc.value?.category)
})

const activeIndex = computed(() =>
  activeDoc.value ? componentDocs.findIndex((doc) => doc.slug === activeDoc.value?.slug) : -1,
)
const previousDoc = computed(() =>
  activeIndex.value > 0 ? componentDocs[activeIndex.value - 1] : undefined,
)
const nextDoc = computed(() =>
  activeIndex.value >= 0 && activeIndex.value < componentDocs.length - 1
    ? componentDocs[activeIndex.value + 1]
    : undefined,
)

function syncRoute() {
  route.value = normalizeRoute(window.location.hash)
  sidebarOpen.value = false
}

function closeSidebar() {
  sidebarOpen.value = false
}

onMounted(() => {
  window.addEventListener('hashchange', syncRoute)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncRoute)
})

watch(
  route,
  () => {
    document.title = activeDoc.value
      ? `${activeDoc.value.name} · Wuhu Vue UI`
      : 'Wuhu Vue UI · Vue 3 业务组件库'
    window.scrollTo({ top: 0, behavior: 'auto' })
  },
  { immediate: true },
)
</script>

<template>
  <div class="doc-app">
    <header class="doc-header">
      <div class="doc-header__inner">
        <button
          type="button"
          class="doc-menu-toggle"
          :aria-expanded="sidebarOpen"
          aria-label="切换组件菜单"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        </button>

        <a class="doc-brand" href="#/home">
          <span class="doc-brand__mark" aria-hidden="true">W</span>
          <span class="doc-brand__text">
            <strong>Wuhu UI</strong>
            <small>Vue 3 Components</small>
          </span>
        </a>

        <nav class="doc-header__links" aria-label="快捷入口">
          <a href="#/home">首页</a>
          <a href="#/command-menu">命令面板</a>
          <a href="#/gantt">甘特图</a>
          <a href="#/file-viewer">文件预览</a>
        </nav>

        <div class="doc-header__actions">
          <span class="doc-version">v0.0.1</span>
          <button
            type="button"
            class="theme-toggle"
            :aria-label="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'"
            @click="toggleTheme"
          >
            <svg v-if="theme === 'light'" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7" />
              <path
                d="M12 2.5v2M12 19.5v2M4.3 4.3l1.4 1.4M18.3 18.3l1.4 1.4M2.5 12h2M19.5 12h2M4.3 19.7l1.4-1.4M18.3 5.7l1.4-1.4"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <div class="doc-layout">
      <div class="doc-sidebar-mask" :class="{ 'is-visible': sidebarOpen }" @click="closeSidebar" />

      <aside class="doc-sidebar" :class="{ 'is-open': sidebarOpen }">
        <nav class="doc-nav" aria-label="组件文档导航">
          <a class="doc-nav__overview" :class="{ 'is-active': route === 'home' }" href="#/home">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3.5 9 10 3.5 16.5 9v7.5h-4.25v-4.5h-4.5v4.5H3.5V9Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
            </svg>
            <span>总览</span>
          </a>

          <div v-for="category in docsByCategory" :key="category.id" class="doc-nav__group">
            <div class="doc-nav__group-title">
              <span>{{ category.title }}</span>
              <small>{{ category.items.length }}</small>
            </div>

            <a
              v-for="doc in category.items"
              :key="doc.slug"
              class="doc-nav__link"
              :class="{ 'is-active': route === doc.slug }"
              :href="`#/${doc.slug}`"
            >
              <span class="doc-nav__dot" aria-hidden="true" />
              <span class="doc-nav__label">{{ doc.name }}</span>
              <small>{{ doc.title }}</small>
            </a>
          </div>
        </nav>

        <div class="doc-sidebar__footer">
          <span>TypeScript · Less · Vitest</span>
          <span>{{ componentDocs.length }} components</span>
        </div>
      </aside>

      <main class="doc-main">
        <HomeView v-if="route === 'home'" />

        <article v-else-if="activeDoc" class="doc-page">
          <header class="doc-page__header">
            <nav class="doc-breadcrumb" aria-label="面包屑">
              <a href="#/home">文档</a>
              <span aria-hidden="true">/</span>
              <span>{{ activeCategory?.title }}</span>
            </nav>

            <h1>
              {{ activeDoc.name }}
              <small>{{ activeDoc.title }}</small>
            </h1>
            <p class="doc-page__summary">{{ activeDoc.summary }}</p>

            <div class="doc-page__meta">
              <code>{{ activeDoc.packageName }}</code>
              <span v-for="tag in activeDoc.tags" :key="tag" class="doc-tag">{{ tag }}</span>
            </div>
          </header>

          <component :is="activeDoc.demo" />

          <nav class="doc-pager" aria-label="组件翻页">
            <a v-if="previousDoc" class="doc-pager__link" :href="`#/${previousDoc.slug}`">
              <small>上一个</small>
              <strong>{{ previousDoc.name }}</strong>
            </a>
            <span v-else />

            <a
              v-if="nextDoc"
              class="doc-pager__link doc-pager__link--next"
              :href="`#/${nextDoc.slug}`"
            >
              <small>下一个</small>
              <strong>{{ nextDoc.name }}</strong>
            </a>
          </nav>
        </article>

        <div v-else class="doc-not-found">
          <span class="home-eyebrow">404</span>
          <h1>未找到这个组件</h1>
          <p>链接可能已经失效，返回首页查看完整组件目录。</p>
          <a class="button button--primary" href="#/home">返回首页</a>
        </div>

        <footer class="doc-footer">
          <span>Wuhu Vue UI · 为 Vue 3 业务场景而设计</span>
          <span>TypeScript · Less · Oxlint · Oxfmt · Husky</span>
        </footer>
      </main>
    </div>
  </div>
</template>
