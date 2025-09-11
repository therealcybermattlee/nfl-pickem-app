/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Vitest Configuration for Mobile Component Testing
 * 
 * This configuration is specifically optimized for testing mobile UI components
 * with focus on:
 * - Touch interactions
 * - Viewport responsiveness  
 * - Performance benchmarks
 * - Accessibility compliance
 * - Visual regression prevention
 */

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'mobile-tests',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/components/setup.ts'],
    include: [
      'tests/components/mobile/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/accessibility/mobile-*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/performance/mobile-*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**', 
      '**/dist/**',
      '**/build/**',
      '**/*.d.ts'
    ],
    
    // Timeout settings optimized for mobile testing
    testTimeout: 20000, // Longer timeout for performance tests
    hookTimeout: 15000,
    
    // Parallel execution for faster test runs
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 2,
        maxThreads: 6
      }
    },
    
    // Enable fake timers for mobile animations and touch events
    fakeTimers: {
      toFake: [
        'setTimeout', 
        'clearTimeout', 
        'setInterval', 
        'clearInterval', 
        'Date',
        'performance'
      ]
    },
    
    // Enhanced Jest DOM matchers for mobile testing
    setupFilesAfterEnv: ['@testing-library/jest-dom'],
    
    // Coverage configuration for mobile components
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/mobile',
      include: [
        'src/components/mobile/**/*.{js,ts,jsx,tsx}',
        'src/hooks/mobile/**/*.{js,ts,jsx,tsx}',
        'src/utils/mobile/**/*.{js,ts,jsx,tsx}'
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.stories.{js,ts,jsx,tsx}',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}',
        '**/index.{js,ts}', // Re-export files
        '**/*.config.{js,ts}',
        'src/components/mobile/MobileComponentsDemo.tsx'
      ],
      
      // Strict coverage thresholds for mobile components
      thresholds: {
        global: {
          branches: 90,    // High branch coverage for mobile interactions
          functions: 95,   // High function coverage for component methods
          lines: 92,       // High line coverage for mobile logic
          statements: 92   // High statement coverage
        },
        // Specific thresholds for critical mobile components
        'src/components/mobile/MobileButton.tsx': {
          branches: 95,
          functions: 100,
          lines: 95,
          statements: 95
        },
        'src/components/mobile/MobileGameCard.tsx': {
          branches: 90,
          functions: 95,
          lines: 90,
          statements: 90
        },
        'src/components/mobile/MobileTeamSelector.tsx': {
          branches: 92,
          functions: 95,
          lines: 92,
          statements: 92
        }
      }
    },
    
    // Environment variables for mobile testing
    env: {
      NODE_ENV: 'test',
      MOBILE_TESTING: 'true',
      TOUCH_ENABLED: 'true'
    },
    
    // Custom reporters for mobile test results
    reporters: [
      'default',
      'json',
      ['html', { 
        outputFile: './test-results/mobile-test-report.html',
        title: 'Mobile Components Test Report'
      }],
      ['junit', { 
        outputFile: './test-results/mobile-junit.xml',
        suiteName: 'Mobile Component Tests'
      }]
    ]
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@mobile': path.resolve(__dirname, './src/components/mobile')
    }
  },
  
  // Optimizations for mobile component testing
  define: {
    'process.env.NODE_ENV': '"test"',
    '__MOBILE_TESTING__': true,
    '__TOUCH_ENABLED__': true
  },
  
  // CSS handling for mobile component styles
  css: {
    modules: {
      classNameStrategy: 'stable' // Consistent class names for testing
    }
  },
  
  // Build optimizations for test environment
  esbuild: {
    target: 'es2020',
    sourcemap: true
  }
})