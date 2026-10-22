import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import type { CropperExpose } from '../types'

const mocks = vi.hoisted(() => {
  const listeners = new Map<string, EventListener>()

  const selection = {
    x: 10,
    y: 20,
    width: 120,
    height: 80,
    aspectRatio: Number.NaN,
    initialCoverage: 0.5,
    movable: true,
    resizable: true,
    zoomable: true,
    keyboard: true,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener)
    }),
    removeEventListener: vi.fn((type: string) => {
      listeners.delete(type)
    }),
    $change: vi.fn(),
    $reset: vi.fn(),
    $toCanvas: vi.fn(async () => ({
      toBlob: (callback: (blob: Blob | null) => void) => callback(new Blob(['crop'])),
      toDataURL: () => 'data:image/png;base64,Y3JvcA==',
    })),
    trigger: (type: string, event: Event = new Event(type)) => listeners.get(type)?.(event),
  }

  const image = {
    src: '',
    rotatable: true,
    scalable: true,
    translatable: true,
    initialCenterSize: '',
    initialFit: 'contain',
    $ready: vi.fn(async () => ({})),
    $zoom: vi.fn(),
    $rotate: vi.fn(),
    $resetTransform: vi.fn(),
    $center: vi.fn(),
    $getTransform: vi.fn(() => [1, 0, 0, 1, 0, 0]),
  }

  const canvasListeners = new Map<string, EventListener>()
  const canvas = {
    disabled: false,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      canvasListeners.set(type, listener)
    }),
    removeEventListener: vi.fn((type: string) => {
      canvasListeners.delete(type)
    }),
    trigger: (type: string) => canvasListeners.get(type)?.(new Event(type)),
  }

  const instance = {
    getCropperImage: () => image,
    getCropperSelection: () => selection,
    getCropperCanvas: () => canvas,
    destroy: vi.fn(),
  }

  return { selection, image, canvas, instance }
})

vi.mock('cropperjs', () => ({
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  default: function CropperMock() {
    return mocks.instance
  },
  DEFAULT_TEMPLATE: '<cropper-canvas></cropper-canvas>',
}))

import Cropper from '../Cropper.vue'

function getVm(wrapper: ReturnType<typeof mount>): CropperExpose {
  return wrapper.vm as unknown as CropperExpose
}

