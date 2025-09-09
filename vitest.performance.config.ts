/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'performance-tests',
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/performance/setup.ts'],
    include: ['tests/performance/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 180000, // 3 minutes for performance tests
    hookTimeout: 60000,
    // Performance tests need dedicated resources
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        minForks: 1,
        maxForks: 1
      }
    },
    // Real timers for accurate performance measurement
    fakeTimers: {
      toFake: []
    },
    // No retries for performance tests (consistent results needed)
    retry: 0,
    // Sequential execution for consistent benchmarking
    sequence: {
      concurrent: false
    },
    // Custom reporters for performance metrics
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './tests/performance/results/performance-results.json'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
})