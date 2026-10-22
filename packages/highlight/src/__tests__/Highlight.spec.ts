import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'
import Highlight from '../Highlight.vue'

describe('Highlight', () => {
  it('highlights multiple keywords', () => {
    const wrapper = mount(Highlight, {
      props: {
        text: 'Vue makes building interfaces fun. Vue is great.',
        keywords: ['Vue', 'interfaces'],
      },
    })

    expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['Vue', 'interfaces', 'Vue'])
  })

  it('prefers the longest matching keyword', () => {
    const wrapper = mount(Highlight, {
      props: {
        text: 'Use Vue UI for your next app.',
        keywords: ['Vue', 'Vue UI'],
      },
    })

    expect(wrapper.findAll('mark')).toHaveLength(1)
    expect(wrapper.find('mark').text()).toBe('Vue UI')
  })

  it('respects case sensitivity', () => {
    const wrapper = mount(Highlight, {
      props: {
        text: 'vue and Vue',
        keywords: ['Vue'],
        caseSensitive: true,
      },
    })

    expect(wrapper.findAll('mark')).toHaveLength(1)
    expect(wrapper.find('mark').text()).toBe('Vue')
  })

  it('supports Unicode-aware whole-word matching', () => {
    const wrapper = mount(Highlight, {
      props: {
        text: 'Vue Vuex revue',
        keywords: ['Vue'],
        wholeWord: true,
      },
    })

    expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['Vue'])
  })

  it('matches CJK keywords in whole-word mode without space boundaries', () => {
    const wrapper = mount(Highlight, {
      props: {
        text: '每个组件独立发布',
        keywords: ['组件'],
        wholeWord: true,
      },
    })

    expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['组件'])
  })

  it('falls back to a shorter keyword when a longer candidate fails the boundary check', () => {
    const wrapper = mount(Highlight, {
      props: {
        text: 'ab cx',
        keywords: ['ab c', 'ab'],
        wholeWord: true,
      },
    })

    expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['ab'])
  })

  it('does not highlight whitespace-only keywords', () => {
    const wrapper = mount(Highlight, {
      props: {
        text: 'hello world',
        keywords: [' ', 'world'],
      },
    })

    expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['world'])
    expect(wrapper.text()).toBe('hello world')
  })

  it('never renders input as HTML', () => {
    const wrapper = mount(Highlight, {
      props: {
        text: '<img src=x onerror="alert(1)"> and <script>alert(2)</script>',
        keywords: ['alert'],
      },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.text()).toContain('<img src=x onerror="alert(1)">')
    expect(wrapper.findAll('mark')).toHaveLength(2)
  })
})
