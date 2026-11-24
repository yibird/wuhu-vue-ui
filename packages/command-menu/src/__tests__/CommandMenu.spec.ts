import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import CommandMenu from '../command-menu.vue'
import type { CommandMenuEmptySlotProps, CommandMenuItem, CommandMenuItemSlotProps } from '../types'

const baseItems: CommandMenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    description: '今日概览',
    group: '导航',
    keywords: ['首页', 'home'],
    shortcut: 'G D',
  },
  { key: 'users', label: '用户管理', group: '导航' },
  { key: 'legacy', label: '旧版控制台', group: '导航', disabled: true },
  { key: 'create-user', label: '新建用户', group: '操作', keywords: ['添加用户'] },
  { key: 'settings', label: '系统设置', group: '设置' },
  { key: 'help', label: '帮助中心', description: 'docs' },
]

const wrappers: VueWrapper[] = []

function mountMenu(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  const wrapper = mount(CommandMenu, {
    props: { items: baseItems, ...props },
    attachTo: document.body,
    ...options,
  })
  wrappers.push(wrapper as VueWrapper)
  return wrapper
}

function getInput(wrapper: VueWrapper) {
  return wrapper.get('input')
}

function getOptions(wrapper: VueWrapper) {
  return wrapper.findAll('[role="option"]')
}

function getLabels(wrapper: VueWrapper) {
  return getOptions(wrapper).map((option) => option.get('.w-command-menu__item-label').text())
}

function getGroupLabels(wrapper: VueWrapper) {
  return wrapper.findAll('.w-command-menu__group-label').map((label) => label.text())
}

function getActiveLabel(wrapper: VueWrapper): string | undefined {
  const active = wrapper.find('.w-command-menu__item.is-active')
  return active.exists() ? active.get('.w-command-menu__item-label').text() : undefined
}

function makeRect(top: number, bottom: number): DOMRect {
  return { top, bottom, left: 0, right: 0, width: 0, height: bottom - top } as DOMRect
}

afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
})

