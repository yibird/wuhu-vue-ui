<script setup lang="ts">
import { docsByCategory, componentDocs } from '../docs/catalog'

const features = [
  {
    title: '独立组件包',
    description: `${componentDocs.length} 个组件独立发布、按需引入，升级与替换都更可控。`,
  },
  {
    title: 'TypeScript 优先',
    description: 'Props、事件、插槽与实例方法均提供完整类型，严格模式无隐式 any。',
  },
  {
    title: '设计令牌驱动',
    description: '统一的 --w-* 令牌与亮 / 暗主题，可通过任意祖先节点覆盖品牌样式。',
  },
  {
    title: '可访问性内建',
    description: '键盘导航、ARIA 关系、焦点管理与 reduced-motion 均在组件内处理。',
  },
]

const stats = [
  { value: String(componentDocs.length), label: '独立组件包' },
  { value: String(docsByCategory.length), label: '组件分类' },
  { value: 'MIT', label: '开源协议' },
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
      <div class="home-hero__content">
        <span class="home-badge">Vue 3.5 · TypeScript · Less · Monorepo</span>

        <h1 class="home-hero__title">为复杂业务而生的 Vue 3 组件库</h1>

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
            <span>命令面板预览</span>
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
      </div>
    </section>

    <section class="home-section">
      <div class="home-section__head">
        <span class="home-eyebrow">能力</span>
        <h2>把复杂交互做成稳定基础设施</h2>
        <p>每一处键盘、焦点、主题与卸载细节，都封装在组件内部。</p>
      </div>

      <div class="home-features">
        <article v-for="feature in features" :key="feature.title" class="home-feature">
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </article>
      </div>
    </section>

    <section id="component-catalog" class="home-section home-section--catalog">
      <div class="home-section__head">
        <span class="home-eyebrow">组件</span>
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
        <span class="home-eyebrow">开始</span>
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
