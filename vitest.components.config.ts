/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'component-tests',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/components/setup.ts'],
    include: ['tests/components/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 15000,
    hookTimeout: 10000,
    // Component tests benefit from parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 2,
        maxThreads: 4
      }
    },
    // Enable fake timers for component tests (countdown timers, etc.)
    fakeTimers: {
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date']
    },
    // Additional Jest DOM matchers
    setupFilesAfterEnv: ['@testing-library/jest-dom'],
    coverage: {
      include: ['src/components/**', 'src/hooks/**'],
      exclude: ['**/*.d.ts', '**/*.stories.tsx'],
      reporter: ['text', 'json'],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
})