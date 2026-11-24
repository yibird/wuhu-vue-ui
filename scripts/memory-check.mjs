/**
 * Rough client-side heap trend probe. Requires playwright-core + Edge.
 * Run while the playground dev server is running:
 *   node scripts/memory-check.mjs
 */
import { chromium } from 'playwright-core'

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
  'tooltip',
  'ripple',
  'code-editor',
  'dock',
  'icon-picker',
  'org-tree',
  'json-viewer',
]

const browser = await chromium.launch({ executablePath: edgePath, headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await context.newPage()
const client = await context.newCDPSession(page)

await client.send('HeapProfiler.enable')

async function heap() {
  await client.send('HeapProfiler.collectGarbage')
  const usage = await client.send('Runtime.getHeapUsage')
  return Math.round(usage.usedSize / 1024)
}

async function cycle(label) {
  for (const route of routes) {
    await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(120)
  }
  const size = await heap()
  process.stdout.write(`${label}: ${size} KiB\n`)
  return size
}

await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
await heap()

const cycleSizes = []
for (let index = 1; index <= 5; index += 1) {
  cycleSizes.push(await cycle(`route-cycle-${index}`))
}

const heavy = []
for (let index = 1; index <= 6; index += 1) {
  await page.goto(`${baseUrl}/#/file-viewer`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  await page.goto(`${baseUrl}/#/gantt`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  await page.goto(`${baseUrl}/#/home`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(200)
  if (index % 2 === 0) {
    const size = await heap()
    heavy.push({ iteration: index, size })
    process.stdout.write(`heavy-${index}: ${size} KiB\n`)
  }
}

process.stdout.write(
  `${JSON.stringify({ cycleSizes, heavy, growth: cycleSizes.at(-1) - cycleSizes[1] })}\n`,
)

await browser.close()
