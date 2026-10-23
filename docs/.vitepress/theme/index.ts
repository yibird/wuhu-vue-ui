import { defineComponent, h, watchEffect } from 'vue'
import { useData, type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { ConfigProvider, theme as antTheme } from 'antdv-next'
import zhCN from 'antdv-next/locale/zh_CN'
import 'virtual:group-icons.css'
import { setTheme } from '../../../playground/src/theme'
import './tokens.less'
import '../../../playground/src/demo-internals.less'
import '../../../playground/src/demo-styles.less'
import '../../../playground/src/demos/sliding-highlight.less'
import './style.less'

function getAntTokens(isDark: boolean) {
  return {
    colorPrimary: isDark ? '#818cf8' : '#4f46e5',
    borderRadius: 10,
    controlHeight: 36,
    fontFamily: 'var(--w-font-family)',
    motionDurationFast: '0.12s',
    motionDurationMid: '0.22s',
    motionDurationSlow: '0.4s',
  }
}

const DocsLayout = defineComponent({
  name: 'WuhuDocsLayout',
  setup() {
    const { isDark } = useData()

    return () =>
      h(
        ConfigProvider,
        {
          locale: zhCN,
          theme: {
            algorithm: isDark.value ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
            token: getAntTokens(isDark.value),
          },
        },
        { default: () => h(DefaultTheme.Layout) },
      )
  },
})

export default {
  extends: DefaultTheme,
  Layout: DocsLayout,
  setup() {
    const { isDark } = useData()

    watchEffect(() => {
      setTheme(isDark.value ? 'dark' : 'light')
    })
  },
} satisfies Theme
