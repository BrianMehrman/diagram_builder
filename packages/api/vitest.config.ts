import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@diagram-builder/parser': path.resolve(__dirname, '../parser/src/index.ts'),
      '@diagram-builder/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
