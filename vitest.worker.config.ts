/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'worker-tests',
    globals: true,
    environment: 'miniflare',
    setupFiles: ['./tests/worker/setup.ts'],
    include: ['tests/worker/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 30000,
    hookTimeout: 15000,
    // Worker tests need more time for D1 operations
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        minForks: 1,
        maxForks: 2
      }
    },
    // Disable fake timers for worker tests that interact with real Cloudflare runtime
    fakeTimers: {
      toFake: []
    },
    env: {
      NODE_ENV: 'test',
      MINIFLARE_SCRIPT_PATH: 'src/worker.ts',
      MINIFLARE_MODULES: 'true'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
})