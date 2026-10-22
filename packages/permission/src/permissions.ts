import { inject, provide, toValue } from 'vue'
import type { InjectionKey, MaybeRefOrGetter } from 'vue'
import type { PermissionContext, PermissionMode, PermissionValue } from './types'

export const PERMISSION_KEY: InjectionKey<PermissionContext> = Symbol('w-permission')

const denyAll: PermissionContext = {
  has: () => false,
}

function toList(value: PermissionValue): string[] {
  return Array.isArray(value) ? value : [value]
}

/** Evaluate `required` against the granted set using the requested mode. */
export function checkPermission(
  required: PermissionValue,
  granted: ReadonlySet<string>,
  mode: PermissionMode = 'all',
): boolean {
  const values = toList(required)
  if (values.length === 0) return mode === 'all'
  return mode === 'any'
    ? values.some((value) => granted.has(value))
    : values.every((value) => granted.has(value))
}

/**
 * Provide a reactive permission source to descendants.
 * Array, ref, getter and `Set` sources are supported.
 */
export function providePermissions(source: MaybeRefOrGetter<string[] | Set<string>>): void {
  const context: PermissionContext = {
    has(value, mode = 'all') {
      const resolved = toValue(source)
      const granted = resolved instanceof Set ? resolved : new Set(resolved)
      return checkPermission(value, granted, mode)
    },
  }

  provide(PERMISSION_KEY, context)
}

/**
 * Read the nearest permission context. Without a provider every permission
 * check is denied (fail-closed).
 */
export function usePermission(): PermissionContext {
  return inject(PERMISSION_KEY, denyAll)
}
