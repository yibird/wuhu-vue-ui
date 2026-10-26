import { defineConfig } from 'vitepress'
import { vitepressDemoPlugin } from 'vitepress-demo-plugin/markdown'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'
import { workspaceSource } from '../../scripts/workspace-source'
import { componentCategories, componentMetas } from '../../playground/src/docs/component-meta'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Wuhu Vue UI',
  description: '为复杂业务而生的 Vue 3 组件库',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],
  markdown: {
    config(md) {
      // @types/markdown-it versions differ between VitePress and the plugin.
      md.use(groupIconMdPlugin as unknown as (md: unknown) => void)
      md.use(vitepressDemoPlugin, {
        locale: 'zh-CN',
      })
    },
  },
  vite: {
    plugins: [
      workspaceSource(),
      // VitePress pins Vite 5 while the workspace uses Vite 7; the runtime
      // plugin shape is compatible, so normalize the type across versions.
      groupIconVitePlugin() as unknown as { name: string },
    ],
  },
  themeConfig: {
    logo: {
      src: '/logo.svg',
      alt: 'Wuhu Vue UI',
    },
    nav: [
      { text: '组件', link: '/components/scrollbar' },
      { text: '指南', link: '/guide/getting-started' },
    ],
    sidebar: [
      {
        text: '开始',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '样式与 class', link: '/guide/styling' },
        ],
      },
      ...componentCategories.map((category) => ({
        text: category.title,
        items: componentMetas
          .filter((meta) => meta.category === category.id)
          .map((meta) => ({
            text: `${meta.name} · ${meta.title}`,
            link: `/components/${meta.slug}`,
          })),
      })),
    ],
    search: {
      provider: 'local',
    },
    aside: false,
    outline: {
      label: '本页目录',
      level: [2, 3],
    },
    docFooter: {
      prev: '上一个',
      next: '下一个',
    },
    footer: {
      message: '基于 Vue 3、TypeScript、Less 与设计令牌构建',
      copyright: 'MIT Licensed · Wuhu Vue UI',
    },
  },
})
