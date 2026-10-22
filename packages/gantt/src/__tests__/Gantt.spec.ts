import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'
import { nextTick } from 'vue'
import Gantt from '../Gantt.vue'
import type { GanttContextMenuSelectEvent, GanttTask } from '../types'

const tasks: GanttTask[] = [
  {
    id: 'group',
    name: 'Group',
    children: [
      {
        id: 'a',
        name: 'Task A',
        start: '2026-10-01',
        end: '2026-10-04',
        progress: 40,
        color: '#4f46e5',
      },
      {
        id: 'b',
        name: 'Task B',
        start: '2026-10-05',
        end: '2026-10-08',
        progress: 80,
        dependencies: ['a'],
      },
    ],
  },
]

function mountGantt(extraProps: Record<string, unknown> = {}) {
  return mount(Gantt, {
    props: {
      tasks,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      view: 'day',
      ...extraProps,
    },
    attachTo: document.body,
  })
}

function firePointer(target: EventTarget, type: string, init: Record<string, unknown>) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, {
    button: 0,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    ...init,
  })
  target.dispatchEvent(event)
}

async function openContextMenu(wrapper: ReturnType<typeof mountGantt>, index = 1) {
  const rows = wrapper.findAll('.w-gantt__sidebar')
  await rows[index]!.trigger('contextmenu', { clientX: 120, clientY: 90 })
  await nextTick()
}

