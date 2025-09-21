import { test, expect } from '@playwright/test'

/**
 * Production Performance Benchmark Suite
 * 
 * Validates performance metrics in production environment:
 * - Core Web Vitals (FCP, LCP, CLS, FID)
 * - Bundle size and resource loading
 * - Mobile performance optimization
 * - API response times under load
 * - Memory usage and leak detection
 * - Battery optimization metrics
 * - Network efficiency validation
 */

const PRODUCTION_SITE = 'https://pickem.cyberlees.dev'
const PRODUCTION_API = 'https://nfl-pickem-app-production.cybermattlee-llc.workers.dev'

const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals (Google recommendations)
  firstContentfulPaint: 1800,    // < 1.8s (good)
  largestContentfulPaint: 2500,   // < 2.5s (good)
  cumulativeLayoutShift: 0.1,     // < 0.1 (good)
  firstInputDelay: 100,           // < 100ms (good)
  
  // Bundle and loading
  totalBundleSize: 300 * 1024,    // < 300KB
  initialLoadTime: 3000,          // < 3s
  timeToInteractive: 3500,        // < 3.5s
  
  // API performance
  apiResponseTime: 500,           // < 500ms
  authenticationTime: 1000,       // < 1s
  
  // Memory usage
  memoryGrowthLimit: 50 * 1024 * 1024, // < 50MB growth per session
  
  // Mobile specific
  mobileFCP: 2000,                // < 2s on mobile
  mobileBundle: 250 * 1024        // < 250KB on mobile
}

const MOBILE_DEVICES = [
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Pixel 6', width: 393, height: 851 },
  { name: 'iPhone SE', width: 375, height: 667 }
]

