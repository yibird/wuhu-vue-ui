import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import SearchPanel from '../SearchPanel.vue'
import type { SearchPanelExpose } from '../types'

const items = [
  { key: 'dashboard', label: '工作台', group: '导航' },
  { key: 'settings', label: '系统设置', group: '导航' },
]

const wrappers: VueWrapper[] = []

function mountPanel(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  const wrapper = mount(SearchPanel, {
    props: { items, ...props },
    attachTo: document.body,
    ...options,
  })
  wrappers.push(wrapper)
  return wrapper
}

function vm(wrapper: VueWrapper) {
  return wrapper.vm as unknown as SearchPanelExpose
}

function panel() {
  return document.querySelector<HTMLElement>('.w-search-panel__panel')
}

async function flush() {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

describe('SearchPanel', () => {
  it('renders a dialog when open without a default header', async () => {
    mountPanel({ open: true }, { attrs: { 'aria-label': '快速搜索' } })
    await flush()

    const dialog = panel()
    expect(dialog).not.toBeNull()
    expect(dialog!.getAttribute('role')).toBe('dialog')
    expect(dialog!.getAttribute('aria-modal')).toBe('true')
    expect(dialog!.getAttribute('aria-label')).toBe('快速搜索')
    expect(dialog!.querySelector('.w-search-panel__header')).toBeNull()
    expect(dialog!.querySelector<HTMLElement>('.w-command-menu__list')!.style.maxHeight).toBe(
      '320px',
    )
    expect(document.querySelector('.w-search-panel__backdrop')).not.toBeNull()
    expect(document.querySelector('.w-search-panel input')).toBe(document.activeElement)
  })

  it('falls back to the default accessible name', async () => {
    mountPanel({ open: true })
    await flush()

    expect(panel()!.getAttribute('aria-label')).toBe('搜索面板')
  })

  it('applies width, height and overlay z-index', async () => {
    mountPanel({ open: true, width: 480, height: 320, zIndex: 2400 })
    await flush()

    const dialog = panel()!
    const overlay = document.querySelector<HTMLElement>('.w-search-panel')!
    expect(dialog.style.width).toBe('480px')
    expect(dialog.style.height).toBe('320px')
    expect(overlay.style.zIndex).toBe('2400')
  })

  it('teleports into a custom target', async () => {
    const target = document.createElement('div')
    target.id = 'search-panel-root'
    document.body.append(target)

    mountPanel({ open: true, to: '#search-panel-root' })
    await flush()

    expect(target.querySelector('.w-search-panel__panel')).not.toBeNull()
  })

  it('opens with Mod+K and closes with Escape', async () => {
    const wrapper = mountPanel()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flush()

    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
    expect(wrapper.emitted('open')).toHaveLength(1)
    expect(panel()).not.toBeNull()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flush()

    expect(wrapper.emitted('close')?.at(-1)).toEqual(['escape'])
    expect(panel()).toBeNull()
  })

  it('does not open when the shortcut is disabled', async () => {
    const wrapper = mountPanel({ shortcut: false })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    await flush()

    expect(wrapper.emitted('update:open')).toBeUndefined()
    expect(panel()).toBeNull()
  })

  it('closes on outside pointerdown but not inside the panel', async () => {
    const wrapper = mountPanel()
    vm(wrapper).open()
    await flush()

    panel()!.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flush()
    expect(panel()).not.toBeNull()

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flush()

    expect(wrapper.emitted('close')?.at(-1)).toEqual(['backdrop'])
    expect(panel()).toBeNull()
  })

  it('closes on selection and re-emits CommandMenu events', async () => {
    const wrapper = mountPanel()
    vm(wrapper).open()
    await flush()

    const option = panel()!.querySelector<HTMLElement>('.w-command-menu__item')
    option!.click()
    await flush()

    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ key: 'dashboard' })
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['dashboard'])
    expect(wrapper.emitted('close')?.at(-1)).toEqual(['select'])
    expect(panel()).toBeNull()
  })

  it('does not highlight the selected value inside the panel', async () => {
    mountPanel({ open: true, value: 'dashboard' })
    await flush()

    expect(panel()!.querySelector('.w-command-menu__item.is-selected')).toBeNull()
  })

  it('keeps the panel open when closeOnSelect is false', async () => {
    const wrapper = mountPanel({ closeOnSelect: false })
    vm(wrapper).open()
    await flush()

    panel()!.querySelector<HTMLElement>('.w-command-menu__item')!.click()
    await flush()

    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(panel()).not.toBeNull()
  })

  it('restores focus to the trigger after Escape', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'open'
    document.body.append(trigger)
    trigger.focus()

    const wrapper = mountPanel()
    vm(wrapper).open()
    await flush()
    expect(document.activeElement).not.toBe(trigger)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flush()

    expect(document.activeElement).toBe(trigger)
  })

  it('renders the default footer shortcut and custom slots', async () => {
    const wrapper = mountPanel(
      {},
      {
        slots: {
          header: () => h('span', { class: 'custom-header' }, '自定义头部'),
          footer: () => h('span', { class: 'custom-footer' }, '自定义底部'),
          item: ({ item }: { item: { label: string } }) =>
            h('span', { class: 'custom-item' }, item.label),
        },
      },
    )
    vm(wrapper).open()
    await flush()

    expect(panel()!.querySelector('.custom-header')?.textContent).toBe('自定义头部')
    expect(panel()!.querySelector('.custom-footer')?.textContent).toBe('自定义底部')
    expect(panel()!.querySelector('.custom-item')).not.toBeNull()
  })

  it('locks body scrolling until closed and unmounts cleanly', async () => {
    const wrapper = mountPanel()
    vm(wrapper).open()
    await flush()
    expect(document.body.style.overflow).toBe('hidden')

    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)
    expect(document.body.style.overflow).toBe('')
  })

  it('applies semantic classes and styles to the panel', async () => {
    mountPanel({
      open: true,
      classes: {
        panel: 'custom-panel',
        overlay: 'custom-overlay',
        command: { root: 'custom-command', list: 'custom-list' },
      },
      styles: {
        panel: { backgroundColor: 'rgb(1, 2, 3)' },
        command: { list: { maxHeight: '220px' } },
      },
    })
    await flush()

    const dialog = panel()!
    expect(dialog.classList.contains('custom-panel')).toBe(true)
    expect(dialog.style.backgroundColor).toBe('rgb(1, 2, 3)')
    expect(document.querySelector('.custom-overlay')).not.toBeNull()
    expect(dialog.querySelector('.custom-command')).not.toBeNull()
    const list = dialog.querySelector<HTMLElement>('.w-command-menu__list')!
    expect(list.classList.contains('custom-list')).toBe(true)
    expect(list.style.maxHeight).toBe('220px')
  })
})
