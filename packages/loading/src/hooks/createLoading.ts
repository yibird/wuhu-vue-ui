import {
  createApp,
  h,
  nextTick,
  shallowReactive,
  shallowRef,
  type App,
  type Component,
  type VNode,
} from 'vue'
import Loading from '../Loading.vue'
import type { LoadingInstance, LoadingOptions, LoadingProps, LoadingSlots } from '../types'

interface InternalInstance {
  id: number
  state: LoadingProps
  destroy: () => void
}

const instances = new Map<number, InternalInstance>()
let seed = 0

const noop = () => {}

/**
 * Creates a loading overlay imperatively. Fullscreen by default.
 *
 * @example
 * const loading = createLoading({ title: '正在保存…' })
 * await save()
 * loading.close()
 */
export function createLoading(options: LoadingOptions = {}): LoadingInstance {
  const id = ++seed
  const { onClose, slots, ...initialProps } = options

  if (typeof document === 'undefined') {
    return { id, close: noop, update: noop, destroy: noop }
  }

  const state = shallowReactive<LoadingProps>({
    full: true,
    open: true,
    ...initialProps,
  })

  let closeCallback = onClose
  const currentSlots = shallowRef<LoadingSlots | undefined>(slots)
  let app: App<Element>
  let closing = false
  let destroyed = false

  const container = document.createElement('div')
  container.setAttribute('data-w-loading', String(id))
  document.body.appendChild(container)

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    instances.delete(id)
    app?.unmount()
    container.remove()
    // A manual destroy can run while the leave transition is still pending, in
    // which case Vue leaves the teleported overlay in the DOM. The instance id
    // attribute lets us remove it without touching other instances.
    document.querySelectorAll(`[data-w-loading-instance="${id}"]`).forEach((node) => node.remove())
  }

  /**
   * The leave transition drives teardown, so a synchronous `destroy()` (or a
   * reopen that cancels the leave) can never race a fixed timer. Teardown is
   * deferred one tick so unmounting never happens in the middle of a render
   * flush and a reopen scheduled in the same tick still wins.
   */
  const handleAfterLeave = () => {
    if (destroyed || state.open) return
    closing = false
    nextTick(() => {
      if (!destroyed && !state.open) destroy()
    })
  }

  const internal: InternalInstance = { id, state, destroy }

  app = createApp({
    name: 'WLoadingHost',
    setup() {
      return () =>
        h(
          Loading as Component,
          { ...state, 'data-w-loading-instance': String(id), onAfterLeave: handleAfterLeave },
          currentSlots.value as unknown as Record<string, () => VNode[]> | undefined,
        )
    },
  })

  app.mount(container)
  instances.set(id, internal)

  const close = () => {
    if (destroyed || closing) return
    // The instance never rendered, so there is no leave transition to wait for.
    if (!state.open) {
      destroy()
      return
    }

    closing = true
    state.open = false
    closeCallback?.()
  }

  const reopen = () => {
    if (destroyed) return
    closing = false
    state.open = true
  }

  return {
    id,
    close,
    update: (next: Partial<LoadingOptions>) => {
      if (destroyed) return

      const { onClose: nextOnClose, slots: nextSlots, open: nextOpen, ...nextProps } = next
      if (nextOnClose) closeCallback = nextOnClose
      if (nextSlots) currentSlots.value = nextSlots
      Object.assign(state, nextProps)

      if (nextOpen === false) close()
      else if (nextOpen === true) reopen()
    },
    destroy,
  }
}

/** Destroys a specific loading instance, or all instances when omitted. */
export function destroyLoading(target?: LoadingInstance | number) {
  if (target === undefined) {
    destroyAllLoadings()
    return
  }

  const id = typeof target === 'number' ? target : target.id
  instances.get(id)?.destroy()
}

/** Destroys every imperative loading instance. */
export function destroyAllLoadings() {
  for (const instance of Array.from(instances.values())) instance.destroy()
}
