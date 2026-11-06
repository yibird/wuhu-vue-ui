/**
 * Any callable. `never` parameters make every concrete function assignable
 * without falling back to `any`.
 */
export type AnyFunction = (...args: never[]) => unknown
