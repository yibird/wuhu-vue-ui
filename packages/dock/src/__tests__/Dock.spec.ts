import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vite-plus/test'
import { h, nextTick } from 'vue'
import Dock from '../Dock.vue'
import type { DockItem, DockPosition } from '../types'

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

function mockRects(wrapper: ReturnType<typeof mount>, size = 48, gap = 8): void {
  wrapper.findAll('.w-dock__item').forEach((item, index) => {
    const offset = index * (size + gap)
    ;(item.element as HTMLElement).getBoundingClientRect = () => rect(offset, 0, size, size)
  })
}

function scaleOf(style: string | undefined): number {
  const match = /scale\(([\d.]+)\)/.exec(style ?? '')
  return match ? Number(match[1]) : Number.NaN
}

async function pointerMove(element: Element, clientX: number, clientY = 0): Promise<void> {
  element.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX, clientY }))
  // The component throttles pointer math through requestAnimationFrame.
  await new Promise((resolve) => setTimeout(resolve, 32))
  await nextTick()
}

const basicModel: DockItem[] = [
  { label: 'Home', icon: '/icons/home.png' },
  { label: 'Divider', separator: true },
  { label: 'Docs' },
  { label: 'Settings', disabled: true },
]

describe('Dock', () => {
  it('renders items, separators, images and accessibility attributes', () => {
    const wrapper = mount(Dock, {
      props: { model: basicModel, ariaLabel: 'Applications' },
    })

    const root = wrapper.get('.w-dock')
    expect(root.element.tagName).toBe('UL')
    expect(root.attributes('aria-label')).toBe('Applications')
    expect(wrapper.findAll('.w-dock__item')).toHaveLength(3)
    expect(wrapper.findAll('.w-dock__separator')).toHaveLength(1)
    expect(wrapper.get('.w-dock__separator').attributes('aria-hidden')).toBe('true')

    const items = wrapper.findAll('.w-dock__item')
    expect(items[0]?.attributes('aria-label')).toBe('Home')
    expect(items[0]?.find('.w-dock__image').attributes('src')).toBe('/icons/home.png')
    expect(items[1]?.find('.w-dock__fallback').text()).toBe('D')
    expect(items[2]?.attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('applies the position class', async () => {
    const wrapper = mount(Dock, {
      props: { model: [{ label: 'Home' }], position: 'bottom' },
    })

    expect(wrapper.get('.w-dock').classes()).toContain('w-dock--bottom')

    const positions: DockPosition[] = ['top', 'left', 'right']
    for (const position of positions) {
      await wrapper.setProps({ position })
      const classes = wrapper.get('.w-dock').classes()
      expect(classes).toContain(`w-dock--${position}`)
      expect(classes).not.toContain(
        `w-dock--${position === 'top' ? 'bottom' : position === 'left' ? 'right' : 'left'}`,
      )
    }

    wrapper.unmount()
  })

  it('emits select and runs commands', async () => {
    const command = vi.fn()
    const item: DockItem = { label: 'Home', command }
    const wrapper = mount(Dock, { props: { model: [item] } })

    await wrapper.get('.w-dock__item').trigger('click')

    expect(command).toHaveBeenCalledTimes(1)
    expect(command.mock.calls[0]?.[0]).toStrictEqual(item)
    expect(command.mock.calls[0]?.[1]).toBeInstanceOf(Event)
    expect(wrapper.emitted('select')?.[0]?.[0]).toStrictEqual(item)

    wrapper.unmount()
  })

  it('opens the url in the configured target when there is no command', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mount(Dock, {
      props: {
        model: [{ label: 'Docs', url: 'https://example.com/docs', target: '_blank' }],
      },
    })

    await wrapper.get('.w-dock__item').trigger('click')

    expect(open).toHaveBeenCalledWith('https://example.com/docs', '_blank', 'noopener,noreferrer')
    expect(wrapper.emitted('select')).toHaveLength(1)

    wrapper.unmount()
  })

  it('ignores disabled items', async () => {
    const command = vi.fn()
    const wrapper = mount(Dock, {
      props: {
        model: [{ label: 'Locked', disabled: true, command, url: 'https://example.com' }],
      },
    })

    const item = wrapper.get('.w-dock__item')
    expect(item.attributes('disabled')).toBeDefined()

    await item.trigger('click')

    expect(command).not.toHaveBeenCalled()
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.emitted('item-click')).toBeUndefined()

    wrapper.unmount()
  })

  it('magnifies items near the pointer with a smooth falloff', async () => {
    const wrapper = mount(Dock, {
      props: {
        model: [{ label: 'A' }, { label: 'B' }, { label: 'C' }],
      },
    })
    mockRects(wrapper)

    // Item centers are 24, 80 and 136. The pointer is closest to the second item.
    await pointerMove(wrapper.get('.w-dock').element, 90, 24)

    const tiles = wrapper.findAll('.w-dock__inner')
    const nearest = scaleOf(tiles[1]?.attributes('style'))
    const neighbour = scaleOf(tiles[0]?.attributes('style'))
    const farthest = scaleOf(tiles[2]?.attributes('style'))

    expect(nearest).toBeGreaterThan(1.5)
    expect(neighbour).toBeGreaterThan(1)
    expect(farthest).toBeGreaterThan(neighbour)
    expect(farthest).toBeLessThan(nearest)

    wrapper.unmount()
  })

  it('resets magnification when the pointer leaves', async () => {
    const wrapper = mount(Dock, {
      props: { model: [{ label: 'A' }, { label: 'B' }] },
    })
    mockRects(wrapper)

    await pointerMove(wrapper.get('.w-dock').element, 24, 24)
    expect(scaleOf(wrapper.findAll('.w-dock__inner')[0]?.attributes('style'))).toBeCloseTo(1.6, 2)

    await wrapper.get('.w-dock').trigger('pointerleave')
    expect(
      wrapper.findAll('.w-dock__inner').map((tile) => scaleOf(tile.attributes('style'))),
    ).toEqual([1, 1])

    wrapper.unmount()
  })

  it('does not magnify disabled items', async () => {
    const wrapper = mount(Dock, {
      props: {
        model: [{ label: 'A' }, { label: 'B', disabled: true }, { label: 'C' }],
      },
    })
    mockRects(wrapper)

    await pointerMove(wrapper.get('.w-dock').element, 80, 24)

    const scales = wrapper
      .findAll('.w-dock__inner')
      .map((tile) => scaleOf(tile.attributes('style')))
    expect(scales[1]).toBe(1)
    expect(scales[0]).toBeGreaterThan(1)
    expect(scales[2]).toBeGreaterThan(1)

    wrapper.unmount()
  })

  it('renders custom item slot content with index and active state', async () => {
    const wrapper = mount(Dock, {
      props: { model: [{ label: 'A' }, { label: 'B' }] },
      slots: {
        item: ({ item, index, active }: { item: DockItem; index: number; active: boolean }) =>
          h('span', { class: 'custom-item' }, `${item.label}-${index}-${active}`),
      },
    })

    const items = wrapper.findAll('.custom-item')
    expect(items.map((item) => item.text())).toEqual(['A-0-false', 'B-1-false'])

    await wrapper.findAll('.w-dock__item')[1]?.trigger('pointerenter')
    expect(wrapper.findAll('.custom-item')[1]?.text()).toBe('B-1-true')

    wrapper.unmount()
  })

  it('renders custom icon and tooltip slots', async () => {
    const wrapper = mount(Dock, {
      props: { model: [{ label: 'Home' }] },
      slots: {
        icon: ({ item }: { item: DockItem }) => h('span', { class: 'custom-icon' }, item.label),
        tooltip: ({ item }: { item: DockItem }) =>
          h('span', { class: 'custom-tip' }, `${item.label}!`),
      },
    })

    expect(wrapper.get('.custom-icon').text()).toBe('Home')
    expect(wrapper.find('.custom-tip').exists()).toBe(false)

    await wrapper.get('.w-dock__item').trigger('pointerenter')
    expect(wrapper.get('.custom-tip').text()).toBe('Home!')

    await wrapper.get('.w-dock').trigger('pointerleave')
    expect(wrapper.find('.custom-tip').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders an empty container without a model', () => {
    const wrapper = mount(Dock, { props: { model: [] } })

    expect(wrapper.find('.w-dock').exists()).toBe(true)
    expect(wrapper.findAll('.w-dock__item')).toHaveLength(0)
    expect(wrapper.findAll('.w-dock__separator')).toHaveLength(0)

    wrapper.unmount()
  })

  it('does not magnify when the user prefers reduced motion', async () => {
    const query = {
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList

    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => query),
    )

    try {
      const wrapper = mount(Dock, {
        props: { model: [{ label: 'A' }, { label: 'B' }] },
      })
      mockRects(wrapper)

      await pointerMove(wrapper.get('.w-dock').element, 48, 24)

      expect(
        wrapper.findAll('.w-dock__inner').map((tile) => scaleOf(tile.attributes('style'))),
      ).toEqual([1, 1])

      wrapper.unmount()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
