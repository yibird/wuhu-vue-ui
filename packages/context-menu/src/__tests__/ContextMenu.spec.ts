import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import ContextMenu from '../ContextMenu.vue'
import type {
  ContextMenuExpose,
  ContextMenuItem,
  ContextMenuProps,
  ContextMenuSelectDetails,
} from '../types'

const wrappers: VueWrapper[] = []
const extraElements: HTMLElement[] = []

const items: ContextMenuItem[] = [
  { type: 'header', label: '编辑' },
  {
    key: 'rename',
    label: '重命名',
    icon: h('span', '✎'),
    suffix: h('kbd', 'F2'),
  },
  { key: 'duplicate', label: '创建副本' },
  { key: 'archive', label: '归档', disabled: true },
  { type: 'separator' },
  { key: 'delete', label: '删除', danger: true },
]

function mountMenu(props: Record<string, unknown> = {}) {
  const wrapper = mount(ContextMenu, {
    props: { items, ...props } as ContextMenuProps,
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

function menuVm(wrapper: VueWrapper) {
  return wrapper.vm as unknown as ContextMenuExpose
}

function contextEvent(x = 40, y = 60) {
  return new MouseEvent('contextmenu', {
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
  })
}

async function openMenu(wrapper: VueWrapper, x = 40, y = 60) {
  const event = contextEvent(x, y)
  const opened = menuVm(wrapper).open(event)
  await nextTick()
  await nextTick()
  return { event, opened }
}

function getMenu() {
  return document.querySelector<HTMLElement>('.w-context-menu')
}

function getItems() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('.w-context-menu__item'))
}

function getActiveItem() {
  return document.querySelector<HTMLElement>('.w-context-menu__item.is-active')
}

function press(target: EventTarget, key: string) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, composed: true }),
  )
}

function createTrigger() {
  const trigger = document.createElement('button')
  trigger.textContent = 'trigger'
  document.body.append(trigger)
  extraElements.push(trigger)
  return trigger
}

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  extraElements.splice(0).forEach((element) => element.remove())
  document.body.innerHTML = ''
})

