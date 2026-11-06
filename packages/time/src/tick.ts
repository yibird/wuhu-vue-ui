interface TickEntry {
  listeners: Set<(now: number) => void>
  timer?: ReturnType<typeof setInterval>
}

const tickEntries = new Map<number, TickEntry>()

/**
 * Subscribes to a clock shared by every instance using the same interval.
 * The entry (and its timer) is removed when the last listener unsubscribes.
 */
export function subscribeTick(interval: number, listener: (now: number) => void): () => void {
  let entry = tickEntries.get(interval)
  if (!entry) {
    entry = { listeners: new Set() }
    tickEntries.set(interval, entry)
  }

  entry.listeners.add(listener)

  if (entry.timer === undefined && typeof setInterval === 'function') {
    const current = entry
    current.timer = setInterval(() => {
      const now = Date.now()
      for (const item of current.listeners) item(now)
    }, interval)
  }

  return () => {
    const current = tickEntries.get(interval)
    if (!current) return

    current.listeners.delete(listener)
    if (current.listeners.size === 0) {
      if (current.timer !== undefined) clearInterval(current.timer)
      tickEntries.delete(interval)
    }
  }
}
