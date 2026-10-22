import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import less from 'less'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcFile = resolve(root, 'packages/tokens/src/index.less')
const outDir = resolve(root, 'packages/tokens/dist')

await mkdir(outDir, { recursive: true })

const source = await readFile(srcFile, 'utf8')
const result = await less.render(source, {
  filename: srcFile,
  paths: [dirname(srcFile)],
  javascriptEnabled: true,
})

await Promise.all([
  writeFile(resolve(outDir, 'index.css'), result.css, 'utf8'),
  copyFile(srcFile, resolve(outDir, 'index.less')),
])

process.stdout.write('✓ tokens built\n')
