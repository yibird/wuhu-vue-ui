import { ref } from 'vue'

/**
 * A tiny built-in Lucide-compatible path registry. Names are normalized so
 * `i-lucide:chevron-up`, `lucide:chevron-up` and `chevron-up` all resolve to
 * the same entry. Namespaced custom icons are kept under their full name so
 * `i-a:check` and `i-b:check` do not overwrite each other.
 */
const iconPaths = new Map<string, string[]>([
  ['chevron-up', ['m18 15-6-6-6 6']],
  ['chevron-down', ['m6 9 6 6 6-6']],
  ['chevron-left', ['m15 18-6-6 6-6']],
  ['chevron-right', ['m9 18 6-6-6-6']],
  ['arrow-up', ['m5 12 7-7 7 7', 'M12 19V5']],
  ['arrow-down', ['M12 5v14', 'm19 12-7 7-7-7']],
  ['arrow-left', ['M19 12H5', 'm12 19-7-7 7-7']],
  ['arrow-right', ['M5 12h14', 'm12 5 7 7-7 7']],
  ['x', ['M18 6 6 18', 'm6 6 12 12']],
  ['check', ['M20 6 9 17l-5-5']],
  ['plus', ['M12 5v14', 'M5 12h14']],
  ['minus', ['M5 12h14']],
  ['search', ['M21 21l-4.35-4.35', 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z']],
])

const registryVersion = ref(0)

export function normalizeIconName(name: string): string {
  return name.trim().replace(/^i-/, '').split(':').pop()!.toLowerCase()
}

function normalizeRegistryKey(name: string): string {
  return name.trim().replace(/^i-/, '').toLowerCase()
}

/** Registers or overrides an icon using one or more SVG path `d` values. */
export function registerIcon(name: string, paths: string | string[]): void {
  iconPaths.set(normalizeRegistryKey(name), Array.isArray(paths) ? paths : [paths])
  registryVersion.value++
}

/** Resolves an icon name to its SVG path list. Unknown names resolve to `[]`. */
export function resolveIcon(name: string): string[] {
  // Track registrations so computed consumers update after `registerIcon`.
  void registryVersion.value

  const exact = iconPaths.get(normalizeRegistryKey(name))
  if (exact) return exact

  // Fall back to the bare name so `i-lucide:chevron-up` still finds the
  // built-in `chevron-up` entry.
  return iconPaths.get(normalizeIconName(name)) ?? []
}
