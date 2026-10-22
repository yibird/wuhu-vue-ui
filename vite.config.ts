import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite-plus'
import { workspaceSource } from './scripts/workspace-source'

export default defineConfig({
  plugins: [workspaceSource(), vue()],

  test: {
    environment: 'jsdom',
    include: ['packages/**/__tests__/**/*.spec.ts', 'tests/**/*.spec.ts'],
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
  },

  lint: {
    env: {
      browser: true,
      es2022: true,
      node: true,
    },
    categories: {
      correctness: 'error',
      suspicious: 'warn',
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'typescript/no-explicit-any': 'off',
      'unicorn/no-array-sort': 'off',
    },
    ignorePatterns: ['**/dist/**', '**/node_modules/**', 'playground/dist/**', 'pnpm-lock.yaml'],
  },

  fmt: {
    printWidth: 100,
    tabWidth: 2,
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    arrowParens: 'always',
    endOfLine: 'lf',
  },
})
