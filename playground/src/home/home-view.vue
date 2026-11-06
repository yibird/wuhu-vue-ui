<script setup lang="ts">
import { GradientText } from '@wuhu-vue-ui/gradient-text'
import { docsByCategory, componentDocs } from '../docs/catalog'

const features = [
  {
    index: '01',
    title: '独立组件包',
    description: '16 个组件独立发布、按需引入，互不耦合，升级与替换都更可控。',
  },
  {
    index: '02',
    title: 'TypeScript 优先',
    description: '所有 Props、事件、插槽与实例方法均提供完整类型，严格模式无隐式 any。',
  },
  {
    index: '03',
    title: '设计令牌驱动',
    description: '统一的 --w-* 令牌与亮 / 暗主题，可通过任意祖先节点覆盖品牌样式。',
  },
  {
    index: '04',
    title: '可访问性内建',
    description: '键盘导航、ARIA 关系、焦点管理与 prefers-reduced-motion 均在组件内处理。',
  },
  {
    index: '05',
    title: '组合式 API',
    description: '全部基于 script setup 与 Composition API，逻辑清晰、易于组合与扩展。',
  },
  {
    index: '06',
    title: '轻量运行时',
    description: '可选能力按需安装，拼音、虚拟列表等依赖不会被打进组件本体。',
  },
]

const stats = [
  { value: String(componentDocs.length), label: '独立组件包' },
  { value: String(docsByCategory.length), label: '组件分类' },
  { value: '100%', label: 'TypeScript' },
  { value: '0', label: 'UI 框架依赖' },
]

const installCode = `pnpm add @wuhu-vue-ui/scrollbar

import { Scrollbar } from '@wuhu-vue-ui/scrollbar'`

function scrollToCatalog() {
  document.getElementById('component-catalog')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}
</script>

<template>
  <div class="home">
    <section class="home-hero">
      <div class="home-hero__glow home-hero__glow--a" aria-hidden="true" />
      <div class="home-hero__glow home-hero__glow--b" aria-hidden="true" />

      <div class="home-hero__content">
        <span class="home-badge">
          <span class="home-badge__dot" />
          Vue 3.5 · TypeScript · Less · Monorepo
        </span>

        <h1 class="home-hero__title">
          为复杂业务而生的
          <span class="home-hero__gradient">
            <GradientText
              :colors="['#4f46e5', '#c026d3', '#0ea5e9']"
              :animate="true"
              :duration="7000"
            >
              Vue 3 组件库
            </GradientText>
          </span>
        </h1>

        <p class="home-hero__lead">
          {{ componentDocs.length }} 个经过细节打磨的业务组件，独立发布、按需引入。
          以设计令牌驱动主题，覆盖滚动、搜索、排期、文件预览与复杂交互等高频场景。
        </p>

        <div class="home-hero__actions">
          <button type="button" class="button button--primary" @click="scrollToCatalog">
            浏览全部组件
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 10h11M11 5l5 5-5 5"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <a class="button button--ghost" href="#/command-menu">体验命令面板</a>
        </div>

        <dl class="home-stats">
          <div v-for="stat in stats" :key="stat.label">
            <dt>{{ stat.value }}</dt>
            <dd>{{ stat.label }}</dd>
          </div>
        </dl>
      </div>

      <div class="home-hero__preview" aria-hidden="true">
        <div class="home-preview">
          <div class="home-preview__bar">
            <span class="home-preview__dots"><i /><i /><i /></span>
            <span>Command Menu</span>
          </div>
          <div class="home-preview__search">
            <svg viewBox="0 0 20 20" fill="none">
              <circle cx="8.75" cy="8.75" r="5.25" stroke="currentColor" stroke-width="1.6" />
              <path
                d="m12.75 12.75 3.75 3.75"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            <span>gzt</span>
            <kbd>ESC</kbd>
          </div>
          <div class="home-preview__group">导航</div>
          <div class="home-preview__item is-active">
            <span class="home-preview__icon">W</span>
            <div>
              <strong>工作台</strong>
              <small>查看今日概览与关键指标</small>
            </div>
            <span class="home-preview__shortcut">G D</span>
          </div>
          <div class="home-preview__item is-hovered">
            <span class="home-preview__icon">U</span>
            <div>
              <strong>用户管理</strong>
              <small>搜索、编辑与停用用户</small>
            </div>
            <span class="home-preview__shortcut">G U</span>
          </div>
          <div class="home-preview__hint">↑ ↓ 导航 · Enter 选择 · Esc 清空</div>
        </div>

        <div class="home-float home-float--number">
          <span>本月营收</span>
          <strong>¥ 128,860.5</strong>
          <small>↗ 18.2%</small>
        </div>
        <div class="home-float home-float--theme">
          <span class="home-float__swatch" />
          <div>
            <strong>亮 / 暗主题</strong>
            <small>由设计令牌自动驱动</small>
          </div>
        </div>
      </div>
    </section>

    <section class="home-section">
      <div class="home-section__head">
        <span class="home-eyebrow">Why Wuhu UI</span>
        <h2>把复杂交互做成稳定基础设施</h2>
        <p>每一处键盘、焦点、主题与卸载细节，都封装在组件内部。</p>
      </div>

      <div class="home-features">
        <article v-for="feature in features" :key="feature.index" class="home-feature">
          <span class="home-feature__index">{{ feature.index }}</span>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </article>
      </div>
    </section>

    <section id="component-catalog" class="home-section home-section--catalog">
      <div class="home-section__head">
        <span class="home-eyebrow">Components</span>
        <h2>组件目录</h2>
        <p>每个组件都有独立文档页，并附带多个真实用例。</p>
      </div>

      <div v-for="category in docsByCategory" :key="category.id" class="catalog-group">
        <div class="catalog-group__head">
          <h3>{{ category.title }}</h3>
          <span>{{ category.items.length }} 个组件</span>
        </div>
        <p class="catalog-group__desc">{{ category.description }}</p>

        <div class="catalog-grid">
          <a
            v-for="doc in category.items"
            :key="doc.slug"
            class="catalog-card"
            :href="`#/${doc.slug}`"
          >
            <div class="catalog-card__head">
              <strong>{{ doc.name }}</strong>
              <span>{{ doc.title }}</span>
            </div>
            <p>{{ doc.summary }}</p>
            <div class="catalog-card__tags">
              <span v-for="tag in doc.tags" :key="tag">{{ tag }}</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <section class="home-section home-start">
      <div class="home-start__copy">
        <span class="home-eyebrow">Get Started</span>
        <h2>三行代码开始使用</h2>
        <p>
          引入全局设计令牌后，按需安装任意组件包。样式随包自动注入，也可以手动导入
          <code>style.css</code> 控制加载顺序。
        </p>
        <a class="button button--primary" href="#/scrollbar">从 Scrollbar 开始</a>
      </div>
      <pre class="home-code"><code>{{ installCode }}</code></pre>
    </section>
  </div>
</template>
