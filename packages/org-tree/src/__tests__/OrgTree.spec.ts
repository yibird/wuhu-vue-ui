import { flushPromises, mount } from '@vue/test-utils'
import { h, nextTick, reactive, toRaw } from 'vue'
import { describe, expect, it, vi } from 'vite-plus/test'
import OrgTree from '../OrgTree.vue'
import type { OrgTreeInstance, OrgTreeNode } from '../types'

function createTree(): OrgTreeNode[] {
  return [
    {
      id: 'root',
      label: 'Root',
      children: [
        {
          id: 'a',
          label: 'A',
          children: [{ id: 'a1', label: 'A1', children: [{ id: 'a2', label: 'A2' }] }],
        },
        { id: 'b', label: 'B' },
      ],
    },
  ]
}

function firePointer(target: EventTarget, type: string, init: Record<string, unknown> = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, {
    button: 0,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    ...init,
  })
  target.dispatchEvent(event)
  return event
}

const dataKey = (id: string | number) => `${typeof id}:${String(id)}`

function card(wrapper: ReturnType<typeof mount>, id: string | number) {
  return wrapper.get(`.w-org-tree__node-card[data-org-key="${dataKey(id)}"]`)
}

function toggle(wrapper: ReturnType<typeof mount>, id: string | number) {
  return wrapper.get(`.w-org-tree__node[data-org-key="${dataKey(id)}"] .w-org-tree__toggle`)
}

function mountTree(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  return mount(OrgTree, {
    props: { data: createTree(), ...props },
    attachTo: document.body,
    ...options,
  })
}