describe('Gantt', () => {
  it('renders a row per visible task', () => {
    const wrapper = mountGantt()
    expect(wrapper.findAll('.w-gantt__row')).toHaveLength(3)
    expect(wrapper.findAll('.w-gantt__bar')).toHaveLength(3)
    expect(wrapper.text()).toContain('Group')
    expect(wrapper.text()).toContain('Task A')
    wrapper.unmount()
  })

  it('collapses and expands groups', async () => {
    const wrapper = mountGantt()
    const toggle = wrapper.get('.w-gantt__toggle')

    await toggle.trigger('click')
    expect(wrapper.findAll('.w-gantt__row')).toHaveLength(1)
    expect(wrapper.emitted('expand')?.[0]).toEqual([tasks[0], false])

    await wrapper.get('.w-gantt__toggle').trigger('click')
    expect(wrapper.findAll('.w-gantt__row')).toHaveLength(3)
    expect(wrapper.emitted('expand')?.[1]).toEqual([tasks[0], true])
    wrapper.unmount()
  })

  it('renders dependency paths', () => {
    const wrapper = mountGantt()
    expect(wrapper.findAll('.w-gantt__dependency-path')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits selection changes when a task is clicked', async () => {
    const wrapper = mountGantt()
    const bars = wrapper.findAll('.w-gantt__bar')
    await bars[1]!.trigger('click')

    expect(wrapper.emitted('update:selected')?.[0]).toEqual(['a'])
    expect(wrapper.emitted('task-click')?.[0]?.[0]).toEqual(tasks[0]?.children?.[0])
    wrapper.unmount()
  })

  const contextMenuItems = [
    { key: 'edit', label: '编辑', shortcut: 'E' },
    { key: 'divider', divider: true },
    { key: 'delete', label: '删除', danger: true },
  ]

  it('opens a context menu on task right-click', async () => {
    const wrapper = mountGantt({ contextMenuItems })
    await openContextMenu(wrapper)

    expect(wrapper.emitted('task-contextmenu')).toHaveLength(1)
    expect(wrapper.emitted('task-contextmenu')?.[0]?.[0]).toEqual(tasks[0]?.children?.[0])
    expect(wrapper.emitted('update:selected')?.[0]).toEqual(['a'])
    expect(wrapper.find('.w-gantt__context-menu').exists()).toBe(true)
    expect(wrapper.findAll('.w-gantt__context-menu-item')).toHaveLength(2)
    expect(wrapper.find('.w-gantt__context-menu-divider').exists()).toBe(true)
    wrapper.unmount()
  })

  it('supports context menu item factories', async () => {
    const wrapper = mountGantt({
      contextMenuItems: (task: GanttTask) => [{ key: 'rename', label: `重命名 ${task.name}` }],
    })
    await openContextMenu(wrapper)

    expect(wrapper.get('.w-gantt__context-menu-item').text()).toBe('重命名 Task A')
    wrapper.unmount()
  })

  it('emits context-menu-select and closes after choosing an item', async () => {
    const wrapper = mountGantt({ contextMenuItems })
    await openContextMenu(wrapper)

    await wrapper.findAll('.w-gantt__context-menu-item')[0]!.trigger('click')

    const event = wrapper.emitted('context-menu-select')?.[0]?.[0] as GanttContextMenuSelectEvent
    expect(event.item.key).toBe('edit')
    expect(event.task).toEqual(tasks[0]?.children?.[0])
    expect(wrapper.find('.w-gantt__context-menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('closes the context menu on Escape and outside pointerdown', async () => {
    const wrapper = mountGantt({ contextMenuItems })
    await openContextMenu(wrapper)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('.w-gantt__context-menu').exists()).toBe(false)

    await openContextMenu(wrapper)
    window.dispatchEvent(new Event('pointerdown'))
    await nextTick()
    expect(wrapper.find('.w-gantt__context-menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits task-contextmenu without configured items and keeps the native menu', async () => {
    const wrapper = mountGantt()
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 40,
      clientY: 60,
    })

    wrapper.findAll('.w-gantt__sidebar')[1]!.element.dispatchEvent(event)
    await nextTick()

    expect(wrapper.emitted('task-contextmenu')).toHaveLength(1)
    expect(wrapper.find('.w-gantt__context-menu').exists()).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    wrapper.unmount()
  })

  it('switches view density and uses the supplied range', async () => {
    const wrapper = mountGantt()
    const headers = wrapper.findAll('.w-gantt__header-cell--secondary')
    expect(headers).toHaveLength(31)

    await wrapper.setProps({ view: 'week' })
    expect(wrapper.findAll('.w-gantt__header-cell--secondary').length).toBeLessThan(31)
    wrapper.unmount()
  })

  it('renders an empty state', () => {
    const wrapper = mount(Gantt, {
      props: {
        tasks: [],
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      },
      attachTo: document.body,
    })

    expect(wrapper.find('.w-gantt__empty').exists()).toBe(true)
    wrapper.unmount()
  })

  it('supports keyboard move and resize', async () => {
    const wrapper = mountGantt()
    const bar = wrapper.findAll('.w-gantt__bar')[1]!

    await bar.trigger('keydown', { key: 'ArrowRight' })
    await bar.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    await bar.trigger('keydown', { key: 'ArrowRight', altKey: true })

    const updates = wrapper.emitted('task-update') ?? []
    const modes = updates.map((entry) => (entry[0] as { mode: string } | undefined)?.mode)
    expect(modes).toEqual(['move', 'resize-end', 'resize-start'])
    wrapper.unmount()
  })

  it('maps the left and right resize handles to the correct drag modes', async () => {
    const wrapper = mountGantt()
    const handle = wrapper.get('.w-gantt__bar.is-draggable .w-gantt__resize-handle.is-start')

    firePointer(handle.element, 'pointerdown', { clientX: 100 })
    firePointer(window, 'pointermove', { clientX: 136 })
    firePointer(window, 'pointerup', { clientX: 136 })
    await nextTick()

    const update = wrapper.emitted('task-update')?.[0]?.[0] as
      | { mode: string; start: Date; end: Date }
      | undefined
    expect(update?.mode).toBe('resize-start')
    expect(update?.start.getDate()).toBe(2)
    expect(update?.end.getDate()).toBe(4)
    wrapper.unmount()
  })

  it('does not emit updates for a no-op drag', async () => {
    const wrapper = mountGantt()
    const handle = wrapper.get('.w-gantt__bar.is-draggable .w-gantt__resize-handle.is-end')

    firePointer(handle.element, 'pointerdown', { clientX: 100 })
    firePointer(window, 'pointerup', { clientX: 100 })
    await nextTick()

    expect(wrapper.emitted('task-update')).toBeUndefined()
    const dragEnd = wrapper.emitted('task-drag-end')?.[0]?.[0] as { changed: boolean } | undefined
    expect(dragEnd?.changed).toBe(false)
    wrapper.unmount()
  })

  it('does not start a drag or change dates before the pointer threshold', async () => {
    const wrapper = mountGantt()
    // Task A's bar. clientX 100 is inside the right edge auto-scroll band in
    // jsdom (all layout rects are zero), reproducing the reported scenario.
    const bar = wrapper.findAll('.w-gantt__bar')[1]!

    firePointer(bar.element, 'pointerdown', { clientX: 100 })
    await nextTick()

    expect(wrapper.emitted('task-drag-start')).toBeUndefined()

    firePointer(window, 'pointermove', { clientX: 102 })
    firePointer(window, 'pointerup', { clientX: 102 })
    await nextTick()

    expect(wrapper.emitted('task-drag-start')).toBeUndefined()
    expect(wrapper.emitted('task-drag')).toBeUndefined()
    expect(wrapper.emitted('task-update')).toBeUndefined()
    const dragEnd = wrapper.emitted('task-drag-end')?.[0]?.[0] as { changed: boolean } | undefined
    expect(dragEnd?.changed).toBe(false)
    wrapper.unmount()
  })

  it('starts dragging and commits only after crossing the threshold', async () => {
    const wrapper = mountGantt()
    const bar = wrapper.findAll('.w-gantt__bar')[1]!

    firePointer(bar.element, 'pointerdown', { clientX: 100 })
    firePointer(window, 'pointermove', { clientX: 103 })
    await nextTick()

    expect(wrapper.emitted('task-drag-start')).toBeUndefined()

    firePointer(window, 'pointermove', { clientX: 104 })
    await nextTick()

    expect(wrapper.emitted('task-drag-start')?.[0]).toEqual([tasks[0]?.children?.[0], 'move'])

    firePointer(window, 'pointermove', { clientX: 140 })
    firePointer(window, 'pointerup', { clientX: 140 })
    await nextTick()

    const update = wrapper.emitted('task-update')?.[0]?.[0] as
      | { mode: string; start: Date; end: Date }
      | undefined
    expect(update?.mode).toBe('move')
    expect(update?.start.getDate()).toBe(2)
    expect(update?.end.getDate()).toBe(5)
    wrapper.unmount()
  })

  it('cancels an active drag with Escape', async () => {
    const wrapper = mountGantt()
    const bar = wrapper.findAll('.w-gantt__bar')[1]!

    firePointer(bar.element, 'pointerdown', { clientX: 100 })
    firePointer(window, 'pointermove', { clientX: 140 })
    await nextTick()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(wrapper.emitted('task-update')).toBeUndefined()
    const dragEnd = wrapper.emitted('task-drag-end')?.[0]?.[0] as
      | { changed: boolean; canceled: boolean }
      | undefined
    expect(dragEnd).toMatchObject({ changed: false, canceled: true })
    wrapper.unmount()
  })

  it('supports touch dragging once the threshold is crossed', async () => {
    const wrapper = mountGantt()
    const bar = wrapper.findAll('.w-gantt__bar')[1]!

    firePointer(bar.element, 'pointerdown', { clientX: 100, pointerType: 'touch' })
    firePointer(window, 'pointermove', { clientX: 140, pointerType: 'touch' })
    firePointer(window, 'pointerup', { clientX: 140, pointerType: 'touch' })
    await nextTick()

    const update = wrapper.emitted('task-update')?.[0]?.[0] as { start: Date } | undefined
    expect(update?.start.getDate()).toBe(2)
    wrapper.unmount()
  })

  it('ignores resize modifiers for milestones but still moves with plain arrows', async () => {
    const milestoneTasks: GanttTask[] = [
      { id: 'm', name: 'Milestone', start: '2026-10-10', milestone: true },
    ]
    const wrapper = mountGantt({ tasks: milestoneTasks })
    const bar = wrapper.get('.w-gantt__bar.is-milestone')

    expect(bar.attributes('aria-keyshortcuts')).toBe('ArrowLeft ArrowRight')

    await bar.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    await bar.trigger('keydown', { key: 'ArrowRight', altKey: true })

    expect(wrapper.emitted('task-update')).toBeUndefined()

    await bar.trigger('keydown', { key: 'ArrowRight' })

    const update = wrapper.emitted('task-update')?.[0]?.[0] as
      | { mode: string; start: Date }
      | undefined
    expect(update?.mode).toBe('move')
    expect(update?.start.getDate()).toBe(11)
    wrapper.unmount()
  })

  it('keeps controlled selection in sync with the parent', async () => {
    const wrapper = mountGantt({ selected: 'a' })
    const bars = wrapper.findAll('.w-gantt__bar')

    await bars[2]!.trigger('click')

    expect(wrapper.emitted('update:selected')?.[0]).toEqual(['b'])
    expect(bars[1]!.attributes('aria-selected')).toBe('true')
    expect(bars[2]!.attributes('aria-selected')).toBe('false')
    wrapper.unmount()
  })

  it('respects showProgress=false', () => {
    const wrapper = mountGantt({ showProgress: false })
    expect(wrapper.findAll('.w-gantt__bar-percent')).toHaveLength(0)
    wrapper.unmount()
  })

  it('clamps excessively large ranges to maxRangeDays', () => {
    const wrapper = mount(Gantt, {
      props: {
        tasks,
        startDate: '2020-01-01',
        endDate: '2030-12-31',
        maxRangeDays: 30,
      },
    })

    expect(wrapper.findAll('.w-gantt__header-cell--secondary')).toHaveLength(30)
    wrapper.unmount()
  })
})
