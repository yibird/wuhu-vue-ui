/** Normalizes an unknown thrown value into an Error. */
export function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause ?? ''))
}

/** Builds a renderer error with a localized prefix and the original detail. */
export function toRendererError(message: string, cause: unknown): Error {
  const detail = cause instanceof Error ? cause.message : String(cause ?? '')
  return new Error(`${message} ${detail}`.trim())
}
