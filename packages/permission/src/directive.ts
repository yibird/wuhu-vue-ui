import { effectScope, shallowRef, watchEffect, type ObjectDirective, type ShallowRef } from 'vue'
import { PERMISSION_KEY } from './permissions'
import type {
  PermissionContext,
  PermissionDirectiveValue,
  PermissionMode,
  PermissionValue,
} from './types'

const originalDisplay = new WeakMap<HTMLElement, string>()

interface AppliedBinding {
  value: PermissionDirectiveValue
  instance: unknown
}

interface DirectiveState {
  binding: ShallowRef<AppliedBinding>
  stop: () => void
}

const directiveStates = new WeakMap<HTMLElement, DirectiveState>()

interface NormalizedDirectiveValue {
  value: PermissionValue
  mode: PermissionMode
}

function normalize(value: PermissionDirectiveValue | undefined): NormalizedDirectiveValue {
  if (value === undefined) return { value: [], mode: 'all' }
  if (typeof value === 'string' || Array.isArray(value)) {
    return { value, mode: 'all' }
  }
  return { value: value.value, mode: value.mode ?? 'all' }
}

function apply(el: HTMLElement, binding: AppliedBinding) {
  // `instance.provides` inherits from the app context, so this resolves both
  // `provide()` calls from ancestors and app-level `provide` options.
  const provides = (binding.instance as { $?: { provides?: Record<PropertyKey, unknown> } } | null)
    ?.$?.provides
  const context = provides?.[PERMISSION_KEY] as PermissionContext | undefined
  const { value, mode } = normalize(binding.value)
  const allowed = context ? context.has(value, mode) : false

  if (allowed) {
    const previous = originalDisplay.get(el)
    if (previous !== undefined) {
      el.style.display = previous
      originalDisplay.delete(el)
    }
    return
  }

  if (!originalDisplay.has(el)) {
    originalDisplay.set(el, el.style.display)
  }
  el.style.display = 'none'
}

/**
 * Hide an element when the current permission context denies the bound value.
 * The original inline `display` is restored when access is granted or the
 * element unmounts.
 */
export const vPermission: ObjectDirective<HTMLElement, PermissionDirectiveValue> = {
  mounted(el, binding) {
    // Track reactive permission sources so `display` also updates when the
    // provided permission set changes without a parent re-render. The binding
    // is mutable so the effect always reads the latest directive value.
    const state: DirectiveState = {
      binding: shallowRef({ value: binding.value, instance: binding.instance }),
      stop: () => {},
    }

    const scope = effectScope()
    scope.run(() => {
      watchEffect(() => apply(el, state.binding.value))
    })
    state.stop = () => scope.stop()
    directiveStates.set(el, state)
  },
  updated(el, binding) {
    const state = directiveStates.get(el)
    if (!state) {
      apply(el, { value: binding.value, instance: binding.instance })
      return
    }

    state.binding.value = { value: binding.value, instance: binding.instance }
  },
  beforeUnmount(el) {
    directiveStates.get(el)?.stop()
    directiveStates.delete(el)

    const previous = originalDisplay.get(el)
    if (previous !== undefined) el.style.display = previous
    originalDisplay.delete(el)
  },
}