describe('ContextMenu', () => {
  it('renders actions, headings and separators with menu semantics', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    const menu = getMenu()
    expect(menu).not.toBeNull()
    expect(menu!.getAttribute('role')).toBe('menu')
    expect(menu!.getAttribute('aria-label')).toBe('上下文菜单')

    expect(document.querySelectorAll('.w-context-menu__group-label')).toHaveLength(1)
    expect(document.querySelectorAll('.w-context-menu__separator')).toHaveLength(1)
    expect(getItems()).toHaveLength(4)

    const rename = getItems()[0]!
    expect(rename.getAttribute('role')).toBe('menuitem')
    expect(rename.textContent).toContain('重命名')
    expect(rename.querySelector('.w-context-menu__item-icon')?.textContent).toBe('✎')
    expect(rename.querySelector('.w-context-menu__item-suffix')?.textContent).toBe('F2')

    const archive = getItems()[2]!
    expect(archive.disabled).toBe(true)

    const remove = getItems()[3]!
    expect(remove.classList.contains('is-danger')).toBe(true)

    // Focus stays on the menu panel; items are never focusable.
    expect(document.activeElement).toBe(menu)
    expect(getItems().every((item) => item.tabIndex === -1)).toBe(true)
  })

  it('positions the panel at the pointer coordinates', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper, 40, 60)

    const menu = getMenu()!
    expect(menu.style.getPropertyValue('--w-context-menu-x')).toBe('40px')
    expect(menu.style.getPropertyValue('--w-context-menu-y')).toBe('60px')
    expect(menu.style.left).toBe('')
  })

  it('clamps past the viewport edge', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper, 5000, 5000)

    expect(getMenu()!.style.getPropertyValue('--w-context-menu-x')).toBe(
      `${window.innerWidth - 8}px`,
    )
    expect(getMenu()!.style.getPropertyValue('--w-context-menu-y')).toBe(
      `${window.innerHeight - 8}px`,
    )
  })

  it('clamps with the layout size instead of the animated rect', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(240)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(180)

    const wrapper = mountMenu()
    await openMenu(wrapper, 5000, 5000)

    const menu = getMenu()!
    expect(menu.style.getPropertyValue('--w-context-menu-x')).toBe(
      `${window.innerWidth - 240 - 8}px`,
    )
    expect(menu.style.getPropertyValue('--w-context-menu-y')).toBe(
      `${window.innerHeight - 180 - 8}px`,
    )
  })

  it('keeps the native menu when there is nothing actionable', async () => {
    const wrapper = mountMenu({
      items: [{ type: 'header', label: '仅标题' }, { type: 'separator' }],
    })
    const { event, opened } = await openMenu(wrapper)

    expect(opened).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    expect(getMenu()).toBeNull()

    const emptyWrapper = mountMenu({ items: [] })
    const empty = await openMenu(emptyWrapper)
    expect(empty.opened).toBe(false)
    expect(empty.event.defaultPrevented).toBe(false)
  })

  it('resolves factory items once per opening', async () => {
    const factory = vi.fn(() => [{ key: 'open', label: '打开文档' }])
    const wrapper = mountMenu({ items: factory })
    await openMenu(wrapper)

    expect(factory).toHaveBeenCalledTimes(1)
    expect(getItems()[0]!.textContent).toContain('打开文档')
  })

  it('re-renders array items updated while open', async () => {
    const wrapper = mountMenu({ items: [{ key: 'a', label: 'A' }] })
    await openMenu(wrapper)
    expect(getItems()).toHaveLength(1)

    await wrapper.setProps({
      items: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
      ],
    })
    await nextTick()
    expect(getItems()).toHaveLength(2)
  })

  it('selects an action and closes the menu', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    getItems()[0]!.click()
    await nextTick()

    const selected = wrapper.emitted('select')?.[0]?.[0] as ContextMenuSelectDetails
    expect(selected.item.key).toBe('rename')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(getMenu()).toBeNull()
  })

  it('keeps the menu open when closeOnSelect is false', async () => {
    const wrapper = mountMenu({ closeOnSelect: false })
    await openMenu(wrapper)

    getItems()[1]!.click()
    await nextTick()

    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(getMenu()).not.toBeNull()
  })

  it('navigates with arrows, Home/End and activates with Enter', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    expect(document.activeElement).toBe(getMenu())
    expect(getActiveItem()).toBeNull()

    press(getMenu()!, 'ArrowDown')
    await nextTick()
    expect(getActiveItem()).toBe(getItems()[0])
    expect(getMenu()!.getAttribute('aria-activedescendant')).toBe(getItems()[0]!.id)

    press(getMenu()!, 'ArrowDown')
    await nextTick()
    expect(getActiveItem()).toBe(getItems()[1])

    // Disabled "归档" is skipped.
    press(getMenu()!, 'ArrowDown')
    await nextTick()
    expect(getActiveItem()).toBe(getItems()[3])

    press(getMenu()!, 'Home')
    await nextTick()
    expect(getActiveItem()).toBe(getItems()[0])

    press(getMenu()!, 'End')
    await nextTick()
    expect(getActiveItem()).toBe(getItems()[3])

    press(getMenu()!, 'ArrowDown')
    await nextTick()
    expect(getActiveItem()).toBe(getItems()[0])

    press(getMenu()!, 'Enter')
    await nextTick()

    const selected = wrapper.emitted('select')?.[0]?.[0] as ContextMenuSelectDetails
    expect(selected.item.key).toBe('rename')
    expect(getMenu()).toBeNull()
  })

  it('closes on Escape and restores focus to the trigger', async () => {
    const trigger = createTrigger()
    trigger.focus()
    const wrapper = mountMenu()
    await openMenu(wrapper)
    expect(document.activeElement).not.toBe(trigger)

    press(document.activeElement!, 'Escape')
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(getMenu()).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('closes on outside pointerdown without stealing focus back', async () => {
    const trigger = createTrigger()
    trigger.focus()
    const wrapper = mountMenu()
    await openMenu(wrapper)

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(getMenu()).toBeNull()
    expect(document.activeElement).not.toBe(trigger)
  })

  it('does not close on pointerdown inside the menu', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    getMenu()!.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()

    expect(wrapper.emitted('close')).toBeUndefined()
    expect(getMenu()).not.toBeNull()
  })

  it('closes on Tab, restoring focus without preventing the default', async () => {
    const trigger = createTrigger()
    trigger.focus()
    const wrapper = mountMenu()
    await openMenu(wrapper)

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    document.activeElement!.dispatchEvent(event)
    await nextTick()

    expect(event.defaultPrevented).toBe(false)
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(getMenu()).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('does not restore focus when restoreFocus is false', async () => {
    const trigger = createTrigger()
    trigger.focus()
    const wrapper = mountMenu({ restoreFocus: false })
    await openMenu(wrapper)

    press(document.activeElement!, 'Escape')
    await nextTick()

    expect(getMenu()).toBeNull()
    expect(document.activeElement).not.toBe(trigger)
  })

  it('closes on window scroll and resize but not on internal scrolling', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    getMenu()!.dispatchEvent(new Event('scroll', { bubbles: false }))
    await nextTick()
    expect(getMenu()).not.toBeNull()

    window.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)

    await openMenu(wrapper)
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(2)
  })

  it('supports controlled open state', async () => {
    const wrapper = mountMenu({ open: false })
    const { opened } = await openMenu(wrapper)

    expect(opened).toBe(true)
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
    expect(getMenu()).toBeNull()

    await wrapper.setProps({ open: true })
    await nextTick()
    expect(getMenu()).not.toBeNull()

    await wrapper.setProps({ open: false })
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(getMenu()).toBeNull()
  })

  it('applies semantic classes and styles', async () => {
    const wrapper = mountMenu({
      classes: {
        root: 'custom-root',
        item: 'custom-item',
        icon: 'custom-icon',
        label: 'custom-label',
        suffix: 'custom-suffix',
        groupLabel: 'custom-group',
        separator: 'custom-separator',
      },
      styles: { root: { padding: '12px' }, item: { fontWeight: '700' } },
    })
    await openMenu(wrapper)

    const menu = getMenu()!
    expect(menu.classList.contains('custom-root')).toBe(true)
    expect(menu.style.padding).toBe('12px')

    const rename = getItems()[0]!
    expect(rename.classList.contains('custom-item')).toBe(true)
    expect(rename.style.fontWeight).toBe('700')
    expect(rename.querySelector('.custom-icon')).not.toBeNull()
    expect(rename.querySelector('.custom-label')).not.toBeNull()
    expect(rename.querySelector('.custom-suffix')).not.toBeNull()
    expect(document.querySelector('.custom-group')).not.toBeNull()
    expect(document.querySelector('.custom-separator')).not.toBeNull()
  })

  it('cleans up listeners on unmount', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)

    wrapper.unmount()
    wrappers.splice(wrappers.indexOf(wrapper), 1)

    expect(() => {
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('resize'))
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    }).not.toThrow()
  })
})
