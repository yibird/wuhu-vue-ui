import { effectScope, watchEffect, type ObjectDirective } from 'vue'
import { PERMISSION_KEY } from './permissions'
import type {
  PermissionContext,
  PermissionDirectiveValue,
  PermissionMode,
  PermissionValue,
} from './types'

const originalDisplay = new WeakMap<HTMLElement, string>()
const reactiveScopes = new WeakMap<HTMLElement, () => void>()

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

function apply(el: HTMLElement, binding: { value: PermissionDirectiveValue; instance: unknown }) {
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
    // provided permission set changes without a parent re-render.
    const scope = effectScope()
    scope.run(() => {
      watchEffect(() => apply(el, binding))
    })
    reactiveScopes.set(el, () => scope.stop())
  },
  updated: apply,
  beforeUnmount(el) {
    reactiveScopes.get(el)?.()
    reactiveScopes.delete(el)

    const previous = originalDisplay.get(el)
    if (previous !== undefined) el.style.display = previous
    originalDisplay.delete(el)
  },
}
