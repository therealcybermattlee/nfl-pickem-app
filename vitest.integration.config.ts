/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration-tests',
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    include: ['tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 60000, // Integration tests may take longer
    hookTimeout: 30000,
    // Integration tests should run sequentially to avoid database conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Single fork for database consistency
        minForks: 1,
        maxForks: 1
      }
    },
    // Real timers for integration tests with external services
    fakeTimers: {
      toFake: []
    },
    // Retry failed tests once (for network-related flakiness)
    retry: 1,
    // Run tests in sequence to avoid conflicts
    sequence: {
      concurrent: false
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
})