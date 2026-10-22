import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'
import { defineComponent, h, nextTick, ref, withDirectives } from 'vue'
import Permission from '../Permission.vue'
import { vPermission } from '../directive'
import { PERMISSION_KEY, providePermissions, usePermission } from '../permissions'
import type { PermissionContext } from '../types'

const defaultSlot = {
  default: () => h('span', { class: 'allowed' }, '允许访问'),
  fallback: () => h('span', { class: 'denied' }, '无权访问'),
}

describe('Permission', () => {
  it('denies everything by default without a provider or explicit permissions', () => {
    const wrapper = mount(Permission, { props: { value: 'admin' }, slots: defaultSlot })

    expect(wrapper.find('.allowed').exists()).toBe(false)
    expect(wrapper.find('.denied').exists()).toBe(true)
    wrapper.unmount()
  })

  it('requires every value in all mode', () => {
    const all = mount(Permission, {
      props: { value: ['user:read', 'user:write'], permissions: ['user:read', 'user:write'] },
      slots: defaultSlot,
    })
    expect(all.find('.allowed').exists()).toBe(true)

    const partial = mount(Permission, {
      props: { value: ['user:read', 'user:write'], permissions: ['user:read'] },
      slots: defaultSlot,
    })
    expect(partial.find('.allowed').exists()).toBe(false)
    expect(partial.find('.denied').exists()).toBe(true)

    all.unmount()
    partial.unmount()
  })

  it('requires at least one value in any mode', () => {
    const wrapper = mount(Permission, {
      props: { value: ['user:read', 'order:read'], mode: 'any', permissions: ['order:read'] },
      slots: defaultSlot,
    })

    expect(wrapper.find('.allowed').exists()).toBe(true)

    const denied = mount(Permission, {
      props: { value: ['a', 'b'], mode: 'any', permissions: ['c'] },
      slots: defaultSlot,
    })
    expect(denied.find('.denied').exists()).toBe(true)
    wrapper.unmount()
    denied.unmount()
  })

  it('uses the injected context when no explicit permissions are given', () => {
    const wrapper = mount(Permission, {
      props: { value: ['read', 'write'] },
      slots: defaultSlot,
      global: {
        provide: {
          [PERMISSION_KEY]: {
            has: (value, mode = 'all') => {
              const values = Array.isArray(value) ? value : [value]
              const granted = new Set(['read'])
              return mode === 'any'
                ? values.some((item) => granted.has(item))
                : values.every((item) => granted.has(item))
            },
          } satisfies PermissionContext,
        },
      },
    })

    expect(wrapper.find('.denied').exists()).toBe(true)
    wrapper.unmount()
  })

  it('gives explicit permissions precedence over the injected context', () => {
    const wrapper = mount(Permission, {
      props: { value: 'admin', permissions: ['admin'] },
      slots: defaultSlot,
      global: {
        provide: {
          [PERMISSION_KEY]: { has: () => false } satisfies PermissionContext,
        },
      },
    })

    expect(wrapper.find('.allowed').exists()).toBe(true)
    wrapper.unmount()
  })

  it('works with providePermissions and updates reactively', async () => {
    const granted = ref(['user:read'])

    const wrapper = mount(
      defineComponent({
        setup() {
          providePermissions(granted)
          return () => h(Permission, { value: ['user:read', 'user:write'] }, defaultSlot)
        },
      }),
    )

    expect(wrapper.find('.denied').exists()).toBe(true)

    granted.value = ['user:read', 'user:write']
    await nextTick()

    expect(wrapper.find('.allowed').exists()).toBe(true)
    wrapper.unmount()
  })

  it('read the provided context through usePermission', () => {
    const granted = ref(new Set(['user:read']))
    let consumed: PermissionContext | undefined

    const Consumer = defineComponent({
      setup() {
        consumed = usePermission()
        return () => null
      },
    })

    const wrapper = mount(
      defineComponent({
        setup() {
          providePermissions(granted)
          return () => h(Consumer)
        },
      }),
    )

    expect(consumed?.has('user:read')).toBe(true)
    expect(consumed?.has('user:write')).toBe(false)
    expect(consumed?.has(['user:read', 'user:write'], 'any')).toBe(true)
    wrapper.unmount()
  })

  it('returns a deny-all context when used without a provider', () => {
    let consumed: PermissionContext | undefined

    mount(
      defineComponent({
        setup() {
          consumed = usePermission()
          return () => null
        },
      }),
    )

    expect(consumed?.has('anything')).toBe(false)
  })
})

describe('vPermission', () => {
  it('reacts to changes in the provided permission source', async () => {
    const granted = ref<string[]>([])

    const Child = defineComponent({
      setup() {
        return () =>
          withDirectives(h('div', { class: 'reactive-target' }, '内容'), [[vPermission, 'read']])
      },
    })

    const wrapper = mount(
      defineComponent({
        setup() {
          providePermissions(granted)
          return () => h(Child)
        },
      }),
    )

    const target = wrapper.get('.reactive-target').element as HTMLElement
    expect(target.style.display).toBe('none')

    granted.value = ['read']
    await nextTick()
    expect(target.style.display).not.toBe('none')

    granted.value = []
    await nextTick()
    expect(target.style.display).toBe('none')

    wrapper.unmount()
  })

  it('hides denied elements and restores the original display when allowed', async () => {
    const allowed = ref(false)

    const wrapper = mount(
      defineComponent({
        setup() {
          providePermissions(['read'])
          return () =>
            withDirectives(h('div', { class: 'target', style: { display: 'flex' } }, '安全内容'), [
              [vPermission, allowed.value ? 'read' : 'write'],
            ])
        },
      }),
    )

    const target = wrapper.get('.target').element as HTMLElement
    expect(target.style.display).toBe('none')

    allowed.value = true
    await nextTick()

    expect(target.style.display).toBe('flex')
    wrapper.unmount()
  })

  it('supports the object value with a mode', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          providePermissions(['read', 'write'])
          return () =>
            withDirectives(h('div', { class: 'target' }, '内容'), [
              [vPermission, { value: ['read', 'missing'], mode: 'any' }],
            ])
        },
      }),
    )

    const target = wrapper.get('.target').element as HTMLElement
    expect(target.style.display).not.toBe('none')
    wrapper.unmount()
  })

  it('hides elements without a provider', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return () => withDirectives(h('div', { class: 'target' }, '内容'), [[vPermission, 'x']])
        },
      }),
    )

    const target = wrapper.get('.target').element as HTMLElement
    expect(target.style.display).toBe('none')
    wrapper.unmount()
  })

  it('restores the original display on unmount while hidden', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          providePermissions([])
          return () =>
            withDirectives(h('div', { class: 'target', style: { display: 'grid' } }, '内容'), [
              [vPermission, 'missing'],
            ])
        },
      }),
    )

    const target = wrapper.get('.target').element as HTMLElement
    expect(target.style.display).toBe('none')

    wrapper.unmount()

    expect(target.style.display).toBe('grid')
  })
})
