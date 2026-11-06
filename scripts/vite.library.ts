import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import dts from 'vite-plugin-dts'

/**
 * Adds the extracted stylesheet import to the browser entry, creates a
 * CSS-free entry for Node/SSR consumers, and normalizes declaration imports
 * for strict NodeNext TypeScript resolution.
 */
function finalizeLibrary(outDir: string): Plugin {
  return {
    name: 'wuhu:finalize-library',
    apply: 'build',
    writeBundle(options, bundle) {
      const cssFile = Object.keys(bundle).find((fileName) => fileName.endsWith('.css'))
      const entry = Object.values(bundle).find(
        (output) => output.type === 'chunk' && output.isEntry,
      )
      if (!cssFile || !entry || !options.dir) return

      const entryPath = resolve(options.dir, entry.fileName)
      const cssImport = `import ${JSON.stringify(`./${basename(cssFile)}`)};`
      let code = readFileSync(entryPath, 'utf8')

      if (!code.includes(cssImport)) {
        const sourceMapComment = code.lastIndexOf('\n//# sourceMappingURL=')
        code =
          sourceMapComment === -1
            ? `${code}\n${cssImport}\n`
            : `${code.slice(0, sourceMapComment)}\n${cssImport}${code.slice(sourceMapComment)}`
        writeFileSync(entryPath, code)
      }

      // Browser bundlers get CSS automatically. Node ESM cannot import CSS,
      // so expose a CSS-free sibling through the package "node" condition.
      const nodeFileName = entry.fileName.replace(/\.js$/, '.node.js')
      const nodePath = resolve(options.dir, nodeFileName)
      let nodeCode = code.replace(`\n${cssImport}`, '')
      nodeCode = nodeCode.replace(
        /\/\/# sourceMappingURL=.+$/m,
        `//# sourceMappingURL=${basename(nodePath)}.map`,
      )
      writeFileSync(nodePath, nodeCode)

      const mapPath = `${entryPath}.map`
      if (existsSync(mapPath)) {
        const map = JSON.parse(readFileSync(mapPath, 'utf8')) as Record<string, unknown>
        map.file = nodeFileName
        writeFileSync(`${nodePath}.map`, JSON.stringify(map))
      }
    },
    closeBundle() {
      if (!existsSync(outDir)) return

      // The declaration plugin can still emit test declarations. They should
      // never be published, so remove them regardless of plugin ordering.
      removeTestDeclarations(outDir)

      // Extensionless relative imports in .d.ts files fail under
      // moduleResolution "node16"/"nodenext". Add explicit .js extensions.
      for (const declaration of collectDeclarations(outDir)) {
        const source = readFileSync(declaration, 'utf8')
        const rewritten = source.replace(
          /((?:from|import)\s*\(?\s*['"])(\.{1,2}\/[^'"]+)(['"])/g,
          (match, prefix: string, specifier: string, suffix: string) => {
            // Directory barrels (`./hooks`) must become `./hooks/index.js`;
            // `./hooks.js` cannot be resolved when `hooks` is a directory.
            const extensionless = specifier.replace(/\.js$/, '')
            if (existsSync(resolve(dirname(declaration), extensionless, 'index.d.ts'))) {
              return `${prefix}${extensionless}/index.js${suffix}`
            }

            if (specifier !== extensionless) return match
            return `${prefix}${specifier}.js${suffix}`
          },
        )
        if (rewritten !== source) writeFileSync(declaration, rewritten)
      }
    },
  }
}

/** Runtime packages a library must not inline: everything it declares. */
function readDeclaredExternal(packageDir: string): string[] {
  const manifestPath = resolve(packageDir, 'package.json')
  if (!existsSync(manifestPath)) return []

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    dependencies?: Record<string, string>
    optionalDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }

  return [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]
}

function removeTestDeclarations(directory: string): void {
  for (const entry of readdirSync(directory)) {
    const path = resolve(directory, entry)
    if (!statSync(path).isDirectory()) continue
    if (entry === '__tests__') {
      rmSync(path, { recursive: true, force: true })
      continue
    }
    removeTestDeclarations(path)
  }
}

function collectDeclarations(directory: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(directory)) {
    const path = resolve(directory, entry)
    if (statSync(path).isDirectory()) {
      result.push(...collectDeclarations(path))
    } else if (path.endsWith('.d.ts')) {
      result.push(path)
    }
  }
  return result
}

export interface LibraryConfigOptions {
  /** Additional runtime dependencies to leave external in the bundle. */
  external?: string[]
  /** Entry file relative to the package directory. Defaults to `index.ts`. */
  entry?: string
  /** Declaration root relative to the package directory. Defaults to the package root. */
  entryRoot?: string
}

export function createLibraryConfig(packageDir: string, options: LibraryConfigOptions = {}) {
  const srcDir = resolve(packageDir, 'src')
  const outDir = resolve(packageDir, 'dist')
  const entryFile = resolve(packageDir, options.entry ?? 'index.ts')
  const declarationRoot = resolve(packageDir, options.entryRoot ?? '.')
  const declaredExternal = readDeclaredExternal(packageDir)

  return defineConfig({
    plugins: [
      vue(),
      dts({
        tsconfigPath: resolve(packageDir, '../../tsconfig.json'),
        entryRoot: declarationRoot,
        outDir,
        include: [entryFile, resolve(srcDir, '**/*.ts'), resolve(srcDir, '**/*.vue')],
        cleanVueFileName: true,
        copyDtsFiles: false,
        logLevel: 'warn',
      }),
      finalizeLibrary(outDir),
    ],
    build: {
      target: 'es2022',
      outDir,
      emptyOutDir: true,
      sourcemap: true,
      minify: false,
      cssCodeSplit: false,
      lib: {
        entry: entryFile,
        formats: ['es'],
        fileName: 'index',
        cssFileName: 'style',
      },
      rollupOptions: {
        external: ['vue', /^vue\//, /^@vue\//, ...declaredExternal, ...(options.external ?? [])],
        output: {
          exports: 'named',
        },
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          math: 'parens-division',
        },
      },
    },
  })
}
