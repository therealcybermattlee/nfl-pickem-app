import { test, expect } from '@playwright/test'

/**
 * PWA Functionality Validation Suite
 * 
 * Comprehensive testing of Progressive Web App features:
 * - Installation flow testing on mobile devices
 * - Offline functionality validation  
 * - Background sync verification
 * - Cache invalidation scenarios
 * - Update mechanisms testing
 * - Service Worker lifecycle validation
 * - App manifest and home screen behavior
 */

const PRODUCTION_SITE = 'https://pickem.cyberlees.dev'
const PWA_MANIFEST_URL = `${PRODUCTION_SITE}/manifest.json`

test.describe('PWA Functionality Validation', () => {
  test('PWA Manifest validation', async ({ page }) => {
    await page.goto(PRODUCTION_SITE)

    await test.step('Manifest file accessibility and structure', async () => {
      // Check if manifest is linked in HTML
      const manifestLink = page.locator('link[rel="manifest"]')
      await expect(manifestLink).toBeVisible()
      
      const manifestHref = await manifestLink.getAttribute('href')
      expect(manifestHref).toBeTruthy()

      // Fetch and validate manifest content
      const manifestResponse = await page.request.get(PWA_MANIFEST_URL)
      expect(manifestResponse.status()).toBe(200)
      
      const manifest = await manifestResponse.json()
      
      // Validate required PWA manifest fields
      expect(manifest).toHaveProperty('name')
      expect(manifest).toHaveProperty('short_name')
      expect(manifest).toHaveProperty('start_url')
      expect(manifest).toHaveProperty('display')
      expect(manifest).toHaveProperty('theme_color')
      expect(manifest).toHaveProperty('background_color')
      expect(manifest).toHaveProperty('icons')
      
      // Validate icons array
      expect(Array.isArray(manifest.icons)).toBeTruthy()
      expect(manifest.icons.length).toBeGreaterThan(0)
      
      // Check for required icon sizes
      const iconSizes = manifest.icons.map((icon: any) => icon.sizes)
      expect(iconSizes).toContain('192x192') // Required for PWA
      expect(iconSizes).toContain('512x512') // Required for PWA
      
      console.log('PWA Manifest validation passed:', {
        name: manifest.name,
        shortName: manifest.short_name,
        display: manifest.display,
        icons: manifest.icons.length
      })
    })

    await test.step('PWA installation criteria check', async () => {
      // Check for PWA installation prompt readiness
      const installPromptReady = await page.evaluate(async () => {
        // Check if beforeinstallprompt event is supported
        return 'onbeforeinstallprompt' in window
      })
      
      console.log('PWA installation prompt supported:', installPromptReady)
      
      // Check service worker registration
      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.getRegistration()
            return !!registration
          } catch (e) {
            return false
          }
        }
        return false
      })
      
      expect(swRegistered).toBeTruthy()
      console.log('Service Worker registered:', swRegistered)
    })
  })

  test('Service Worker lifecycle and caching', async ({ page, context }) => {
    await page.goto(PRODUCTION_SITE)

    await test.step('Service Worker registration and activation', async () => {
      // Wait for service worker to register
      await page.waitForFunction(() => {
        return navigator.serviceWorker.ready
      }, { timeout: 10000 })

      const swState = await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration()
        return {
          hasRegistration: !!registration,
          hasSW: !!registration?.active,
          state: registration?.active?.state,
          scriptURL: registration?.active?.scriptURL
        }
      })

      expect(swState.hasRegistration).toBeTruthy()
      expect(swState.hasSW).toBeTruthy()
      expect(swState.state).toBe('activated')
      
      console.log('Service Worker state:', swState)
    })

    await test.step('Cache API functionality', async () => {
      const cacheStatus = await page.evaluate(async () => {
        try {
          const cacheNames = await caches.keys()
          const results: Record<string, any> = {
            available: true,
            cacheNames: cacheNames,
            cacheCount: cacheNames.length
          }

          // Check if app cache exists and has resources
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName)
            const keys = await cache.keys()
            results[cacheName] = {
              resourceCount: keys.length,
              sampleResources: keys.slice(0, 5).map(req => req.url)
            }
          }

          return results
        } catch (error) {
          return { available: false, error: (error as Error).message }
        }
      })

      expect(cacheStatus.available).toBeTruthy()
      expect(cacheStatus.cacheCount).toBeGreaterThan(0)
      
      console.log('Cache API status:', {
        cacheCount: cacheStatus.cacheCount,
        cacheNames: cacheStatus.cacheNames
      })
    })

    await test.step('Background sync capability check', async () => {
      const backgroundSyncSupported = await page.evaluate(() => {
        return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
      })

      console.log('Background sync supported:', backgroundSyncSupported)
      
      if (backgroundSyncSupported) {
        const backgroundSyncRegistered = await page.evaluate(async () => {
          try {
            const registration = await navigator.serviceWorker.ready
            const tags = await (registration as any).sync.getTags()
            return { success: true, tags }
          } catch (error) {
            return { success: false, error: (error as Error).message }
          }
        })

        console.log('Background sync status:', backgroundSyncRegistered)
      }
    })
  })

  test('Offline functionality validation', async ({ page, context }) => {
    await test.step('Initial online setup', async () => {
      await page.goto(PRODUCTION_SITE)
      
      // Login to access authenticated features
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/')
      
      // Navigate to games page to cache game data
      await page.click('[data-testid="games-nav-link"]')
      await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
      
      // Wait for service worker to cache resources
      await page.waitForTimeout(2000)
    })

    await test.step('Offline mode activation', async () => {
      // Go offline
      await context.setOffline(true)
      
      // Verify offline status
      const isOffline = await page.evaluate(() => !navigator.onLine)
      expect(isOffline).toBeTruthy()
      
      console.log('App is now offline')
    })

    await test.step('Offline app functionality', async () => {
      // Refresh page while offline - should load from cache
      await page.reload({ waitUntil: 'networkidle' })
      
      // Basic app structure should still be available
      await expect(page.locator('body')).toBeVisible()
      
      // Check for offline indicator
      const offlineIndicators = [
        page.locator('text=offline'),
        page.locator('text=connection'),
        page.locator('[data-testid="offline-indicator"]'),
        page.locator('.offline-indicator')
      ]

      let hasOfflineIndicator = false
      for (const indicator of offlineIndicators) {
        if (await indicator.isVisible({ timeout: 2000 })) {
          hasOfflineIndicator = true
          console.log('Found offline indicator')
          break
        }
      }

      // App should either work offline or show appropriate offline message
      const gamesGridVisible = await page.locator('[data-testid="games-grid"]').isVisible({ timeout: 5000 })
      
      if (gamesGridVisible) {
        console.log('Games grid available offline - excellent offline support')
      } else if (hasOfflineIndicator) {
        console.log('Offline indicator shown - graceful degradation')
      } else {
        console.log('Checking for basic app shell availability')
        // At minimum, app shell should be available
        await expect(page.locator('header, nav, main')).toBeVisible()
      }
    })

    await test.step('Offline pick submission handling', async () => {
      const gameCard = page.locator('[data-testid="game-card"]').first()
      
      if (await gameCard.isVisible()) {
        const pickButton = gameCard.locator('button:has-text("Pick")').first()
        
        if (await pickButton.isVisible()) {
          await pickButton.click()
          
          // Should handle offline pick submission gracefully
          // Either queue for later or show appropriate message
          await page.waitForTimeout(2000)
          
          // Check if app provides feedback about offline state
          const offlineFeedback = [
            page.locator('text=queued'),
            page.locator('text=sync'),
            page.locator('text=offline'),
            page.locator('[data-testid="pick-queued"]')
          ]

          for (const feedback of offlineFeedback) {
            if (await feedback.isVisible({ timeout: 1000 })) {
              console.log('Found offline pick feedback')
              break
            }
          }
        }
      }
    })

    await test.step('Return to online mode', async () => {
      // Go back online
      await context.setOffline(false)
      
      // Wait for network to be available
      await page.waitForLoadState('networkidle')
      
      const isOnline = await page.evaluate(() => navigator.onLine)
      expect(isOnline).toBeTruthy()
      
      console.log('App is back online')
      
      // App should sync any pending changes
      await page.waitForTimeout(3000)
      
      // Validate app is fully functional again
      await page.reload()
      await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
    })
  })

  test('PWA installation simulation', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 }) // Mobile viewport
    await page.goto(PRODUCTION_SITE)

    await test.step('PWA install prompt readiness', async () => {
      // Simulate PWA installation criteria being met
      let installPromptEvent: any = null

      // Listen for beforeinstallprompt event
      await page.evaluate(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault()
          ;(window as any).deferredPrompt = e
        })
      })

      // Simulate conditions that trigger install prompt
      await page.evaluate(() => {
        // Simulate user engagement (multiple visits, time on site, etc.)
        const engagement = {
          visits: 3,
          timeOnSite: 300000, // 5 minutes
          interactions: 5
        }
        
        // Store engagement data
        localStorage.setItem('pwa-engagement', JSON.stringify(engagement))
      })

      // Check if install prompt is available
      const promptAvailable = await page.evaluate(() => {
        return 'deferredPrompt' in window && !!(window as any).deferredPrompt
      })

      console.log('Install prompt available:', promptAvailable)
    })

    await test.step('Add to Home Screen functionality', async () => {
      // Check if app can be added to home screen
      const addToHomeScreenCapable = await page.evaluate(() => {
        // Check PWA installation criteria
        const hasManifest = document.querySelector('link[rel="manifest"]')
        const hasServiceWorker = 'serviceWorker' in navigator
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost'
        
        return !!(hasManifest && hasServiceWorker && isSecure)
      })

      expect(addToHomeScreenCapable).toBeTruthy()
      console.log('Add to Home Screen capable:', addToHomeScreenCapable)

      // Simulate manual installation trigger
      const installResult = await page.evaluate(async () => {
        try {
          if ('deferredPrompt' in window && (window as any).deferredPrompt) {
            const prompt = (window as any).deferredPrompt
            const result = await prompt.prompt()
            return { success: true, outcome: result.outcome }
          }
          return { success: false, reason: 'No deferred prompt available' }
        } catch (error) {
          return { success: false, error: (error as Error).message }
        }
      })

      console.log('Installation simulation result:', installResult)
    })
  })

  test('PWA update mechanism', async ({ page, context }) => {
    await page.goto(PRODUCTION_SITE)

    await test.step('Service Worker update detection', async () => {
      // Simulate service worker update available
      const updateCheckResult = await page.evaluate(async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (!registration) return { available: false, reason: 'No registration' }

          return new Promise((resolve) => {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    resolve({ available: true, updateReady: true })
                  }
                })
              }
            })

            // Simulate update check
            registration.update().then(() => {
              // If no update found immediately, resolve
              setTimeout(() => resolve({ available: true, updateReady: false }), 1000)
            })
          })
        } catch (error) {
          return { available: false, error: (error as Error).message }
        }
      })

      console.log('Update check result:', updateCheckResult)
    })

    await test.step('Update notification and application', async () => {
      // Check if app shows update notification
      const updateNotifications = [
        page.locator('text=update available'),
        page.locator('text=new version'),
        page.locator('[data-testid="update-banner"]'),
        page.locator('.update-notification')
      ]

      let hasUpdateNotification = false
      for (const notification of updateNotifications) {
        if (await notification.isVisible({ timeout: 2000 })) {
          hasUpdateNotification = true
          console.log('Found update notification')
          
          // Try to trigger update
          const updateButton = notification.locator('button:has-text("Update"), button:has-text("Refresh")')
          if (await updateButton.isVisible()) {
            await updateButton.click()
            console.log('Clicked update button')
          }
          break
        }
      }

      console.log('Update notification available:', hasUpdateNotification)
    })
  })

  test('PWA performance metrics', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(PRODUCTION_SITE)

    await test.step('PWA performance benchmarks', async () => {
      // Wait for page to fully load
      await page.waitForLoadState('networkidle')

      const performanceMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
            const paint = performance.getEntriesByType('paint')
            
            const metrics = {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
              firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
              transferSize: navigation.transferSize,
              encodedBodySize: navigation.encodedBodySize,
              decodedBodySize: navigation.decodedBodySize
            }

            resolve(metrics)
          } else {
            resolve({ error: 'Performance API not available' })
          }
        })
      })

      console.log('PWA Performance Metrics:', performanceMetrics)

      if ('firstContentfulPaint' in performanceMetrics) {
        // PWA performance expectations
        expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000) // < 2s FCP
        expect(performanceMetrics.domContentLoaded).toBeLessThan(1000) // < 1s DCL
        
        // Bundle size expectations
        if (performanceMetrics.transferSize) {
          expect(performanceMetrics.transferSize).toBeLessThan(300 * 1024) // < 300KB transfer
        }
      }
    })

    await test.step('PWA Lighthouse audit simulation', async () => {
      // Simulate basic PWA audit checks
      const pwaFeatures = await page.evaluate(() => {
        const features = {
          serviceWorker: 'serviceWorker' in navigator,
          manifest: !!document.querySelector('link[rel="manifest"]'),
          httpsOrLocalhost: location.protocol === 'https:' || location.hostname === 'localhost',
          viewport: !!document.querySelector('meta[name="viewport"]'),
          themeColor: !!document.querySelector('meta[name="theme-color"]'),
          offlineCapable: false // Will be set based on SW registration
        }

        // Check if service worker is registered and active
        if (features.serviceWorker) {
          navigator.serviceWorker.getRegistration().then(reg => {
            features.offlineCapable = !!(reg?.active)
          })
        }

        return features
      })

      console.log('PWA Features Check:', pwaFeatures)

      // Basic PWA requirements
      expect(pwaFeatures.serviceWorker).toBeTruthy()
      expect(pwaFeatures.manifest).toBeTruthy()
      expect(pwaFeatures.httpsOrLocalhost).toBeTruthy()
      expect(pwaFeatures.viewport).toBeTruthy()

      // Calculate PWA score (simplified)
      const score = Object.values(pwaFeatures).filter(Boolean).length
      const totalChecks = Object.keys(pwaFeatures).length
      const pwaScore = (score / totalChecks) * 100

      console.log(`PWA Score: ${pwaScore.toFixed(0)}%`)
      expect(pwaScore).toBeGreaterThanOrEqual(85) // Minimum 85% PWA compliance
    })
  })
})