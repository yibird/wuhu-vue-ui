import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

/**
 * Architectural guardrails for the token layer.
 *
 * Component packages are independently installable, so they must never ship a
 * global theme: the last imported package would win and silently recolour the
 * others. Shared `--w-*` tokens are owned by the app; packages only consume
 * them with a fallback and declare their own tokens on the component root.
 */
const packagesDir = resolve(import.meta.dirname, '..', 'packages')

interface StyleSource {
  pkg: string
  file: string
  content: string
}

function readStyleSources(): StyleSource[] {
  const sources: StyleSource[] = []

  for (const pkg of readdirSync(packagesDir)) {
    const styleDir = join(packagesDir, pkg, 'src', 'style')
    if (!existsSync(styleDir)) continue

    for (const file of readdirSync(styleDir)) {
      if (!file.endsWith('.less')) continue
      sources.push({
        pkg,
        file,
        content: readFileSync(join(styleDir, file), 'utf8'),
      })
    }
  }

  return sources
}

describe('theme tokens', () => {
  const sources = readStyleSources()

  it('never declares global theme tokens from a component package', () => {
    const offenders = sources
      .filter(
        ({ content }) =>
          // Bare `:root {` / `:root,` blocks and bare `[data-w-theme='dark'] {`
          // blocks are app-level themes. Scoped descendants such as
          // `[data-w-theme='dark'] .w-dock` are allowed.
          /^:root\s*[,{]/m.test(content) || /^\[data-w-theme=['"][a-z]+['"]\]\s*\{/m.test(content),
      )
      .map(({ pkg, file }) => `${pkg}/${file}`)

    expect(offenders).toEqual([])
  })

  it('defines every token it reads without a fallback', () => {
    const offenders: string[] = []

    for (const pkg of new Set(sources.map((source) => source.pkg))) {
      const content = sources
        .filter((source) => source.pkg === pkg)
        .map((source) => source.content)
        .join('\n')

      const defined = new Set(
        [...content.matchAll(/(--w-[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
      )
      // `var(--w-x)` without a comma means the token has no fallback.
      const unresolved = [
        ...new Set([...content.matchAll(/var\((--w-[a-z0-9-]+)\)/g)].map((match) => match[1])),
      ].filter((token) => !defined.has(token))

      if (unresolved.length > 0) offenders.push(`${pkg}: ${unresolved.join(', ')}`)
    }

    expect(offenders).toEqual([])
  })

  it('keeps private tokens scoped to the component root', () => {
    const offenders: string[] = []

    for (const { pkg, file, content } of sources) {
      if (file !== 'token.less') continue
      // A token file may only contain mixins and rules rooted at a class or an
      // attribute selector, never a bare element selector.
      const selectors = [...content.matchAll(/^([^\s@/\n][^{}\n]*)\{/gm)].map((match) =>
        match[1]!.trim(),
      )
      for (const selector of selectors) {
        if (!selector.startsWith('.') && !selector.startsWith('[') && !selector.includes('(')) {
          offenders.push(`${pkg}/${file}: ${selector}`)
        }
      }
    }

    expect(offenders).toEqual([])
  })
})
