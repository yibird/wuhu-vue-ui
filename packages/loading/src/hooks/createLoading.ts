import {
  createApp,
  h,
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

const TRANSITION_DURATION = 200
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
  let timer: ReturnType<typeof setTimeout> | undefined
  let app: App<Element>

  const container = document.createElement('div')
  container.setAttribute('data-w-loading', String(id))
  document.body.appendChild(container)

  const destroy = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }

    app?.unmount()
    container.remove()
    instances.delete(id)
  }

  const internal: InternalInstance = { id, state, destroy }

  app = createApp({
    name: 'WLoadingHost',
    setup() {
      return () =>
        h(
          Loading as Component,
          {
            ...state,
            'onUpdate:open': (value: boolean) => {
              if (!value) destroy()
            },
          },
          currentSlots.value as unknown as Record<string, () => VNode[]> | undefined,
        )
    },
  })

  app.mount(container)
  instances.set(id, internal)

  const close = (): void => {
    if (!instances.has(id)) return
    if (timer !== undefined) return
    state.open = false
    closeCallback?.()
    timer = setTimeout(() => {
      timer = undefined
      destroy()
    }, TRANSITION_DURATION)
  }

  return {
    id,
    close,
    update: (next: Partial<LoadingOptions>) => {
      const { onClose: nextOnClose, slots: nextSlots, ...nextProps } = next
      if (nextProps.open === false) {
        close()
        return
      }
      Object.assign(state, nextProps)
      if (nextOnClose) closeCallback = nextOnClose
      if (nextSlots) currentSlots.value = nextSlots
    },
    destroy,
  }
}

/** Destroys a specific loading instance, or all instances when omitted. */
export function destroyLoading(target?: LoadingInstance | number): void {
  if (target === undefined) {
    destroyAllLoadings()
    return
  }

  const id = typeof target === 'number' ? target : target.id
  instances.get(id)?.destroy()
}

/** Destroys every imperative loading instance. */
export function destroyAllLoadings(): void {
  for (const instance of Array.from(instances.values())) instance.destroy()
}