describe('Cropper', () => {
  beforeEach(() => {
    mocks.selection.x = 10
    mocks.selection.y = 20
    mocks.selection.width = 120
    mocks.selection.height = 80
    mocks.selection.$change.mockClear()
    mocks.selection.$reset.mockClear()
    mocks.selection.$toCanvas.mockClear()
    mocks.image.$zoom.mockClear()
    mocks.image.$rotate.mockClear()
    mocks.image.$resetTransform.mockClear()
    mocks.image.$center.mockReset()
    mocks.image.$getTransform.mockReset()
    mocks.image.$getTransform.mockReturnValue([1, 0, 0, 1, 0, 0])
    mocks.image.rotatable = true
    mocks.image.translatable = true
    mocks.image.scalable = true
    mocks.instance.destroy.mockClear()
  })

  it('renders the source image and emits ready after the image loads', async () => {
    const wrapper = mount(Cropper, {
      props: { src: '/photo.jpg', alt: 'Photo' },
    })

    expect(wrapper.get('img').attributes('src')).toBe('/photo.jpg')
    expect(wrapper.get('img').attributes('alt')).toBe('Photo')

    await flushPromises()

    expect(wrapper.classes()).toContain('is-ready')
    expect(wrapper.emitted('ready')).toHaveLength(1)
    wrapper.unmount()
  })

  it('applies selection options to the cropper elements', async () => {
    const wrapper = mount(Cropper, {
      props: {
        src: '/photo.jpg',
        aspectRatio: 1,
        initialCoverage: 0.7,
        movable: false,
        disabled: true,
      },
    })

    await flushPromises()

    expect(mocks.selection.aspectRatio).toBe(1)
    expect(mocks.selection.initialCoverage).toBe(0.7)
    expect(mocks.selection.movable).toBe(false)
    expect(mocks.canvas.disabled).toBe(true)
    wrapper.unmount()
  })

  it('exposes selection data and crop outputs', async () => {
    const wrapper = mount(Cropper, { props: { src: '/photo.jpg' } })
    await flushPromises()

    const vm = getVm(wrapper)
    expect(vm.getData()).toEqual({ x: 10, y: 20, width: 120, height: 80 })

    const canvas = await vm.getCroppedCanvas({ width: 60, height: 40 })
    expect(mocks.selection.$toCanvas).toHaveBeenCalledWith({ width: 60, height: 40 })
    expect(canvas).not.toBeNull()

    await expect(vm.getCroppedBlob()).resolves.toBeInstanceOf(Blob)
    await expect(vm.getCroppedDataUrl()).resolves.toContain('data:image/png')
    wrapper.unmount()
  })

  it('delegates zoom, rotate, reset and data changes', async () => {
    const wrapper = mount(Cropper, { props: { src: '/photo.jpg' } })
    await flushPromises()

    const vm = getVm(wrapper)
    vm.zoom(0.2)
    expect(mocks.image.$zoom).toHaveBeenCalledWith(0.2)

    vm.rotate(90)
    expect(mocks.image.$rotate).toHaveBeenCalledWith(Math.PI / 2)

    vm.setData({ x: 5, width: 40 })
    expect(mocks.selection.$change).toHaveBeenCalledWith(5, 20, 40, 80)

    vm.reset()
    expect(mocks.image.$resetTransform).toHaveBeenCalled()
    expect(mocks.image.$center).toHaveBeenCalledWith('contain')
    expect(mocks.selection.$reset).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('restores the initial contain + center fit on reset, even when interaction is locked', async () => {
    const wrapper = mount(Cropper, {
      props: { src: '/photo.jpg', rotatable: false, translatable: false, scalable: false },
    })
    await flushPromises()

    const vm = getVm(wrapper)
    expect(mocks.image.rotatable).toBe(false)
    expect(mocks.image.translatable).toBe(false)
    expect(mocks.image.scalable).toBe(false)

    const flagsDuringCenter: Array<[boolean, boolean]> = []
    mocks.image.$center.mockImplementation(() => {
      flagsDuringCenter.push([mocks.image.translatable, mocks.image.scalable])
    })

    vm.reset()

    expect(mocks.image.$resetTransform).toHaveBeenCalledTimes(1)
    expect(mocks.image.$center).toHaveBeenCalledWith('contain')
    // Centering / fitting must be possible even when the user disabled those
    // interactions, and the props must be restored afterwards.
    expect(flagsDuringCenter).toEqual([[true, true]])
    expect(mocks.image.translatable).toBe(false)
    expect(mocks.image.scalable).toBe(false)
    wrapper.unmount()
  })

  it('clamps zoom to the 0.1 - 10 range', async () => {
    const wrapper = mount(Cropper, { props: { src: '/photo.jpg' } })
    await flushPromises()

    const vm = getVm(wrapper)

    // Already at the maximum: further zoom-in is a no-op.
    mocks.image.$getTransform.mockReturnValue([10, 0, 0, 10, 0, 0])
    vm.zoom(1)
    expect(mocks.image.$zoom).not.toHaveBeenCalled()

    // Already at the minimum: further zoom-out is a no-op.
    mocks.image.$getTransform.mockReturnValue([0.1, 0, 0, 0.1, 0, 0])
    vm.zoom(-1)
    expect(mocks.image.$zoom).not.toHaveBeenCalled()

    // Zooming past the maximum is reduced to what is left of the range.
    mocks.image.$getTransform.mockReturnValue([9, 0, 0, 9, 0, 0])
    vm.zoom(1)
    expect(mocks.image.$zoom.mock.calls[0][0]).toBeCloseTo(1 / 9)

    // Inside the range the original delta is forwarded unchanged.
    mocks.image.$getTransform.mockReturnValue([5, 0, 0, 5, 0, 0])
    mocks.image.$zoom.mockClear()
    vm.zoom(1)
    expect(mocks.image.$zoom).toHaveBeenCalledWith(1)

    // An initial contain-fit may already be below the lower bound; zooming out
    // further is blocked while zooming back in is not snapped to 0.1.
    mocks.image.$getTransform.mockReturnValue([0.05, 0, 0, 0.05, 0, 0])
    mocks.image.$zoom.mockClear()
    vm.zoom(-0.5)
    expect(mocks.image.$zoom).not.toHaveBeenCalled()
    vm.zoom(0.5)
    expect(mocks.image.$zoom).toHaveBeenCalledWith(0.5)
    wrapper.unmount()
  })

  it('uses the change event detail so crop is not one frame behind', async () => {
    const wrapper = mount(Cropper, { props: { src: '/photo.jpg' } })
    await flushPromises()

    // Selection properties still hold the previous geometry when `change` is
    // dispatched, exactly like Cropper.js while dragging.
    expect(mocks.selection.x).toBe(10)
    mocks.selection.trigger(
      'change',
      new CustomEvent('change', {
        detail: { x: 48, y: 32, width: 160, height: 120 },
      }),
    )

    expect(wrapper.emitted('crop')?.at(-1)).toEqual([{ x: 48, y: 32, width: 160, height: 120 }])
    wrapper.unmount()
  })

  it('emits crop data when the selection changes', async () => {
    const wrapper = mount(Cropper, { props: { src: '/photo.jpg' } })
    await flushPromises()

    mocks.selection.x = 30
    mocks.selection.trigger('change')

    expect(wrapper.emitted('crop')?.at(-1)).toEqual([{ x: 30, y: 20, width: 120, height: 80 }])
    wrapper.unmount()
  })

  it('destroys the cropper instance on unmount', async () => {
    const wrapper = mount(Cropper, { props: { src: '/photo.jpg' } })
    await flushPromises()

    wrapper.unmount()
    expect(mocks.instance.destroy).toHaveBeenCalledTimes(1)
  })
})
