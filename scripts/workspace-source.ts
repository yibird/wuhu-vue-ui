import { existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

/**
 * Minimal plugin shape shared by different Vite versions (the playground uses
 * Vite 7 while VitePress pins Vite 5), so we avoid importing Vite's Plugin type.
 */
export interface WorkspaceSourcePlugin {
  name: string
  enforce: 'pre'
  resolveId(source: string): string | undefined
}

/**
 * Resolve workspace packages to their source before Vite's own resolver
 * picks up the `dist` entry from package.json. Shared by the playground and
 * the VitePress documentation site.
 */
export function workspaceSource(): WorkspaceSourcePlugin {
  return {
    name: 'wuhu:workspace-source',
    enforce: 'pre',
    resolveId(source) {
      const match = /^@wuhu-vue-ui\/([^/]+)$/.exec(source)
      if (!match) return

      const packageRootEntry = fileURLToPath(
        new URL(`../packages/${match[1]}/index.ts`, import.meta.url),
      )
      if (existsSync(packageRootEntry)) return packageRootEntry

      return fileURLToPath(new URL(`../packages/${match[1]}/src/index.ts`, import.meta.url))
    },
  }
}
