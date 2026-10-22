/**
 * Exploratory browser checks for the playground.
 *
 * Usage:
 *   node scripts/visual-check.mjs [baseUrl]
 *
 * Requires playwright-core and a local Chromium-based browser. Screenshots are
 * written to .screenshots/ (gitignored).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

const screenshotRoot = resolve('.screenshots')
mkdirSync(resolve(screenshotRoot, 'desktop'), { recursive: true })
mkdirSync(resolve(screenshotRoot, 'mobile'), { recursive: true })
mkdirSync(resolve(screenshotRoot, 'dark'), { recursive: true })

const results = []

async function inspectPage(page) {
  return page.evaluate(() => {
    const duplicateIds = (() => {
      const seen = new Set()
      const duplicates = new Set()
      for (const element of document.querySelectorAll('[id]')) {
        const id = element.id
        if (!id) continue
        if (seen.has(id)) duplicates.add(id)
        seen.add(id)
      }
      return [...duplicates]
    })()

    const brokenImages = Array.from(document.querySelectorAll('img'))
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.getAttribute('src') ?? '')

    return {
      overflow:
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
        window.innerWidth,
      duplicateIds,
      brokenImages,
      unlabeled: summarizeAccessibility(),
      bodyTextLength: document.body.innerText.trim().length,
    }

    function summarizeAccessibility() {
      const candidates = Array.from(
        document.querySelectorAll(
          'button, [role="button"], a[href], input, select, textarea, [role="slider"], [role="menuitem"]',
        ),
      )

      return candidates
        .filter((element) => {
          const style = getComputedStyle(element)
          return style.display !== 'none' && style.visibility !== 'hidden'
        })
        .map((element) => {
          const name =
            element.getAttribute('aria-label') ??
            element.getAttribute('title') ??
            element.textContent?.trim() ??
            ''
          return {
            tag: element.tagName.toLowerCase(),
            className: typeof element.className === 'string' ? element.className : '',
            name,
            role: element.getAttribute('role'),
          }
        })
        .filter((item) => !item.name)
    }
  })
}

async function main() {
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
  })

  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  })
  const page = await desktop.newPage()
  const consoleErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))

  for (const route of routes) {
    consoleErrors.length = 0
    await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(route === 'file-viewer' || route === 'gantt' ? 1800 : 700)

    const inspection = await inspectPage(page)
    await page.screenshot({
      path: resolve(screenshotRoot, 'desktop', `${route}.png`),
      fullPage: true,
    })

    results.push({ route, viewport: 'desktop', consoleErrors: [...consoleErrors], ...inspection })
  }

  // Mobile pass: overflow and console errors only.
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobile.newPage()
  for (const route of routes) {
    const errors = []
    const onConsole = (message) => {
      if (message.type() === 'error') errors.push(message.text())
    }
    mobilePage.on('console', onConsole)
    await mobilePage.goto(`${baseUrl}/#/${route}`, { waitUntil: 'domcontentloaded' })
    await mobilePage.waitForTimeout(route === 'file-viewer' ? 1500 : 500)
    const inspection = await inspectPage(mobilePage)
    await mobilePage.screenshot({
      path: resolve(screenshotRoot, 'mobile', `${route}.png`),
      fullPage: true,
    })
    results.push({ route, viewport: 'mobile', consoleErrors: errors, ...inspection })
    mobilePage.off('console', onConsole)
  }

  // Dark mode snapshots for representative components.
  const dark = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  })
  const darkPage = await dark.newPage()
  for (const route of ['scrollbar', 'command-menu', 'gantt', 'file-viewer', 'org-tree', 'dock']) {
    await darkPage.goto(`${baseUrl}/#/${route}`, { waitUntil: 'domcontentloaded' })
    await darkPage.waitForTimeout(route === 'file-viewer' || route === 'gantt' ? 1600 : 700)
    await darkPage.screenshot({
      path: resolve(screenshotRoot, 'dark', `${route}.png`),
      fullPage: true,
    })
  }

  // Targeted interaction probes.
  const interactions = {}

  await page.goto(`${baseUrl}/#/command-menu`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  const commandInput = page.locator('.w-command-menu__input, input[role="combobox"]').first()
  if (await commandInput.count()) {
    await commandInput.focus()
    await page.keyboard.press('ArrowDown')
    interactions.commandMenuActive = await commandInput.getAttribute('aria-activedescendant')
    await page.keyboard.press('Escape')
    interactions.commandMenuActiveAfterEscape =
      await commandInput.getAttribute('aria-activedescendant')
  } else {
    interactions.commandMenu = 'input not found'
  }

  await page.goto(`${baseUrl}/#/icon-picker`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
  const iconItem = page.locator('.w-icon-picker__item').first()
  if (await iconItem.count()) {
    await iconItem.focus()
    const before = await page.evaluate(() => document.activeElement?.getAttribute('data-key'))
    await page.keyboard.press('ArrowDown')
    const after = await page.evaluate(() => document.activeElement?.getAttribute('data-key'))
    interactions.iconPickerFocus = { before, after }
  } else {
    interactions.iconPicker = 'item not found'
  }

  for (const [route, selector] of [
    ['gantt', '.w-gantt__task-bar, .w-gantt__row'],
    ['org-tree', '.w-org-tree__node-card'],
  ]) {
    await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(route === 'gantt' ? 1500 : 800)
    const target = page.locator(selector).first()
    if (await target.count()) {
      await target.click({ button: 'right' })
      await page.waitForTimeout(200)
      const menuVisible = await page
        .locator('[role="menu"]')
        .first()
        .isVisible()
        .catch(() => false)
      const firstFocused = await page.evaluate(
        () => document.activeElement?.getAttribute('role') ?? null,
      )
      await page.keyboard.press('ArrowDown')
      const afterArrow = await page.evaluate(
        () => document.activeElement?.textContent?.trim() ?? null,
      )
      await page.keyboard.press('Escape')
      interactions[`${route}Menu`] = { menuVisible, firstFocused, afterArrow }
    } else {
      interactions[`${route}Menu`] = `target not found: ${selector}`
    }
  }

  await page.goto(`${baseUrl}/#/copy`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  const copyTrigger = page.locator('.w-copy__trigger').first()
  if (await copyTrigger.count()) {
    await desktop.grantPermissions(['clipboard-read', 'clipboard-write'])
    await copyTrigger.click()
    await page.waitForTimeout(150)
    interactions.copyText = await page
      .evaluate(() => navigator.clipboard.readText())
      .catch(() => 'unavailable')
  } else {
    interactions.copy = 'trigger not found'
  }

  await page.goto(`${baseUrl}/#/count-down`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(300)
  const countDown = page.locator('.w-count-down').first()
  if (await countDown.count()) {
    const before = await countDown.innerText()
    await page.waitForTimeout(1200)
    const after = await countDown.innerText()
    interactions.countDown = { before, after, changed: before !== after }
  }

  await page.goto(`${baseUrl}/#/scrollbar`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
  interactions.scrollbarThumbs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.w-scrollbar__thumb')).map((element) => ({
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    })),
  )

  // Rough heap trend across a full route cycle.
  const cdp = await desktop.newCDPSession(page)
  await cdp.send('HeapProfiler.enable')
  async function heapSize() {
    await cdp.send('HeapProfiler.collectGarbage')
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: 'performance.memory?.usedJSHeapSize ?? 0',
      returnByValue: true,
    })
    return result.value
  }

  const heap = []
  for (let cycle = 0; cycle < 2; cycle += 1) {
    for (const route of routes) {
      await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(150)
    }
    heap.push(await heapSize())
  }

  await browser.close()

  writeFileSync(
    resolve(screenshotRoot, 'report.json'),
    JSON.stringify({ results, interactions, heap }, null, 2),
  )

  const summary = results.map((item) => ({
    route: item.route,
    viewport: item.viewport,
    overflow: item.overflow,
    consoleErrors: item.consoleErrors.length,
    brokenImages: item.brokenImages.length,
    duplicateIds: item.duplicateIds.length,
    unlabeled: item.unlabeled.length,
  }))

  process.stdout.write(`${JSON.stringify({ summary, interactions, heap }, null, 2)}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
