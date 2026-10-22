export type PermissionMode = 'all' | 'any'

export type PermissionValue = string | string[]

export interface PermissionContext {
  /**
   * Whether the current scope grants the requested value(s).
   * Returns `true` for unknown scopes when no provider exists.
   */
  has: (value: PermissionValue, mode?: PermissionMode) => boolean
}

export interface PermissionProps {
  /** Permission key or keys required to render the default slot. */
  value: PermissionValue
  /** Require every key (`all`) or at least one key (`any`). */
  mode?: PermissionMode
  /** Explicit permission list. Takes precedence over the injected context. */
  permissions?: string[]
}

export type PermissionDirectiveValue =
  | PermissionValue
  | {
      value: PermissionValue
      mode?: PermissionMode
    }