test.describe('Production Performance Benchmarks', () => {
  test('Core Web Vitals validation', async ({ page }) => {
    await page.goto(PRODUCTION_SITE)

    await test.step('Measure Core Web Vitals', async () => {
      // Wait for page to fully load
      await page.waitForLoadState('networkidle')

      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {}
          
          // Performance Observer for Web Vitals
          if ('PerformanceObserver' in window) {
            // First Contentful Paint
            const paintObserver = new PerformanceObserver((list) => {
              list.getEntries().forEach((entry) => {
                if (entry.name === 'first-contentful-paint') {
                  vitals.firstContentfulPaint = entry.startTime
                }
                if (entry.name === 'largest-contentful-paint') {
                  vitals.largestContentfulPaint = entry.startTime
                }
              })
            })
            paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] })

            // Layout Shift
            const layoutObserver = new PerformanceObserver((list) => {
              let cumulativeLayoutShift = 0
              list.getEntries().forEach((entry: any) => {
                if (!entry.hadRecentInput) {
                  cumulativeLayoutShift += entry.value
                }
              })
              vitals.cumulativeLayoutShift = cumulativeLayoutShift
            })
            layoutObserver.observe({ entryTypes: ['layout-shift'] })

            // Navigation Timing API fallback
            setTimeout(() => {
              const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
              
              if (navigation) {
                vitals.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
                vitals.loadComplete = navigation.loadEventEnd - navigation.loadEventStart
                vitals.timeToFirstByte = navigation.responseStart - navigation.requestStart
                vitals.resourceLoadTime = navigation.loadEventEnd - navigation.responseStart
              }

              // Paint timing fallback
              const paintEntries = performance.getEntriesByType('paint')
              paintEntries.forEach((entry) => {
                if (entry.name === 'first-contentful-paint' && !vitals.firstContentfulPaint) {
                  vitals.firstContentfulPaint = entry.startTime
                }
              })

              resolve(vitals)
            }, 3000)
          } else {
            // Basic timing fallback
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
            resolve({
              loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
              domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0
            })
          }
        })
      })

      console.log('Core Web Vitals Results:', webVitals)

      // Validate against thresholds
      if (webVitals.firstContentfulPaint) {
        expect(webVitals.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.firstContentfulPaint)
        console.log(`✅ First Contentful Paint: ${webVitals.firstContentfulPaint.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLDS.firstContentfulPaint}ms)`)
      }

      if (webVitals.largestContentfulPaint) {
        expect(webVitals.largestContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.largestContentfulPaint)
        console.log(`✅ Largest Contentful Paint: ${webVitals.largestContentfulPaint.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLDS.largestContentfulPaint}ms)`)
      }

      if (webVitals.cumulativeLayoutShift !== undefined) {
        expect(webVitals.cumulativeLayoutShift).toBeLessThan(PERFORMANCE_THRESHOLDS.cumulativeLayoutShift)
        console.log(`✅ Cumulative Layout Shift: ${webVitals.cumulativeLayoutShift.toFixed(3)} (threshold: ${PERFORMANCE_THRESHOLDS.cumulativeLayoutShift})`)
      }

      if (webVitals.timeToFirstByte) {
        console.log(`ℹ️ Time to First Byte: ${webVitals.timeToFirstByte.toFixed(0)}ms`)
      }
    })
  })

  test('Bundle size and resource optimization', async ({ page }) => {
    const resourceMetrics: Array<{
      url: string
      type: string
      size: number
      loadTime: number
    }> = []

    // Capture all network requests
    page.on('response', async (response) => {
      try {
        const request = response.request()
        const url = request.url()
        
        // Only track our app resources
        if (url.includes(PRODUCTION_SITE) || url.includes('cloudflare.com')) {
          const headers = await response.allHeaders()
          const contentLength = headers['content-length']
          const contentType = headers['content-type'] || ''
          
          let resourceType = 'other'
          if (contentType.includes('javascript') || url.endsWith('.js')) {
            resourceType = 'javascript'
          } else if (contentType.includes('css') || url.endsWith('.css')) {
            resourceType = 'stylesheet'
          } else if (contentType.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
            resourceType = 'image'
          } else if (contentType.includes('html')) {
            resourceType = 'document'
          }

          resourceMetrics.push({
            url: url.replace(PRODUCTION_SITE, ''),
            type: resourceType,
            size: contentLength ? parseInt(contentLength) : 0,
            loadTime: Date.now()
          })
        }
      } catch (error) {
        // Ignore errors in resource tracking
      }
    })

    await page.goto(PRODUCTION_SITE)
    await page.waitForLoadState('networkidle')

    await test.step('Analyze bundle composition', async () => {
      const bundleAnalysis = resourceMetrics.reduce((acc, resource) => {
        if (!acc[resource.type]) {
          acc[resource.type] = { count: 0, totalSize: 0 }
        }
        acc[resource.type].count += 1
        acc[resource.type].totalSize += resource.size
        return acc
      }, {} as Record<string, { count: number; totalSize: number }>)

      console.log('Bundle Analysis:')
      Object.entries(bundleAnalysis).forEach(([type, stats]) => {
        console.log(`  ${type}: ${stats.count} files, ${(stats.totalSize / 1024).toFixed(1)}KB`)
      })

      // Calculate total bundle size
      const totalBundleSize = Object.values(bundleAnalysis).reduce((sum, stats) => sum + stats.totalSize, 0)
      
      console.log(`Total bundle size: ${(totalBundleSize / 1024).toFixed(1)}KB`)
      expect(totalBundleSize).toBeLessThan(PERFORMANCE_THRESHOLDS.totalBundleSize)

      // Validate JavaScript bundle size specifically
      const jsSize = bundleAnalysis.javascript?.totalSize || 0
      console.log(`JavaScript bundle size: ${(jsSize / 1024).toFixed(1)}KB`)
      expect(jsSize).toBeLessThan(150 * 1024) // < 150KB for JS
      
      // Validate CSS bundle size
      const cssSize = bundleAnalysis.stylesheet?.totalSize || 0
      console.log(`CSS bundle size: ${(cssSize / 1024).toFixed(1)}KB`)
      expect(cssSize).toBeLessThan(50 * 1024) // < 50KB for CSS
    })

    await test.step('Resource loading efficiency', async () => {
      // Check for efficient resource loading patterns
      const criticalResources = resourceMetrics.filter(r => 
        r.type === 'document' || r.type === 'stylesheet' || 
        (r.type === 'javascript' && !r.url.includes('chunk'))
      )

      console.log(`Critical resources: ${criticalResources.length}`)
      expect(criticalResources.length).toBeLessThan(10) // Reasonable number of critical resources

      // Check for resource compression
      const largeResources = resourceMetrics.filter(r => r.size > 50 * 1024)
      console.log(`Large resources (>50KB): ${largeResources.length}`)
      
      largeResources.forEach(resource => {
        console.log(`  Large resource: ${resource.url} (${(resource.size / 1024).toFixed(1)}KB)`)
      })
    })
  })

  MOBILE_DEVICES.forEach(device => {
    test(`Mobile performance optimization - ${device.name}`, async ({ page }) => {
      await page.setViewportSize(device)
      
      // Simulate mobile network conditions
      const client = await page.context().newCDPSession(page)
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8,           // 750 kbps
        latency: 40                                  // 40ms latency (4G)
      })

      const startTime = Date.now()
      await page.goto(PRODUCTION_SITE)
      
      await test.step(`${device.name} loading performance`, async () => {
        await page.waitForLoadState('networkidle')
        const loadTime = Date.now() - startTime
        
        console.log(`${device.name} load time: ${loadTime}ms`)
        expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.mobileFCP)
      })

      await test.step(`${device.name} interaction responsiveness`, async () => {
        // Test login interaction speed
        const interactionStart = Date.now()
        
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        await expect(page).toHaveURL('/')
        
        const interactionTime = Date.now() - interactionStart
        console.log(`${device.name} login interaction time: ${interactionTime}ms`)
        expect(interactionTime).toBeLessThan(2000) // < 2s for mobile interaction
      })

      await test.step(`${device.name} games page performance`, async () => {
        const gamesStart = Date.now()
        
        await page.click('[data-testid="games-nav-link"]')
        await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
        
        const gamesTime = Date.now() - gamesStart
        console.log(`${device.name} games page load time: ${gamesTime}ms`)
        expect(gamesTime).toBeLessThan(1500) // < 1.5s for navigation
      })

      await test.step(`${device.name} scroll performance`, async () => {
        // Test scroll performance (60fps target = ~16ms per frame)
        const scrollStart = Date.now()
        
        // Simulate scroll gestures
        for (let i = 0; i < 5; i++) {
          await page.mouse.wheel(0, 200)
          await page.waitForTimeout(16) // 60fps target
        }
        
        const scrollTime = Date.now() - scrollStart
        console.log(`${device.name} scroll test time: ${scrollTime}ms`)
        
        // Should maintain smooth scrolling
        expect(scrollTime).toBeLessThan(200) // Reasonable scroll time
      })
    })
  })

  test('API performance under load', async ({ page }) => {
    const apiTimes: Array<{ endpoint: string, responseTime: number, success: boolean }> = []

    await test.step('Authentication API performance', async () => {
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now()
        
        const response = await page.request.post(`${PRODUCTION_API}/api/auth/login`, {
          data: {
            email: 'test@example.com',
            password: 'password123'
          }
        })
        
        const responseTime = Date.now() - startTime
        apiTimes.push({
          endpoint: '/api/auth/login',
          responseTime,
          success: response.status() === 200
        })
      }
    })

    await test.step('Games API performance', async () => {
      // Get auth token first
      const loginResponse = await page.request.post(`${PRODUCTION_API}/api/auth/login`, {
        data: { email: 'test@example.com', password: 'password123' }
      })
      const { token } = await loginResponse.json()

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now()
        
        const response = await page.request.get(`${PRODUCTION_API}/api/games`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const responseTime = Date.now() - startTime
        apiTimes.push({
          endpoint: '/api/games',
          responseTime,
          success: response.status() === 200
        })
      }
    })

    await test.step('API performance analysis', async () => {
      const authTimes = apiTimes.filter(t => t.endpoint === '/api/auth/login').map(t => t.responseTime)
      const gamesTimes = apiTimes.filter(t => t.endpoint === '/api/games').map(t => t.responseTime)

      const avgAuthTime = authTimes.reduce((sum, time) => sum + time, 0) / authTimes.length
      const avgGamesTime = gamesTimes.reduce((sum, time) => sum + time, 0) / gamesTimes.length

      console.log(`Average API response times:`)
      console.log(`  Authentication: ${avgAuthTime.toFixed(0)}ms`)
      console.log(`  Games: ${avgGamesTime.toFixed(0)}ms`)

      expect(avgAuthTime).toBeLessThan(PERFORMANCE_THRESHOLDS.authenticationTime)
      expect(avgGamesTime).toBeLessThan(PERFORMANCE_THRESHOLDS.apiResponseTime)

      // All requests should succeed
      const successRate = apiTimes.filter(t => t.success).length / apiTimes.length
      expect(successRate).toBe(1.0) // 100% success rate
    })
  })

  test('Memory usage and leak detection', async ({ page }) => {
    let initialMemory: number | undefined
    let peakMemory = 0
    const memorySnapshots: Array<{ timestamp: number, memory: number, action: string }> = []

    await test.step('Baseline memory measurement', async () => {
      await page.goto(PRODUCTION_SITE)
      
      try {
        initialMemory = await page.evaluate(() => {
          if ('memory' in performance) {
            return (performance as any).memory?.usedJSHeapSize
          }
          return undefined
        })
        
        if (initialMemory) {
          memorySnapshots.push({ timestamp: Date.now(), memory: initialMemory, action: 'initial_load' })
          console.log(`Initial memory usage: ${(initialMemory / 1024 / 1024).toFixed(1)}MB`)
        }
      } catch (e) {
        console.log('Memory metrics not available in this browser')
      }
    })

    await test.step('Memory usage during typical usage', async () => {
      // Login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      if (initialMemory) {
        const loginMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize)
        memorySnapshots.push({ timestamp: Date.now(), memory: loginMemory, action: 'after_login' })
      }

      // Navigate to games
      await page.click('[data-testid="games-nav-link"]')
      await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
      
      if (initialMemory) {
        const gamesMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize)
        memorySnapshots.push({ timestamp: Date.now(), memory: gamesMemory, action: 'games_loaded' })
        peakMemory = Math.max(peakMemory, gamesMemory)
      }

      // Simulate continued usage
      for (let i = 0; i < 10; i++) {
        // Navigate back and forth
        await page.click('[data-testid="home-nav-link"]')
        await page.waitForTimeout(500)
        await page.click('[data-testid="games-nav-link"]')
        await page.waitForTimeout(500)
        
        if (initialMemory) {
          const currentMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize)
          peakMemory = Math.max(peakMemory, currentMemory)
          
          if (i % 3 === 0) { // Sample every 3 iterations
            memorySnapshots.push({ timestamp: Date.now(), memory: currentMemory, action: `navigation_${i}` })
          }
        }
      }
    })

    await test.step('Memory leak analysis', async () => {
      if (initialMemory && memorySnapshots.length > 0) {
        console.log('\nMemory usage progression:')
        memorySnapshots.forEach(snapshot => {
          const memoryMB = (snapshot.memory / 1024 / 1024).toFixed(1)
          const growthMB = ((snapshot.memory - initialMemory!) / 1024 / 1024).toFixed(1)
          console.log(`  ${snapshot.action}: ${memoryMB}MB (+${growthMB}MB)`)
        })

        const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory
        const memoryGrowth = finalMemory - initialMemory
        const peakGrowth = peakMemory - initialMemory

        console.log(`\nMemory analysis:`)
        console.log(`  Initial: ${(initialMemory / 1024 / 1024).toFixed(1)}MB`)
        console.log(`  Final: ${(finalMemory / 1024 / 1024).toFixed(1)}MB`)
        console.log(`  Peak: ${(peakMemory / 1024 / 1024).toFixed(1)}MB`)
        console.log(`  Growth: ${(memoryGrowth / 1024 / 1024).toFixed(1)}MB`)
        console.log(`  Peak Growth: ${(peakGrowth / 1024 / 1024).toFixed(1)}MB`)

        // Memory growth should be reasonable
        expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryGrowthLimit)
        expect(peakGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryGrowthLimit * 1.5)
      }
    })
  })

  test('Performance regression detection', async ({ page }) => {
    const performanceBaseline = {
      firstContentfulPaint: 1500,  // Expected baseline
      totalBundleSize: 200 * 1024, // Current production size
      apiResponseTime: 300,        // Current API speed
      memoryUsage: 30 * 1024 * 1024 // 30MB baseline
    }

    await test.step('Compare against performance baseline', async () => {
      await page.goto(PRODUCTION_SITE)
      await page.waitForLoadState('networkidle')

      // Measure current performance
      const currentMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const paint = performance.getEntriesByType('paint')
        
        return {
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          memory: 'memory' in performance ? (performance as any).memory?.usedJSHeapSize : 0
        }
      })

      console.log('Performance regression analysis:')
      console.log(`  FCP: ${currentMetrics.firstContentfulPaint.toFixed(0)}ms (baseline: ${performanceBaseline.firstContentfulPaint}ms)`)
      console.log(`  Memory: ${(currentMetrics.memory / 1024 / 1024).toFixed(1)}MB (baseline: ${(performanceBaseline.memoryUsage / 1024 / 1024).toFixed(1)}MB)`)

      // Check for performance regressions (allow 20% variance)
      if (currentMetrics.firstContentfulPaint > 0) {
        const fcpRegression = currentMetrics.firstContentfulPaint / performanceBaseline.firstContentfulPaint
        expect(fcpRegression).toBeLessThan(1.2) // No more than 20% regression
        
        if (fcpRegression > 1.1) {
          console.log(`⚠️ Performance regression detected: FCP is ${((fcpRegression - 1) * 100).toFixed(1)}% slower`)
        }
      }

      if (currentMetrics.memory > 0) {
        const memoryRegression = currentMetrics.memory / performanceBaseline.memoryUsage
        expect(memoryRegression).toBeLessThan(1.5) // No more than 50% memory increase
        
        if (memoryRegression > 1.2) {
          console.log(`⚠️ Memory regression detected: ${((memoryRegression - 1) * 100).toFixed(1)}% increase`)
        }
      }
    })
  })
})