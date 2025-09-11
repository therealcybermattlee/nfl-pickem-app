/**
 * Mobile-Specific Playwright Configuration
 * Dedicated configuration for comprehensive mobile UI testing
 * 
 * Features:
 * - Multi-device testing matrix
 * - Visual regression testing setup
 * - Performance monitoring integration
 * - Accessibility testing configuration
 * - Parallel execution optimization
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/mobile-ui',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI for stability */
  workers: process.env.CI ? 2 : undefined,
  
  /* Reporter configuration with detailed mobile-specific reporting */
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report-mobile',
      open: 'never' 
    }],
    ['json', { 
      outputFile: 'tests/mobile-ui/results/mobile-test-results.json' 
    }],
    ['junit', { 
      outputFile: 'tests/mobile-ui/results/mobile-test-results.xml' 
    }],
    ['line'], // Console output
    // Custom mobile reporter for performance metrics
    ['./tests/mobile-ui/reporters/mobile-performance-reporter.js']
  ],
  
  /* Shared settings for all mobile projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each test */
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    /* Locale and timezone for consistent testing */
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    /* Color scheme preference */
    colorScheme: 'light',
    
    /* Reduced motion for consistent testing */
    reducedMotion: 'reduce'
  },

  /* Configure mobile device testing matrix */
  projects: [
    // Setup project for authentication
    {
      name: 'mobile-setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['iPhone 12'] }
    },

    // Small Mobile Devices
    {
      name: 'iPhone SE',
      use: { 
        ...devices['iPhone SE'],
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: [
        '**/design-system-validation.test.ts',
        '**/touch-interactions.test.ts',
        '**/accessibility-comprehensive.test.ts'
      ]
    },

    // Standard Mobile Devices
    {
      name: 'iPhone 12',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: [
        '**/design-system-validation.test.ts',
        '**/cross-device-visual.test.ts',
        '**/touch-interactions.test.ts',
        '**/game-day-scenarios.test.ts'
      ]
    },
    
    {
      name: 'iPhone 14 Pro Max',
      use: { 
        ...devices['iPhone 14 Pro Max'],
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: [
        '**/cross-device-visual.test.ts',
        '**/performance-benchmarks.test.ts'
      ]
    },

    {
      name: 'Pixel 5',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: [
        '**/design-system-validation.test.ts',
        '**/cross-device-visual.test.ts',
        '**/accessibility-comprehensive.test.ts'
      ]
    },

    {
      name: 'Galaxy S21',
      use: {
        viewport: { width: 384, height: 854 },
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        deviceScaleFactor: 2.75,
        isMobile: true,
        hasTouch: true,
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: [
        '**/touch-interactions.test.ts',
        '**/game-day-scenarios.test.ts'
      ]
    },

    // Tablet Devices
    {
      name: 'iPad Mini',
      use: { 
        ...devices['iPad Mini'],
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: [
        '**/cross-device-visual.test.ts',
        '**/accessibility-comprehensive.test.ts'
      ]
    },

    // Performance Testing Project
    {
      name: 'Performance Testing',
      use: {
        ...devices['iPhone 12'],
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: '**/performance-benchmarks.test.ts',
      timeout: 60000 // Extended timeout for performance tests
    },

    // Accessibility Testing Project
    {
      name: 'Accessibility Audit',
      use: {
        ...devices['iPhone 12'],
        storageState: 'tests/mobile-ui/auth/mobile-user.json',
        // Enable accessibility testing features
        extraHTTPHeaders: {
          'X-Accessibility-Testing': 'true'
        }
      },
      dependencies: ['mobile-setup'],
      testMatch: '**/accessibility-comprehensive.test.ts',
      timeout: 45000
    },

    // Visual Regression Testing Project
    {
      name: 'Visual Regression',
      use: {
        ...devices['iPhone 12'],
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: '**/cross-device-visual.test.ts',
      timeout: 60000
    },

    // Game Day Stress Testing
    {
      name: 'Game Day Scenarios',
      use: {
        ...devices['iPhone 12'],
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: '**/game-day-scenarios.test.ts',
      timeout: 120000, // Extended timeout for stress tests
      retries: 1 // Fewer retries for stress tests
    },

    // Dark Mode Testing
    {
      name: 'Dark Mode',
      use: {
        ...devices['iPhone 12'],
        colorScheme: 'dark',
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: [
        '**/design-system-validation.test.ts',
        '**/accessibility-comprehensive.test.ts'
      ]
    },

    // High Contrast Mode Testing
    {
      name: 'High Contrast',
      use: {
        ...devices['iPhone 12'],
        forcedColors: 'active',
        storageState: 'tests/mobile-ui/auth/mobile-user.json'
      },
      dependencies: ['mobile-setup'],
      testMatch: '**/accessibility-comprehensive.test.ts'
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe'
    },
    {
      command: 'npm run workers:dev',
      url: 'http://localhost:8787',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe'
    }
  ],

  /* Global setup and teardown for mobile testing */
  globalSetup: './tests/mobile-ui/global-setup-mobile.ts',
  globalTeardown: './tests/mobile-ui/global-teardown-mobile.ts',

  /* Test output directory */
  outputDir: './tests/mobile-ui/results/',
  
  /* Test timeout */
  timeout: 45000,
  
  /* Expect timeout */
  expect: {
    timeout: 15000,
    // Screenshot comparison options for visual regression
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled',
      clip: { x: 0, y: 0, width: 390, height: 844 },
      fullPage: false,
      threshold: 0.3,
      maxDiffPixels: 1000
    },
    toMatchSnapshot: {
      threshold: 0.3,
      maxDiffPixels: 1000
    }
  },

  /* Metadata for test reporting */
  metadata: {
    testSuite: 'Mobile UI Testing',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'test',
    browser: 'Mobile Browsers',
    deviceMatrix: [
      'iPhone SE', 'iPhone 12', 'iPhone 14 Pro Max',
      'Pixel 5', 'Galaxy S21', 'iPad Mini'
    ]
  }
});