describe('CommandMenu', () => {
  it('filters by label, description and keywords', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    await input.setValue('用户')
    expect(getLabels(wrapper)).toEqual(['用户管理', '新建用户'])

    await input.setValue('今日')
    expect(getLabels(wrapper)).toEqual(['工作台'])

    await input.setValue('docs')
    expect(getLabels(wrapper)).toEqual(['帮助中心'])

    await input.setValue('添加')
    expect(getLabels(wrapper)).toEqual(['新建用户'])

    await input.setValue('不存在')
    expect(getOptions(wrapper)).toHaveLength(0)
    expect(wrapper.get('.w-command-menu__empty').text()).toContain('未找到匹配的命令')
    expect(wrapper.get('.w-command-menu__empty .w-empty__description').text()).toBe(
      '换个关键词试试',
    )
    expect(wrapper.emitted('search')?.at(-1)).toEqual(['不存在'])
  })

  it('supports a custom filter for pinyin or other matching', async () => {
    const wrapper = mountMenu({
      filter: (item: CommandMenuItem, search: string) =>
        search === 'gzt' ? item.key === 'dashboard' : item.label.includes(search),
    })
    const input = getInput(wrapper)

    await input.setValue('gzt')
    expect(getLabels(wrapper)).toEqual(['工作台'])

    await input.setValue('用户')
    expect(getLabels(wrapper)).toEqual(['用户管理', '新建用户'])
  })

  it('reflects whether the listbox has results in aria-expanded', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    expect(input.attributes('aria-expanded')).toBe('true')

    await input.setValue('不存在')
    expect(input.attributes('aria-expanded')).toBe('false')

    await input.setValue('')
    expect(input.attributes('aria-expanded')).toBe('true')
  })

  it('hides empty groups and keeps first-appearance order', async () => {
    const wrapper = mountMenu()
    await getInput(wrapper).setValue('新建')

    expect(getGroupLabels(wrapper)).toEqual(['操作'])
    expect(getLabels(wrapper)).toEqual(['新建用户'])
  })

  it('keeps ungrouped items and merges duplicate groups in original order', () => {
    const items: CommandMenuItem[] = [
      { key: 'a1', label: 'A1', group: 'A' },
      { key: 'b1', label: 'B1', group: 'B' },
      { key: 'plain', label: 'Plain' },
      { key: 'a2', label: 'A2', group: 'A' },
    ]
    const wrapper = mountMenu({ items })

    expect(getGroupLabels(wrapper)).toEqual(['A', 'B'])
    expect(getLabels(wrapper)).toEqual(['A1', 'A2', 'B1', 'Plain'])
  })

  it('renders a flat list when no item has a group', () => {
    const items = baseItems.map((item) => ({ ...item, group: undefined }))
    const wrapper = mountMenu({ items })

    expect(getGroupLabels(wrapper)).toEqual([])
    expect(getLabels(wrapper)).toHaveLength(baseItems.length)
  })

  it('keeps every item when filterable is false', async () => {
    const wrapper = mountMenu({ filterable: false })
    await getInput(wrapper).setValue('zzz')

    expect(getLabels(wrapper)).toHaveLength(baseItems.length)
    expect(wrapper.find('.w-command-menu__empty').exists()).toBe(false)
  })

  it('moves the keyboard cursor without selecting, skipping disabled items', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    expect(getActiveLabel(wrapper)).toBeUndefined()

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('工作台')

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('用户管理')

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('新建用户')

    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(getActiveLabel(wrapper)).toBe('用户管理')

    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.emitted('update:value')).toBeUndefined()
  })

  it('moves the active row across group boundaries', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('工作台')

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('用户管理')
    expect(wrapper.find('.is-active')?.text()).toContain('用户管理')

    // 用户管理 is the last enabled row of 导航; the next row starts 操作.
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('新建用户')
    expect(wrapper.find('.is-active')?.text()).toContain('新建用户')

    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('moves from a group-end selection to the next group first item', async () => {
    const selected = mountMenu({ value: 'users' })
    expect(getActiveLabel(selected)).toBeUndefined()

    await getInput(selected).trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(selected)).toBe('新建用户')

    const clicked = mountMenu()
    await getOptions(clicked)
      .find((option) => option.text().includes('用户管理'))
      ?.trigger('click')
    expect(clicked.emitted('update:value')?.[0]).toEqual(['users'])
    expect(getActiveLabel(clicked)).toBeUndefined()

    await clicked.setProps({ value: 'users' })
    await getInput(clicked).trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(clicked)).toBe('新建用户')
  })

  it('prefers the highlight index over the selected index', async () => {
    const wrapper = mountMenu({ value: 'help' })
    const input = getInput(wrapper)

    // Both start with no highlight; the first move starts from the selected item.
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(getActiveLabel(wrapper)).toBe('系统设置')

    // Changing the selected item must not override an existing highlight.
    await wrapper.setProps({ value: 'dashboard' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('帮助中心')
  })

  it('navigates groups as one flattened sequence', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)
    const expected = ['工作台', '用户管理', '新建用户', '系统设置', '帮助中心', '工作台']

    for (const label of expected) {
      await input.trigger('keydown', { key: 'ArrowDown' })
      expect(getActiveLabel(wrapper)).toBe(label)
    }

    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('handles arrow keys when the event originates from the menu root', async () => {
    const wrapper = mountMenu()

    await wrapper.get('.w-command-menu').trigger('keydown', { key: 'ArrowDown' })

    expect(getActiveLabel(wrapper)).toBe('工作台')
  })

  it('prevents default and stops propagation for navigation keys', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)
    const outer = vi.fn()
    document.body.addEventListener('keydown', outer)

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    })
    ;(input.element as HTMLElement).dispatchEvent(event)

    document.body.removeEventListener('keydown', outer)
    await nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(outer).not.toHaveBeenCalled()
    expect(getActiveLabel(wrapper)).toBe('工作台')
  })

  it('wraps navigation and supports Home / End', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(getActiveLabel(wrapper)).toBe('帮助中心')

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('工作台')

    await input.trigger('keydown', { key: 'End' })
    expect(getActiveLabel(wrapper)).toBe('帮助中心')

    await input.trigger('keydown', { key: 'Home' })
    expect(getActiveLabel(wrapper)).toBe('工作台')
  })

  it('starts at the first or last row when nothing is active', async () => {
    const down = mountMenu()
    expect(getActiveLabel(down)).toBeUndefined()

    await getInput(down).trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(down)).toBe('工作台')

    const up = mountMenu()
    expect(getActiveLabel(up)).toBeUndefined()

    await getInput(up).trigger('keydown', { key: 'ArrowUp' })
    expect(getActiveLabel(up)).toBe('帮助中心')
  })

  it('navigates relative to the selected item', async () => {
    const up = mountMenu({ value: 'create-user' })
    expect(getActiveLabel(up)).toBeUndefined()

    await getInput(up).trigger('keydown', { key: 'ArrowUp' })
    expect(getActiveLabel(up)).toBe('用户管理')

    const down = mountMenu({ value: 'create-user' })
    expect(getActiveLabel(down)).toBeUndefined()

    await getInput(down).trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(down)).toBe('系统设置')
  })

  it('navigates from the selection created by a click', async () => {
    const wrapper = mountMenu()
    const options = getOptions(wrapper)

    await options[3]?.trigger('click')
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['create-user'])

    await wrapper.setProps({ value: 'create-user' })
    await getInput(wrapper).trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('系统设置')
  })

  it('selects the active item with Enter and never selects disabled items', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:value')?.[0]).toEqual(['dashboard'])
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ key: 'dashboard' })

    const disabled = getOptions(wrapper).find((option) => option.text().includes('旧版控制台'))
    await disabled?.trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('keeps a single active row when hovering', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)
    const options = getOptions(wrapper)

    await options[1]?.trigger('mouseenter')

    expect(options[1]?.classes()).toEqual(expect.arrayContaining(['is-hovered', 'is-active']))
    expect(wrapper.findAll('.is-active')).toHaveLength(1)
    expect(wrapper.findAll('.is-hovered')).toHaveLength(1)
    expect(getActiveLabel(wrapper)).toBe('用户管理')
    expect(input.attributes('aria-activedescendant')).toBe(options[1]?.attributes('id'))

    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['users'])

    await wrapper.get('.w-command-menu__list').trigger('mouseleave')

    expect(wrapper.find('.is-hovered').exists()).toBe(false)
    expect(getActiveLabel(wrapper)).toBeUndefined()

    await options[2]?.trigger('mouseenter')
    expect(wrapper.find('.is-hovered').exists()).toBe(false)
    expect(getActiveLabel(wrapper)).toBeUndefined()
  })

  it('clears the hover highlight when the pointer leaves the row for list space', async () => {
    const wrapper = mountMenu()
    const options = getOptions(wrapper)

    await options[1]?.trigger('mouseenter')
    expect(getActiveLabel(wrapper)).toBe('用户管理')

    await wrapper.get('.w-command-menu__list').trigger('mouseover')
    expect(wrapper.find('.is-hovered').exists()).toBe(false)
    expect(getActiveLabel(wrapper)).toBeUndefined()
  })

  it('clears stale hover when the keyboard moves the active row', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)
    const options = getOptions(wrapper)

    await options[1]?.trigger('mouseenter')
    expect(getActiveLabel(wrapper)).toBe('用户管理')

    await input.trigger('keydown', { key: 'ArrowDown' })

    expect(wrapper.findAll('.is-active')).toHaveLength(1)
    expect(wrapper.find('.is-hovered').exists()).toBe(false)
    expect(getActiveLabel(wrapper)).toBe('新建用户')
    expect(input.attributes('aria-activedescendant')).toBe(options[3]?.attributes('id'))
  })

  it('scrolls a group heading into view when the first item becomes active', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)
    const list = wrapper.get('.w-command-menu__list').element as HTMLElement

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains('w-command-menu__list')) return makeRect(0, 100)
      if (this.classList.contains('w-command-menu__group-label')) return makeRect(-30, -10)
      if (this.classList.contains('w-command-menu__item')) return makeRect(0, 20)
      return makeRect(0, 0)
    })

    list.scrollTop = 200
    await input.trigger('keydown', { key: 'End' })
    await nextTick()
    await nextTick()

    list.scrollTop = 200
    await input.trigger('keydown', { key: 'Home' })
    await nextTick()
    await nextTick()

    expect(getActiveLabel(wrapper)).toBe('工作台')
    // The first row's group label sits 30px above the viewport; Home must
    // scroll the label into view instead of leaving it clipped.
    expect(list.scrollTop).toBe(170)
  })

  it('warns about duplicate keys without throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const items: CommandMenuItem[] = [
      { key: 'dup', label: '第一项' },
      { key: 'dup', label: '第二项' },
    ]

    expect(() => mountMenu({ items })).not.toThrow()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate item key'))
    expect(warn.mock.calls[0]?.[0]).toContain('dup')
  })

  it('recalibrates the cursor when filtering changes the result set', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('系统设置')

    await input.setValue('用户')
    expect(getActiveLabel(wrapper)).toBeUndefined()

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('用户管理')

    await input.setValue('不存在')
    expect(getActiveLabel(wrapper)).toBeUndefined()

    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.emitted('update:value')).toBeUndefined()

    await input.setValue('')
    expect(getActiveLabel(wrapper)).toBeUndefined()

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('工作台')
  })

  it('updates the list and cursor when items change dynamically', async () => {
    const wrapper = mountMenu()
    await getInput(wrapper).setValue('用户')
    await getInput(wrapper).setValue('')

    await wrapper.setProps({ items: [{ key: 'only', label: '唯一命令' }] })
    await nextTick()

    expect(getLabels(wrapper)).toEqual(['唯一命令'])
    expect(getActiveLabel(wrapper)).toBeUndefined()

    await getInput(wrapper).trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('唯一命令')

    await wrapper.setProps({ items: [] })
    await nextTick()

    expect(wrapper.find('.w-command-menu__empty').exists()).toBe(true)

    await getInput(wrapper).trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBeUndefined()
  })

  it('ignores Enter during IME composition', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    await input.trigger('compositionstart')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')).toBeUndefined()

    await input.trigger('compositionend')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('also ignores Enter when the event reports isComposing', async () => {
    const wrapper = mountMenu()

    await getInput(wrapper).trigger('keydown', { key: 'Enter', isComposing: true })
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('clears the query on Escape by default and emits search', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    await input.setValue('工作')
    await input.trigger('keydown', { key: 'Escape' })

    expect(input.element.value).toBe('')
    expect(wrapper.emitted('escape')).toHaveLength(1)
    expect(wrapper.emitted('search')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('can close instead of clearing via escapeBehavior', async () => {
    const wrapper = mountMenu({ escapeBehavior: 'close' })
    const input = getInput(wrapper)

    await input.setValue('工作')
    await input.trigger('keydown', { key: 'Escape' })

    expect(input.element.value).toBe('工作')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('shows a clear button when searching and clears the query on click', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    expect(wrapper.find('.w-command-menu__clear').exists()).toBe(false)

    await input.setValue('工作')
    const clear = wrapper.get('.w-command-menu__clear')
    expect(clear.attributes('aria-label')).toBe('清除搜索')

    await clear.trigger('click')

    expect(input.element.value).toBe('')
    expect(wrapper.emitted('search')?.at(-1)).toEqual([''])
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.find('.w-command-menu__clear').exists()).toBe(false)
  })

  it('does not activate the highlighted command when Enter comes from an inner button', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    await input.setValue('用户')
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('用户管理')

    const clear = wrapper.get('.w-command-menu__clear')
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    clear.element.dispatchEvent(event)
    await nextTick()

    expect(wrapper.emitted('select')).toBeUndefined()
    expect(event.defaultPrevented).toBe(false)
    expect(input.element.value).toBe('用户')
  })

  it('uses fixed accessible labels for search and clear', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    expect(input.attributes('aria-label')).toBe('搜索命令')
    expect(wrapper.get('.w-command-menu__list').attributes('aria-label')).toBe('搜索命令')

    await input.setValue('work')

    const clear = wrapper.get('.w-command-menu__clear')
    expect(clear.attributes('aria-label')).toBe('清除搜索')
    expect(clear.attributes('title')).toBeUndefined()
  })

  it('tracks value as the selected item', async () => {
    const wrapper = mountMenu({ value: 'users' })

    const selected = getOptions(wrapper).find(
      (option) => option.attributes('aria-selected') === 'true',
    )
    expect(selected?.text()).toContain('用户管理')
    expect(selected?.classes()).toContain('is-selected')
    expect(selected?.find('.w-command-menu__check').exists()).toBe(false)

    await wrapper.setProps({ value: 'settings' })

    const nextSelected = getOptions(wrapper).find(
      (option) => option.attributes('aria-selected') === 'true',
    )
    expect(nextSelected?.text()).toContain('系统设置')
  })

  it('restores input focus after scrollbar interaction', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)
    const inputElement = input.element as HTMLInputElement

    inputElement.focus()
    inputElement.blur()
    expect(document.activeElement).toBe(document.body)

    await wrapper.get('.w-command-menu__list').trigger('mouseup')

    expect(document.activeElement).toBe(inputElement)

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(getActiveLabel(wrapper)).toBe('工作台')
  })

  it('focuses the input on mount when autoFocus is enabled', async () => {
    const wrapper = mountMenu({ autoFocus: true })
    await nextTick()

    expect(document.activeElement).toBe(wrapper.get('input').element)
  })

  it('renders text and component icons', () => {
    const wrapper = mountMenu({
      items: [
        { key: 'text', label: '文本图标', icon: 'N' },
        { key: 'component', label: '组件图标', icon: { template: '<svg data-icon />' } },
      ],
    })

    const icons = wrapper.findAll('.w-command-menu__item-icon')
    expect(icons[0]?.text()).toBe('N')
    expect(icons[1]?.find('[data-icon]').exists()).toBe(true)
  })

  it('supports a typed custom item slot', async () => {
    const wrapper = mountMenu(
      {},
      {
        slots: {
          item: (props: CommandMenuItemSlotProps) =>
            h(
              'span',
              {
                class: 'custom-item',
                'data-index': props.index,
                'data-active': String(props.active),
                'data-selected': String(props.selected),
                'data-disabled': String(props.disabled),
              },
              `${props.index}:${props.item.label}`,
            ),
        },
      },
    )

    const custom = wrapper.findAll('.custom-item')
    expect(custom).toHaveLength(baseItems.length)
    expect(custom[0]?.text()).toBe('0:工作台')
    expect(custom[0]?.attributes('data-active')).toBe('false')
    expect(custom[2]?.attributes('data-disabled')).toBe('true')

    await getInput(wrapper).trigger('keydown', { key: 'ArrowDown' })
    expect(custom[0]?.attributes('data-active')).toBe('true')

    await wrapper.findAll('.w-command-menu__item')[1]?.trigger('click')

    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ key: 'users' })
  })

  it('renders the footer slot below the list', () => {
    const wrapper = mountMenu(
      { classes: { footer: 'custom-footer-class' } },
      {
        slots: {
          footer: () => h('span', { class: 'custom-footer' }, '↑ ↓ 导航 · Enter 选择'),
        },
      },
    )

    const footer = wrapper.get('.w-command-menu__footer')
    expect(footer.classes()).toContain('custom-footer-class')
    expect(footer.get('.custom-footer').text()).toContain('Enter 选择')
  })

  it('supports a typed empty slot with the current query', async () => {
    const wrapper = mountMenu(
      {},
      {
        slots: {
          empty: (props: CommandMenuEmptySlotProps) =>
            h('span', { class: 'custom-empty' }, `没有结果：${props.query}`),
        },
      },
    )

    await getInput(wrapper).setValue('不存在的命令')

    expect(wrapper.get('.custom-empty').text()).toBe('没有结果：不存在的命令')
  })

  it('applies semantic classes and styles to internal parts', () => {
    const wrapper = mountMenu({
      classes: {
        root: 'custom-root',
        input: ['custom-input', { compact: true }],
        list: 'custom-list',
        group: 'custom-group',
        groupLabel: 'custom-group-label',
        item: 'custom-item',
      },
      styles: {
        root: { padding: '4px' },
        input: { letterSpacing: '0.02em' },
        list: { maxHeight: '120px' },
        item: { fontWeight: '600' },
      },
    })

    expect(wrapper.get('.w-command-menu').classes()).toContain('custom-root')
    expect(wrapper.get('.w-command-menu__input').classes()).toEqual(
      expect.arrayContaining(['custom-input', 'compact']),
    )
    expect(wrapper.get('.w-command-menu__list').classes()).toContain('custom-list')
    expect(wrapper.get('.w-command-menu__group').classes()).toContain('custom-group')
    expect(wrapper.get('.w-command-menu__group-label').classes()).toContain('custom-group-label')
    expect(wrapper.get('[role="option"]').classes()).toContain('custom-item')

    const root = wrapper.get('.w-command-menu').element as HTMLElement
    const input = wrapper.get('.w-command-menu__input').element as HTMLElement
    const list = wrapper.get('.w-command-menu__list').element as HTMLElement
    const item = wrapper.get('[role="option"]').element as HTMLElement
    expect(root.style.padding).toBe('4px')
    expect(input.style.letterSpacing).toBe('0.02em')
    expect(list.style.maxHeight).toBe('120px')
    expect(item.style.fontWeight).toBe('600')
  })

  it('accepts legacy Up/Down key names for keyboard navigation', async () => {
    const wrapper = mountMenu()
    const input = getInput(wrapper)

    expect(getActiveLabel(wrapper)).toBeUndefined()

    await input.trigger('keydown', { key: 'Down' })
    expect(getActiveLabel(wrapper)).toBe('工作台')

    await input.trigger('keydown', { key: 'Down' })
    expect(getActiveLabel(wrapper)).toBe('用户管理')

    await input.trigger('keydown', { key: 'Up' })
    expect(getActiveLabel(wrapper)).toBe('工作台')
  })
})
