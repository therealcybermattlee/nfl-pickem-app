/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'security-tests',
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/security/setup.ts'],
    include: ['tests/security/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 45000,
    hookTimeout: 20000,
    // Security tests may need isolation
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        minForks: 1,
        maxForks: 2
      }
    },
    // Mix of fake and real timers for security testing
    fakeTimers: {
      toFake: ['setTimeout', 'clearTimeout'] // Control timing for rate limiting tests
    },
    // No retries for security tests (failures should be consistent)
    retry: 0,
    // Custom reporter for security test results
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './tests/security/results/security-results.json'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
})