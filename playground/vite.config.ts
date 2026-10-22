import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { workspaceSource } from '../scripts/workspace-source'

export default defineConfig({
  plugins: [workspaceSource(), vue()],
  server: {
    port: 5173,
  },
  build: {
    target: 'es2022',
  },
})
