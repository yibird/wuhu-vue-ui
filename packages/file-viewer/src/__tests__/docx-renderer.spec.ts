import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { en } from '../i18n'
import DocxRenderer from '../renderers/DocxRenderer.vue'
import type { FileViewerSource } from '../types'

function sampleSource(): FileViewerSource {
  const bytes = new Uint8Array(
    readFileSync(resolvePath(process.cwd(), 'playground/public/samples/sample.docx')),
  )
  const buffer = bytes.buffer.slice(0) as ArrayBuffer

  return {
    name: 'sample.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: 'docx',
    kind: 'document',
    url: '',
    isObjectUrl: false,
    getBlob: async () => new Blob([buffer]),
    getArrayBuffer: async () => buffer,
    getText: async () => '',
    dispose: () => {},
  }
}

async function mountDocx() {
  const wrapper = mount(DocxRenderer, {
    props: {
      source: sampleSource(),
      kind: 'document',
      options: {},
      locale: 'en',
      messages: en,
      theme: 'light',
      zoom: 1,
      rotation: 0,
      page: 1,
    },
  })

  const started = Date.now()
  while (Date.now() - started < 4000) {
    await flushPromises()
    if (wrapper.emitted('ready') || wrapper.emitted('error')) break
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  // Allow the post-ready nextTick + scroll pass to run.
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 30))
  return wrapper
}

const originalScrollTo = Element.prototype.scrollTo

afterEach(() => {
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    writable: true,
    value: originalScrollTo,
  })
})

describe('DocxRenderer scrolling', () => {
  it('does not turn a missing scrollTo into a parse error', async () => {
    Object.defineProperty(Element.prototype, 'scrollTo', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    const wrapper = await mountDocx()
    expect(wrapper.emitted('ready')).toBeTruthy()
    expect(wrapper.emitted('error')).toBeFalsy()
    expect(wrapper.findAll('.w-file-viewer__docx-page').length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('scrolls the container when scrollTo is available', async () => {
    const scrollTo = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollTo', {
      configurable: true,
      writable: true,
      value: scrollTo,
    })

    const wrapper = await mountDocx()
    expect(wrapper.emitted('error')).toBeFalsy()
    expect(scrollTo).toHaveBeenCalled()
    wrapper.unmount()
  })
})