describe('OrgTree', () => {
  it('renders the tree, root role and treeitem semantics', () => {
    const wrapper = mountTree()

    expect(wrapper.find('[role="tree"]').exists()).toBe(true)
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(4)
    expect(wrapper.text()).toContain('Root')
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('B')
    wrapper.unmount()
  })

  it('expands down to defaultExpandLevel and honours node.expand', () => {
    const wrapper = mountTree({ defaultExpandLevel: 1 })
    expect(wrapper.findAll('.w-org-tree__node-card')).toHaveLength(3)
    expect(wrapper.find(`[data-org-key="${dataKey('a1')}"]`).exists()).toBe(false)
    wrapper.unmount()

    const data = createTree()
    data[0]!.expand = true
    data[0]!.children![0]!.expand = true
    const explicit = mountTree({ data, defaultExpandLevel: 0 })
    expect(explicit.findAll('.w-org-tree__node-card')).toHaveLength(4)
    expect(explicit.find(`[data-org-key="${dataKey('a1')}"]`).exists()).toBe(true)
    expect(explicit.find(`[data-org-key="${dataKey('a2')}"]`).exists()).toBe(false)
    explicit.unmount()
  })

  it('supports defaultExpandKeys', () => {
    const wrapper = mountTree({ defaultExpandLevel: 1, defaultExpandKeys: ['a'] })

    expect(wrapper.find(`[data-org-key="${dataKey('a1')}"]`).exists()).toBe(true)
    expect(wrapper.find(`[data-org-key="${dataKey('a2')}"]`).exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits expand with the state and update:expandKeys', async () => {
    const wrapper = mountTree()
    const node = createTree()[0]!

    await toggle(wrapper, 'root').trigger('click')

    expect(wrapper.emitted('expand')?.[0]).toEqual([node, false])
    expect(wrapper.emitted('update:expandKeys')?.[0]).toEqual([['a']])
    expect(wrapper.findAll('.w-org-tree__node-card')).toHaveLength(1)

    await toggle(wrapper, 'root').trigger('click')
    expect(wrapper.emitted('expand')?.[1]).toEqual([node, true])
    wrapper.unmount()
  })

  it('renders an accessible expand trigger on the connector, outside the node card', () => {
    const wrapper = mountTree()

    expect(card(wrapper, 'root').find('.w-org-tree__toggle').exists()).toBe(false)
    const control = wrapper
      .get(`.w-org-tree__node[data-org-key="${dataKey('root')}"] > .w-org-tree__node-head`)
      .get('.w-org-tree__toggle-wrap')
      .get('.w-org-tree__toggle')

    expect(control.element.tagName).toBe('BUTTON')
    expect(control.attributes('tabindex')).toBe('-1')
    expect(control.attributes('aria-expanded')).toBe('true')
    expect(control.attributes('aria-label')).toBe('收起')
    expect(card(wrapper, 'root').attributes('aria-expanded')).toBe('true')

    wrapper.unmount()
  })

  it('does not start node dragging from the expand trigger', async () => {
    const wrapper = mountTree({ nodeDraggable: true })
    const control = toggle(wrapper, 'root')

    firePointer(control.element, 'pointerdown')
    firePointer(window, 'pointermove', { clientX: 20, clientY: 20 })
    firePointer(window, 'pointerup')
    await nextTick()

    expect(wrapper.emitted('node-drag-start')).toBeUndefined()

    await control.trigger('click')
    expect(wrapper.emitted('expand')).toHaveLength(1)

    wrapper.unmount()
  })

  it('preserves expansion state when data updates', async () => {
    const data = reactive(createTree())
    const wrapper = mountTree({ data })

    await toggle(wrapper, 'root').trigger('click')
    expect(wrapper.find(`[data-org-key="${dataKey('a')}"]`).exists()).toBe(false)

    await wrapper.setProps({ data: [...data, { id: 'other', label: 'Other' }] })

    expect(wrapper.find(`[data-org-key="${dataKey('a')}"]`).exists()).toBe(false)
    expect(card(wrapper, 'other').text()).toContain('Other')
    wrapper.unmount()
  })

  it('keeps controlled expandKeys authoritative', async () => {
    const wrapper = mountTree({ expandKeys: ['root'], defaultExpandLevel: 2 })

    expect(wrapper.find(`[data-org-key="${dataKey('a1')}"]`).exists()).toBe(false)

    await toggle(wrapper, 'a').trigger('click')

    expect(wrapper.emitted('update:expandKeys')?.[0]).toEqual([['root', 'a']])
    // The parent has not updated the prop, so the view must not expand.
    expect(wrapper.find(`[data-org-key="${dataKey('a1')}"]`).exists()).toBe(false)

    await wrapper.setProps({ expandKeys: ['root', 'a'] })
    expect(wrapper.find(`[data-org-key="${dataKey('a1')}"]`).exists()).toBe(true)
    wrapper.unmount()
  })

  it('selects nodes and ignores interactive custom content', async () => {
    const wrapper = mountTree(
      {},
      {
        slots: {
          node: ({ node }: { node: OrgTreeNode }) =>
            h('span', { class: 'custom-node' }, [
              h('i', { class: 'custom-icon' }, String(node.label)),
              h('button', { class: 'custom-button', type: 'button' }, 'action'),
            ]),
        },
      },
    )

    await wrapper.get('.custom-icon').trigger('click')

    expect(wrapper.emitted('node-click')?.[0]?.[0]).toEqual(createTree()[0])
    expect(wrapper.emitted('update:selectedKey')?.[0]).toEqual(['root'])
    expect(card(wrapper, 'root').classes()).toContain('is-selected')

    await wrapper.get('.custom-button').trigger('click')
    firePointer(wrapper.get('.custom-button').element, 'pointerdown')
    firePointer(window, 'pointermove', { clientX: 20, clientY: 20 })
    firePointer(window, 'pointerup', { clientX: 20, clientY: 20 })
    await nextTick()

    expect(wrapper.emitted('node-click')).toHaveLength(1)
    expect(wrapper.emitted('node-drag-start')).toBeUndefined()
    expect(wrapper.emitted('node-drag-end')).toBeUndefined()
    wrapper.unmount()
  })

  it('teleports the viewport-clamped context menu and emits menu-click', async () => {
    const wrapper = mountTree()

    await card(wrapper, 'a').trigger('contextmenu', { clientX: 48, clientY: 52 })
    await nextTick()

    expect(wrapper.emitted('node-contextmenu')?.[0]?.[0]).toEqual(createTree()[0]!.children![0])
    const menu = document.querySelector<HTMLElement>('.w-org-tree__menu')
    expect(menu).not.toBeNull()
    // Teleporting outside the component keeps transformed ancestors from
    // becoming the fixed-position containing block.
    expect(wrapper.element.contains(menu)).toBe(false)
    expect(menu!.style.left).toBe('48px')
    expect(menu!.style.top).toBe('52px')
    expect(document.querySelectorAll('.w-org-tree__menu-item')).toHaveLength(3)

    document.querySelector<HTMLButtonElement>('.w-org-tree__menu-item')!.click()
    await nextTick()
    expect(wrapper.emitted('menu-click')?.[0]).toEqual(['edit', createTree()[0]!.children![0]])
    expect(document.querySelector('.w-org-tree__menu')).toBeNull()
    wrapper.unmount()
  })

  it('applies semantic classes and styles to internal parts', () => {
    const wrapper = mountTree({
      classes: {
        root: 'custom-root',
        viewport: 'custom-viewport',
        canvas: 'custom-canvas',
        node: 'custom-node',
        card: 'custom-card',
        label: 'custom-label',
        toggle: 'custom-toggle',
        children: 'custom-children',
      },
      styles: {
        root: { color: 'rgb(1, 2, 3)' },
        card: { opacity: '0.9' },
        label: { color: 'red' },
        toggle: { width: '20px' },
      },
    })

    expect(wrapper.classes()).toContain('custom-root')
    expect(wrapper.get('.w-org-tree__viewport').classes()).toContain('custom-viewport')
    expect(wrapper.get('.w-org-tree__canvas').classes()).toContain('custom-canvas')
    expect(wrapper.get('.w-org-tree__node').classes()).toContain('custom-node')
    expect(wrapper.get('.w-org-tree__node-card').classes()).toContain('custom-card')
    expect(wrapper.get('.w-org-tree__label').classes()).toContain('custom-label')
    expect(wrapper.get('.w-org-tree__toggle').classes()).toContain('custom-toggle')
    expect(wrapper.get('.w-org-tree__children').classes()).toContain('custom-children')

    expect((wrapper.get('.w-org-tree').element as HTMLElement).style.color).toBe('rgb(1, 2, 3)')
    expect((wrapper.get('.w-org-tree__node-card').element as HTMLElement).style.opacity).toBe('0.9')
    expect((wrapper.get('.w-org-tree__label').element as HTMLElement).style.color).toBe('red')
    expect((wrapper.get('.w-org-tree__toggle').element as HTMLElement).style.width).toBe('20px')
    wrapper.unmount()
  })

  it('applies semantic classes and styles to the empty state', () => {
    const wrapper = mountTree({
      data: [],
      classes: { empty: 'custom-empty' },
      styles: { empty: { color: 'red' } },
    })

    const empty = wrapper.get('.w-org-tree__empty')
    expect(empty.classes()).toContain('custom-empty')
    expect((empty.element as HTMLElement).style.color).toBe('red')
    wrapper.unmount()
  })

  it('applies semantic classes and styles to the context menu', async () => {
    const wrapper = mountTree({
      classes: { menu: 'custom-menu', menuItem: 'custom-menu-item' },
      styles: { menu: { opacity: '0.9' }, menuItem: { color: 'red' } },
    })

    await card(wrapper, 'a').trigger('contextmenu', { clientX: 10, clientY: 10 })

    const menu = document.querySelector<HTMLElement>('.w-org-tree__menu')
    const item = document.querySelector<HTMLElement>('.w-org-tree__menu-item')

    expect(menu?.classList.contains('custom-menu')).toBe(true)
    expect(menu?.style.opacity).toBe('0.9')
    expect(item?.classList.contains('custom-menu-item')).toBe(true)
    expect(item?.style.color).toBe('red')
    wrapper.unmount()
  })

  it('disables the context menu with contextMenu=false', async () => {
    const wrapper = mountTree({ contextMenu: false })

    await card(wrapper, 'root').trigger('contextmenu', { clientX: 10, clientY: 10 })
    await nextTick()

    expect(document.querySelector('.w-org-tree__menu')).toBeNull()
    expect(wrapper.emitted('node-contextmenu')).toBeUndefined()
    wrapper.unmount()
  })

  it('clamps zoom to minScale and maxScale', () => {
    const wrapper = mountTree({ minScale: 0.5, maxScale: 2 })
    const vm = wrapper.vm as unknown as OrgTreeInstance

    expect(vm.scale).toBe(1)
    for (let index = 0; index < 20; index += 1) vm.zoomIn()
    expect(vm.scale).toBe(2)

    for (let index = 0; index < 30; index += 1) vm.zoomOut()
    expect(vm.scale).toBe(0.5)

    expect(wrapper.emitted('zoom')).toBeTruthy()
    wrapper.unmount()
  })

  it('zooms with the wheel respecting scalable', async () => {
    const wrapper = mountTree()
    const vm = wrapper.vm as unknown as OrgTreeInstance

    await wrapper.get('.w-org-tree__viewport').trigger('wheel', { deltaY: -100 })
    expect(vm.scale).toBeGreaterThan(1)

    const disabled = mountTree({ scalable: false })
    await disabled.get('.w-org-tree__viewport').trigger('wheel', { deltaY: -100 })
    expect((disabled.vm as unknown as OrgTreeInstance).scale).toBe(1)
    wrapper.unmount()
    disabled.unmount()
  })

  it('pans the canvas 1:1 with pointer movement', async () => {
    const wrapper = mountTree()
    const viewport = wrapper.get('.w-org-tree__viewport')

    firePointer(viewport.element, 'pointerdown', { clientX: 100, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: 130, clientY: 160 })
    firePointer(window, 'pointerup', { clientX: 130, clientY: 160 })

    const vm = wrapper.vm as unknown as OrgTreeInstance
    expect(vm.translate.x).toBe(30)
    expect(vm.translate.y).toBe(60)
    expect(wrapper.emitted('pan')?.at(-1)).toEqual([{ x: 30, y: 60 }])
    wrapper.unmount()
  })

  it('does not pan when draggable is false', () => {
    const wrapper = mountTree({ draggable: false })
    const viewport = wrapper.get('.w-org-tree__viewport')

    firePointer(viewport.element, 'pointerdown', { clientX: 10, clientY: 10 })
    firePointer(window, 'pointermove', { clientX: 50, clientY: 50 })
    firePointer(window, 'pointerup', { clientX: 50, clientY: 50 })

    expect((wrapper.vm as unknown as OrgTreeInstance).translate.x).toBe(0)
    expect(wrapper.emitted('pan')).toBeUndefined()
    wrapper.unmount()
  })

  it('reparents dragged nodes by moving the original object', async () => {
    const first: OrgTreeNode = { id: 'p', label: 'P', children: [] }
    const moved: OrgTreeNode = { id: 'q', label: 'Q' }
    const data = reactive<OrgTreeNode[]>([first, moved])
    const wrapper = mountTree({ data, nodeDraggable: true })

    firePointer(card(wrapper, 'q').element, 'pointerdown', { clientX: 0, clientY: 0 })
    firePointer(card(wrapper, 'p').element, 'pointermove', { clientX: 12, clientY: 12 })
    firePointer(card(wrapper, 'p').element, 'pointerup', { clientX: 12, clientY: 12 })
    await flushPromises()
    await nextTick()

    expect(data).toHaveLength(1)
    expect(toRaw(data[0]!)).toBe(first)
    expect(data[0]!.children).toHaveLength(1)
    expect(toRaw(data[0]!.children![0]!)).toBe(moved)

    const ids = wrapper
      .findAll('.w-org-tree__node-card')
      .map((node) => node.attributes('data-org-key'))
    expect(new Set(ids).size).toBe(ids.length)
    expect(toRaw(wrapper.emitted('node-drag-start')?.[0]?.[0] as OrgTreeNode)).toBe(moved)
    expect(wrapper.emitted('node-drag-end')?.[0]?.[0]).toMatchObject({
      node: moved,
      parent: first,
      canceled: false,
      changed: true,
    })
    wrapper.unmount()
  })

  it('cancels a reparent when beforeDragEnd returns false', async () => {
    const data = reactive<OrgTreeNode[]>([
      { id: 'p', label: 'P' },
      { id: 'q', label: 'Q' },
    ])
    const beforeDragEnd = vi.fn(() => false)
    const wrapper = mountTree({ data, nodeDraggable: true, beforeDragEnd })

    firePointer(card(wrapper, 'q').element, 'pointerdown')
    firePointer(card(wrapper, 'p').element, 'pointermove', { clientX: 10, clientY: 10 })
    firePointer(card(wrapper, 'p').element, 'pointerup', { clientX: 10, clientY: 10 })
    await flushPromises()

    expect(beforeDragEnd).toHaveBeenCalledTimes(1)
    expect(data).toHaveLength(2)
    expect(wrapper.emitted('node-drag-end')?.[0]?.[0]).toMatchObject({
      canceled: true,
      changed: false,
    })
    wrapper.unmount()
  })

  it('ignores drops on blank canvas when dropOnEmpty is false', async () => {
    const data = reactive(createTree())
    const wrapper = mountTree({ data, nodeDraggable: true, dropOnEmpty: false })
    const viewport = wrapper.get('.w-org-tree__viewport').element

    firePointer(card(wrapper, 'a').element, 'pointerdown')
    firePointer(viewport, 'pointermove', { clientX: 20, clientY: 20 })
    firePointer(viewport, 'pointerup', { clientX: 20, clientY: 20 })
    await flushPromises()

    expect(data[0]!.children?.[0]?.id).toBe('a')
    expect(wrapper.emitted('node-drag-end')?.[0]?.[0]).toMatchObject({
      canceled: true,
      changed: false,
    })
    wrapper.unmount()
  })

  it('cancels drops onto the node itself, its parent or a descendant', async () => {
    const data = reactive(createTree())
    const wrapper = mountTree({ data, nodeDraggable: true })

    const dragAndDrop = async (source: string, target: string) => {
      firePointer(card(wrapper, source).element, 'pointerdown')
      firePointer(card(wrapper, target).element, 'pointermove', { clientX: 10, clientY: 10 })
      firePointer(card(wrapper, target).element, 'pointerup', { clientX: 10, clientY: 10 })
      await flushPromises()
    }

    await dragAndDrop('a', 'a')
    expect(wrapper.emitted('node-drag-end')?.[0]?.[0]).toMatchObject({ canceled: true })

    await dragAndDrop('a', 'root')
    expect(wrapper.emitted('node-drag-end')?.[1]?.[0]).toMatchObject({ canceled: true })

    await dragAndDrop('a', 'a1')
    expect(wrapper.emitted('node-drag-end')?.[2]?.[0]).toMatchObject({ canceled: true })

    expect(data[0]!.children?.[0]?.id).toBe('a')
    wrapper.unmount()
  })

  it('does not drag nodes when nodeDraggable is false', async () => {
    const data = reactive<OrgTreeNode[]>([
      { id: 'p', label: 'P' },
      { id: 'q', label: 'Q' },
    ])
    const wrapper = mountTree({ data })

    firePointer(card(wrapper, 'q').element, 'pointerdown')
    firePointer(card(wrapper, 'p').element, 'pointermove', { clientX: 10, clientY: 10 })
    firePointer(card(wrapper, 'p').element, 'pointerup', { clientX: 10, clientY: 10 })
    await flushPromises()

    expect(wrapper.emitted('node-drag-start')).toBeUndefined()
    expect(data).toHaveLength(2)
    wrapper.unmount()
  })

  it('renders duplicate ids only once', () => {
    const wrapper = mountTree({
      data: [
        { id: 'dup', label: 'First' },
        { id: 'dup', label: 'Second' },
      ],
    })

    expect(wrapper.findAll('.w-org-tree__node-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('First')
    expect(wrapper.text()).not.toContain('Second')
    wrapper.unmount()
  })

  it('keeps numeric and string ids distinct', async () => {
    const wrapper = mountTree({
      data: [
        { id: 1, label: 'Numeric one' },
        { id: '1', label: 'String one' },
      ],
    })

    expect(wrapper.findAll('.w-org-tree__node-card')).toHaveLength(2)
    await card(wrapper, '1').trigger('click')
    expect(wrapper.emitted('update:selectedKey')?.[0]).toEqual(['1'])

    await card(wrapper, 1).trigger('click')
    expect(wrapper.emitted('update:selectedKey')?.[1]).toEqual([1])
    wrapper.unmount()
  })

  it('skips nodes without a usable id or label', () => {
    const wrapper = mountTree({
      data: [
        { id: 'ok', label: 'OK' },
        { label: 'Missing id' },
        { id: 'missing-label' },
        null,
        42,
      ] as unknown as OrgTreeNode[],
    })

    expect(wrapper.findAll('.w-org-tree__node-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('OK')
    expect(wrapper.text()).not.toContain('Missing id')
    wrapper.unmount()
  })

  it('does not wrap arrow navigation at the list ends', async () => {
    const wrapper = mountTree()
    const cards = wrapper.findAll('.w-org-tree__node-card')
    const firstKey = cards[0]!.attributes('data-org-key')
    const lastKey = cards[cards.length - 1]!.attributes('data-org-key')

    await cards[0]!.trigger('focusin')
    await cards[0]!.trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    expect((document.activeElement as HTMLElement).dataset.orgKey).toBe(firstKey)

    await cards[cards.length - 1]!.trigger('focusin')
    await cards[cards.length - 1]!.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect((document.activeElement as HTMLElement).dataset.orgKey).toBe(lastKey)

    wrapper.unmount()
  })

  it('exposes a roving tabindex and restores focus after the context menu closes', async () => {
    const wrapper = mountTree()
    const cards = wrapper.findAll('.w-org-tree__node-card')
    expect(cards.map((item) => item.attributes('tabindex'))).toEqual(['0', '-1', '-1', '-1'])

    await cards[1]!.trigger('focusin')
    expect(cards.map((item) => item.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1'])

    const trigger = card(wrapper, 'a')
    await trigger.trigger('contextmenu', { clientX: 48, clientY: 52 })
    await nextTick()
    expect(document.activeElement).not.toBe(trigger.element)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(trigger.element)
    wrapper.unmount()
  })

  it('supports custom id, label and children fields', async () => {
    const wrapper = mountTree({
      data: [
        {
          value: 'custom-root',
          name: 'Custom Root',
          items: [{ value: 'custom-child', name: 'Custom Child' }],
        } as unknown as OrgTreeNode,
      ],
      keys: { id: 'value', label: 'name', children: 'items' },
    })

    expect(wrapper.text()).toContain('Custom Root')
    expect(wrapper.text()).toContain('Custom Child')

    await card(wrapper, 'custom-child').trigger('click')
    expect(wrapper.emitted('update:selectedKey')?.[0]).toEqual(['custom-child'])
    wrapper.unmount()
  })

  it('applies the default and custom minimum height', () => {
    const wrapper = mountTree()
    expect(wrapper.attributes('style')).toContain('min-height: 400px')
    wrapper.unmount()

    const custom = mountTree({ minHeight: 520 })
    expect(custom.attributes('style')).toContain('min-height: 520px')
    custom.unmount()

    const css = mountTree({ minHeight: '60vh' })
    expect(css.attributes('style')).toContain('min-height: 60vh')
    css.unmount()
  })

  it('applies the horizontal layout modifier', () => {
    const wrapper = mountTree({ horizontal: true })
    expect(wrapper.classes()).toContain('is-horizontal')
    expect(wrapper.find('.w-org-tree__children').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders the empty state and empty slot', () => {
    const wrapper = mountTree({ data: [], emptyText: '没有数据' })
    expect(wrapper.get('.w-org-tree__empty').text()).toBe('没有数据')
    wrapper.unmount()

    const slotted = mountTree(
      { data: [] },
      { slots: { empty: () => h('span', { class: 'custom-empty' }, '自定义空状态') } },
    )
    expect(slotted.get('.custom-empty').text()).toBe('自定义空状态')
    slotted.unmount()
  })
})
