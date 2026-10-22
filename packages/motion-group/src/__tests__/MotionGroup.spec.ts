import { mount } from '@vue/test-utils'
import { TransitionGroup, h, nextTick, ref } from 'vue'
import { describe, expect, it } from 'vite-plus/test'
import MotionGroup from '../MotionGroup.vue'

type ElementHook = (element: Element) => void

function getHook(
  wrapper: ReturnType<typeof mount>,
  name: 'onBeforeEnter' | 'onBeforeLeave',
): ElementHook {
  const group = wrapper.findComponent(TransitionGroup)
  const hook = group.props(name) as ElementHook | undefined
  if (!hook) throw new Error(`Missing ${name} hook`)
  return hook
}

describe('MotionGroup', () => {
  it('renders the requested tag with preset classes', () => {
    const wrapper = mount(MotionGroup, {
      props: { animation: 'flip', tag: 'ul' },
      slots: {
        default: () => [h('li', { key: 'a' }, 'A')],
      },
      global: {
        stubs: { transition: false, 'transition-group': false },
      },
    })

    expect(wrapper.element.tagName).toBe('UL')
    expect(wrapper.classes()).toContain('w-motion-group')
    expect(wrapper.classes()).toContain('w-motion-group--flip')
    expect(wrapper.classes()).toContain('w-motion-group--vertical')
    expect(wrapper.classes()).toContain('w-motion-group--absolute-leave')
  })

  it('applies duration and direction', () => {
    const wrapper = mount(MotionGroup, {
      props: {
        animation: 'slide',
        direction: 'horizontal',
        duration: 320,
        moveDuration: 180,
      },
      slots: {
        default: () => [h('div', { key: 'a' }, 'A')],
      },
    })

    expect(wrapper.classes()).toContain('w-motion-group--horizontal')
    expect(wrapper.attributes('style')).toContain('--w-motion-duration: 320ms')
    expect(wrapper.attributes('style')).toContain('--w-motion-move-duration: 180ms')
  })

  it('follows the rendered list order when items move', async () => {
    const items = ref(['alpha', 'beta', 'gamma'])
    const wrapper = mount(MotionGroup, {
      props: { animation: 'bounce' },
      slots: {
        default: () => items.value.map((item) => h('div', { key: item }, item)),
      },
    })

    expect(wrapper.findAll('div').map((item) => item.text())).toEqual(['alpha', 'beta', 'gamma'])

    items.value = ['gamma', 'alpha', 'beta']
    await nextTick()

    expect(wrapper.findAll('div').map((item) => item.text())).toEqual(['gamma', 'alpha', 'beta'])
  })

  it('forwards class, style and arbitrary attributes to the wrapper', () => {
    const wrapper = mount(MotionGroup, {
      attrs: {
        class: 'card-grid',
        style: 'gap: 12px',
        'aria-label': 'Cards',
      },
      slots: {
        default: () => [h('div', { key: 'a' }, 'A')],
      },
    })

    expect(wrapper.classes()).toContain('card-grid')
    expect(wrapper.attributes('style')).toContain('gap: 12px')
    expect(wrapper.attributes('aria-label')).toBe('Cards')
  })

  it('marks disabled transitions while keeping the list rendered', () => {
    const wrapper = mount(MotionGroup, {
      props: { disabled: true, absoluteLeave: false },
      slots: {
        default: () => [h('div', { key: 'a' }, 'A')],
      },
    })

    expect(wrapper.classes()).toContain('w-motion-group--disabled')
    expect(wrapper.classes()).not.toContain('w-motion-group--absolute-leave')
    expect(wrapper.text()).toBe('A')
  })

  it('sets the move duration to zero while disabled so FLIP cannot run', async () => {
    const wrapper = mount(MotionGroup, {
      props: { disabled: true, duration: 320, moveDuration: 180 },
      slots: {
        default: () => [h('div', { key: 'a' }, 'A')],
      },
    })

    // TransitionGroup decides whether to run a move from the computed
    // transition duration, which reads this custom property.
    expect(wrapper.attributes('style')).toContain('--w-motion-move-duration: 0ms')
    expect(wrapper.classes()).toContain('w-motion-group--disabled')

    await wrapper.setProps({ disabled: false })

    expect(wrapper.attributes('style')).toContain('--w-motion-move-duration: 180ms')
    expect(wrapper.classes()).not.toContain('w-motion-group--disabled')
  })

  it('pins a leaving item to its measured position and size', () => {
    const wrapper = mount(MotionGroup, {
      props: { animation: 'fade' },
      slots: {
        default: () => [h('div', { key: 'a', class: 'item' }, 'A')],
      },
    })

    const root = wrapper.element as HTMLElement
    root.style.position = 'relative'
    root.style.border = '2px solid black'
    // Padding is part of the containing block's coordinate space: absolute
    // offsets are measured from the padding edge, so it must not be subtracted.
    root.style.padding = '10px'
    Object.defineProperty(root, 'scrollLeft', { configurable: true, value: 7 })
    Object.defineProperty(root, 'scrollTop', { configurable: true, value: 3 })

    const item = wrapper.get('.item').element as HTMLElement
    item.style.marginLeft = '5px'
    item.style.marginTop = '6px'

    root.getBoundingClientRect = () => ({ left: 20, top: 30, width: 400, height: 300 }) as DOMRect
    item.getBoundingClientRect = () => ({ left: 52, top: 62, width: 120, height: 48 }) as DOMRect

    getHook(wrapper, 'onBeforeLeave')(item)

    expect(item.style.position).toBe('absolute')
    // 52 - 20 (container) - 2 (border) + 7 (scroll) - 5 (margin)
    expect(item.style.left).toBe('32px')
    // 62 - 30 (container) - 2 (border) + 3 (scroll) - 6 (margin)
    expect(item.style.top).toBe('27px')
    expect(item.style.width).toBe('120px')
    expect(item.style.height).toBe('48px')
    expect(item.style.boxSizing).toBe('border-box')
  })

  it('restores inline styles when a leave is cancelled by a re-enter', () => {
    const wrapper = mount(MotionGroup, {
      props: { animation: 'fade' },
      slots: {
        default: () => [h('div', { key: 'a', class: 'item' }, 'A')],
      },
    })

    const root = wrapper.element as HTMLElement
    root.style.position = 'relative'
    const item = wrapper.get('.item').element as HTMLElement
    item.style.position = 'relative'

    root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 300 }) as DOMRect
    item.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 40 }) as DOMRect

    getHook(wrapper, 'onBeforeLeave')(item)
    expect(item.style.position).toBe('absolute')

    getHook(wrapper, 'onBeforeEnter')(item)
    expect(item.style.position).toBe('relative')
    expect(item.style.left).toBe('')
    expect(item.style.top).toBe('')
    expect(item.style.width).toBe('')
    expect(item.style.height).toBe('')
    expect(item.style.boxSizing).toBe('')
  })

  it('does not pin items when absoluteLeave or transitions are disabled', () => {
    const wrapper = mount(MotionGroup, {
      props: { disabled: true },
      slots: {
        default: () => [h('div', { key: 'a', class: 'item' }, 'A')],
      },
    })

    const item = wrapper.get('.item').element as HTMLElement
    getHook(wrapper, 'onBeforeLeave')(item)

    expect(item.style.position).toBe('')
    expect(item.style.width).toBe('')

    const offWrapper = mount(MotionGroup, {
      props: { absoluteLeave: false },
      slots: {
        default: () => [h('div', { key: 'b', class: 'item' }, 'B')],
      },
    })
    const offItem = offWrapper.get('.item').element as HTMLElement
    getHook(offWrapper, 'onBeforeLeave')(offItem)

    expect(offItem.style.position).toBe('')
    expect(offItem.style.width).toBe('')
  })
})
