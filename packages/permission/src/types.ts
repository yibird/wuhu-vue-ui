export type PermissionMode = 'all' | 'any'

export type PermissionValue = string | string[]

export interface PermissionContext {
  /**
   * Whether the current scope grants the requested value(s).
   * Without a provider this returns `false` for every value (fail-closed).
   * An empty `required` list is vacuously granted in `all` mode and denied in
   * `any` mode.
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
