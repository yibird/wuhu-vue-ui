/**
 * Runs axe-core against every playground component page.
 * Usage: node scripts/a11y-check.mjs [baseUrl]
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'

const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const baseUrl = process.argv[2] ?? 'http://localhost:5174'
const edgePath =
  process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

const routes = [
  'scrollbar',
  'copy',
  'highlight',
  'time',
  'lazy-container',
  'resize-container',
  'error-boundary',
  'gradient-text',
  'number-ticker',
  'sliding-highlight',
  'img-comparison-slider',
  'slider-captcha',
  'command-menu',
  'context-menu',
  'search-panel',
  'cropper',
  'motion-group',
  'gantt',
  'file-viewer',
  'ellipsis',
  'permission',
  'count-down',
  'loading',
  'view',
  'icon',
  'exception',
  'ripple',
  'code-editor',
  'dock',
  'icon-picker',
  'org-tree',
  'json-viewer',
]

const browser = await chromium.launch({ executablePath: edgePath, headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const report = []

for (const route of routes) {
  await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(route === 'file-viewer' || route === 'gantt' ? 1600 : 700)
  await page.addScriptTag({ content: axeSource })

  const result = await page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    })
  })

  if (result.violations.length > 0) {
    report.push({
      route,
      violations: result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.length,
        targets: violation.nodes.slice(0, 4).map((node) => node.target.join(' ')),
      })),
    })
  }
}

await browser.close()

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
