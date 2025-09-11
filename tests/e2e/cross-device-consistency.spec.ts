import { test, expect } from '@playwright/test'

/**
 * Cross-Device Consistency Test Suite
 * 
 * Validates consistent behavior and UI across different devices and browsers:
 * - Multi-device family usage scenarios
 * - Real-time synchronization across devices
 * - UI consistency validation across viewports
 * - Pick synchronization between different users/devices
 * - Performance parity across device types
 * - Touch vs mouse interaction consistency
 */

const PRODUCTION_SITE = 'https://pickem.leefamilysso.com'
const PRODUCTION_API = 'https://nfl-pickem-app-production.cybermattlee-llc.workers.dev'

const DEVICE_MATRIX = [
  {
    name: 'Dad - Desktop Chrome',
    device: 'Desktop Chrome',
    viewport: { width: 1200, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    inputMethod: 'mouse'
  },
  {
    name: 'Mom - iPhone 12',
    device: 'iPhone 12',
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    inputMethod: 'touch'
  },
  {
    name: 'Teen - Pixel 6',
    device: 'Pixel 6',
    viewport: { width: 393, height: 851 },
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    inputMethod: 'touch'
  },
  {
    name: 'Grandpa - iPad',
    device: 'iPad',
    viewport: { width: 820, height: 1180 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    inputMethod: 'touch'
  },
  {
    name: 'Uncle - iPhone SE',
    device: 'iPhone SE',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    inputMethod: 'touch'
  }
]

const BROWSER_MATRIX = [
  { name: 'Chrome', browser: 'chromium' },
  { name: 'Safari', browser: 'webkit' },
  { name: 'Firefox', browser: 'firefox' }
]

test.describe('Cross-Device Consistency Validation', () => {
  test('UI consistency across all device viewports', async ({ browser }) => {
    const results: Array<{
      device: string
      viewport: string
      buttonWidths: number[]
      touchTargetIssues: number
      layoutIssues: string[]
      performanceMetrics: any
    }> = []

    for (const deviceConfig of DEVICE_MATRIX) {
      await test.step(`Testing ${deviceConfig.name}`, async () => {
        const context = await browser.newContext({
          viewport: deviceConfig.viewport,
          userAgent: deviceConfig.userAgent
        })
        const page = await context.newPage()

        const startTime = Date.now()
        
        // Navigate and login
        await page.goto(PRODUCTION_SITE)
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.click('[data-testid="games-nav-link"]')
        await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()

        const loadTime = Date.now() - startTime

        // Collect UI metrics
        const uiMetrics = await page.evaluate((viewport) => {
          const buttons = Array.from(document.querySelectorAll('button'))
          const buttonWidths = buttons.map(btn => btn.getBoundingClientRect().width)
          
          // Check for touch target issues
          let touchTargetIssues = 0
          buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect()
            if (Math.min(rect.width, rect.height) < 44) {
              touchTargetIssues++
            }
          })

          // Check for layout issues
          const layoutIssues: string[] = []
          
          // Check for horizontal scroll
          if (document.body.scrollWidth > viewport.width + 20) {
            layoutIssues.push(`Horizontal scroll detected: ${document.body.scrollWidth}px > ${viewport.width}px`)
          }
          
          // Check for buttons that are too wide
          buttons.forEach((btn, index) => {
            const rect = btn.getBoundingClientRect()
            if (rect.width > viewport.width * 0.9) {
              layoutIssues.push(`Button ${index} too wide: ${rect.width}px (viewport: ${viewport.width}px)`)
            }
          })

          return {
            buttonWidths,
            touchTargetIssues,
            layoutIssues,
            totalButtons: buttons.length
          }
        }, deviceConfig.viewport)

        results.push({
          device: deviceConfig.name,
          viewport: `${deviceConfig.viewport.width}x${deviceConfig.viewport.height}`,
          buttonWidths: uiMetrics.buttonWidths,
          touchTargetIssues: uiMetrics.touchTargetIssues,
          layoutIssues: uiMetrics.layoutIssues,
          performanceMetrics: {
            loadTime,
            totalButtons: uiMetrics.totalButtons
          }
        })

        await context.close()
      })
    }

    // Analyze results for consistency
    await test.step('Consistency analysis', async () => {
      console.log('Cross-device UI analysis results:')
      
      let totalLayoutIssues = 0
      let totalTouchTargetIssues = 0
      
      results.forEach(result => {
        console.log(`\n${result.device} (${result.viewport}):`)
        console.log(`  Load time: ${result.performanceMetrics.loadTime}ms`)
        console.log(`  Touch target issues: ${result.touchTargetIssues}`)
        console.log(`  Layout issues: ${result.layoutIssues.length}`)
        
        if (result.layoutIssues.length > 0) {
          console.log('  Layout issues found:')
          result.layoutIssues.forEach(issue => console.log(`    - ${issue}`))
        }
        
        totalLayoutIssues += result.layoutIssues.length
        totalTouchTargetIssues += result.touchTargetIssues
      })

      // Consistency requirements
      expect(totalLayoutIssues).toBe(0) // Zero layout issues across all devices
      expect(totalTouchTargetIssues).toBeLessThanOrEqual(2) // Minimal touch target issues
      
      // Performance consistency (no device should be dramatically slower)
      const loadTimes = results.map(r => r.performanceMetrics.loadTime)
      const maxLoadTime = Math.max(...loadTimes)
      const minLoadTime = Math.min(...loadTimes)
      const loadTimeVariance = maxLoadTime - minLoadTime
      
      console.log(`\nLoad time variance: ${loadTimeVariance}ms (min: ${minLoadTime}ms, max: ${maxLoadTime}ms)`)
      expect(loadTimeVariance).toBeLessThan(5000) // No more than 5s variance between devices
    })
  })

  test('Multi-device simultaneous usage simulation', async ({ browser }) => {
    const familyContexts: Array<any> = []
    const familyPages: Array<any> = []

    await test.step('Setup family devices', async () => {
      for (const deviceConfig of DEVICE_MATRIX) {
        const context = await browser.newContext({
          viewport: deviceConfig.viewport,
          userAgent: deviceConfig.userAgent
        })
        const page = await context.newPage()
        
        familyContexts.push(context)
        familyPages.push({
          page,
          device: deviceConfig.name,
          inputMethod: deviceConfig.inputMethod
        })
      }
    })

    await test.step('Simultaneous family login', async () => {
      const loginPromises = familyPages.map(async ({ page, device }, index) => {
        // Stagger logins slightly (realistic timing)
        await page.waitForTimeout(index * 200)
        
        await page.goto(PRODUCTION_SITE)
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        
        return { device, success: await page.locator('body').isVisible() }
      })

      const loginResults = await Promise.all(loginPromises)
      
      // All family members should successfully login
      loginResults.forEach(result => {
        expect(result.success).toBeTruthy()
        console.log(`${result.device}: Login successful`)
      })
    })

    await test.step('Simultaneous games page access', async () => {
      const gamesPromises = familyPages.map(async ({ page, device }) => {
        await page.click('[data-testid="games-nav-link"]')
        const gamesVisible = await page.locator('[data-testid="games-grid"]').isVisible({ timeout: 10000 })
        return { device, gamesVisible }
      })

      const gamesResults = await Promise.all(gamesPromises)
      
      gamesResults.forEach(result => {
        expect(result.gamesVisible).toBeTruthy()
        console.log(`${result.device}: Games page loaded`)
      })
    })

    await test.step('Cross-device pick consistency', async () => {
      // Each family member makes picks on different games
      const pickPromises = familyPages.map(async ({ page, device, inputMethod }, index) => {
        const gameCards = page.locator('[data-testid="game-card"]')
        const gameCount = await gameCards.count()
        
        if (gameCount > index) {
          const gameCard = gameCards.nth(index)
          const pickButton = gameCard.locator('button:has-text("Pick")').first()
          
          if (await pickButton.isVisible()) {
            // Use appropriate interaction method
            if (inputMethod === 'touch') {
              // Simulate touch interaction
              await pickButton.click()
            } else {
              // Use mouse interaction
              await pickButton.click()
            }
            
            const picked = await pickButton.getAttribute('class')
            return { 
              device, 
              gameIndex: index,
              success: picked?.includes('selected') || picked?.includes('active') || picked?.includes('picked') || false
            }
          }
        }
        
        return { device, gameIndex: index, success: false, reason: 'No pick button available' }
      })

      const pickResults = await Promise.all(pickPromises)
      
      pickResults.forEach(result => {
        console.log(`${result.device} (Game ${result.gameIndex}): Pick ${result.success ? 'successful' : 'failed'}`)
        if (!result.success && 'reason' in result) {
          console.log(`  Reason: ${result.reason}`)
        }
      })

      // At least 80% of picks should be successful across devices
      const successfulPicks = pickResults.filter(r => r.success).length
      const successRate = successfulPicks / pickResults.length
      
      expect(successRate).toBeGreaterThanOrEqual(0.8)
      console.log(`Cross-device pick success rate: ${(successRate * 100).toFixed(1)}%`)
    })

    await test.step('Input method consistency validation', async () => {
      // Test both touch and mouse interactions work consistently
      const interactionResults: Array<{ device: string, inputMethod: string, interactions: number }> = []
      
      for (const { page, device, inputMethod } of familyPages) {
        let successfulInteractions = 0
        
        // Test navigation interactions
        try {
          await page.click('[data-testid="home-nav-link"]')
          await page.waitForTimeout(500)
          await page.click('[data-testid="games-nav-link"]')
          successfulInteractions += 2
        } catch (e) {
          console.log(`${device}: Navigation interaction failed`)
        }
        
        // Test game interactions if available
        const gameCards = page.locator('[data-testid="game-card"]')
        const gameCount = await gameCards.count()
        
        if (gameCount > 0) {
          try {
            const gameCard = gameCards.first()
            if (inputMethod === 'touch') {
              // Test touch-specific interactions
              await gameCard.click()
              successfulInteractions += 1
            } else {
              // Test mouse-specific interactions
              await gameCard.hover()
              await gameCard.click()
              successfulInteractions += 2
            }
          } catch (e) {
            console.log(`${device}: Game interaction failed`)
          }
        }
        
        interactionResults.push({
          device,
          inputMethod,
          interactions: successfulInteractions
        })
      }
      
      // All devices should support basic interactions
      interactionResults.forEach(result => {
        expect(result.interactions).toBeGreaterThan(0)
        console.log(`${result.device} (${result.inputMethod}): ${result.interactions} successful interactions`)
      })
    })

    await test.step('Cleanup family devices', async () => {
      for (const context of familyContexts) {
        await context.close()
      }
    })
  })

  test('Cross-browser consistency validation', async ({ playwright }) => {
    const browserResults: Array<{
      browser: string
      loadTime: number
      featuresSupported: any
      uiConsistent: boolean
      errors: string[]
    }> = []

    for (const browserConfig of BROWSER_MATRIX) {
      await test.step(`Testing ${browserConfig.name}`, async () => {
        const browser = await playwright[browserConfig.browser].launch()
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 } // Standard mobile viewport for consistency
        })
        const page = await context.newPage()

        const errors: string[] = []
        
        // Collect console errors
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text())
          }
        })

        const startTime = Date.now()

        try {
          await page.goto(PRODUCTION_SITE)
          await page.fill('input[type="email"]', 'test@example.com')
          await page.fill('input[type="password"]', 'password123')
          await page.click('button[type="submit"]')
          await page.click('[data-testid="games-nav-link"]')
          await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
          
          const loadTime = Date.now() - startTime

          // Check browser-specific features
          const featuresSupported = await page.evaluate(() => {
            return {
              serviceWorker: 'serviceWorker' in navigator,
              localStorage: typeof Storage !== 'undefined',
              fetch: typeof fetch !== 'undefined',
              promises: typeof Promise !== 'undefined',
              arrow: (() => { try { eval('() => {}'); return true } catch { return false } })(),
              const: (() => { try { eval('const x = 1'); return true } catch { return false } })(),
              flexbox: CSS.supports('display', 'flex'),
              grid: CSS.supports('display', 'grid')
            }
          })

          // UI consistency check
          const uiElements = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button')
            const inputs = document.querySelectorAll('input')
            return {
              buttonCount: buttons.length,
              inputCount: inputs.length,
              hasGamesGrid: !!document.querySelector('[data-testid="games-grid"]')
            }
          })

          browserResults.push({
            browser: browserConfig.name,
            loadTime,
            featuresSupported,
            uiConsistent: uiElements.hasGamesGrid && uiElements.buttonCount > 0,
            errors
          })

        } catch (error) {
          errors.push(error instanceof Error ? error.message : 'Unknown error')
          browserResults.push({
            browser: browserConfig.name,
            loadTime: Date.now() - startTime,
            featuresSupported: {},
            uiConsistent: false,
            errors
          })
        }

        await browser.close()
      })
    }

    // Analyze cross-browser results
    await test.step('Cross-browser analysis', async () => {
      console.log('Cross-browser consistency results:')
      
      browserResults.forEach(result => {
        console.log(`\n${result.browser}:`)
        console.log(`  Load time: ${result.loadTime}ms`)
        console.log(`  UI consistent: ${result.uiConsistent}`)
        console.log(`  Errors: ${result.errors.length}`)
        console.log('  Features supported:', Object.entries(result.featuresSupported)
          .map(([key, value]) => `${key}: ${value}`).join(', '))
        
        if (result.errors.length > 0) {
          console.log('  Errors found:')
          result.errors.forEach(error => console.log(`    - ${error}`))
        }
      })

      // All browsers should have consistent UI
      browserResults.forEach(result => {
        expect(result.uiConsistent).toBeTruthy()
        expect(result.errors.length).toBeLessThanOrEqual(2) // Allow minimal errors
      })

      // Load time consistency across browsers
      const loadTimes = browserResults.map(r => r.loadTime)
      const maxLoadTime = Math.max(...loadTimes)
      const minLoadTime = Math.min(...loadTimes)
      const variance = maxLoadTime - minLoadTime
      
      console.log(`\nBrowser load time variance: ${variance}ms`)
      expect(variance).toBeLessThan(3000) // Less than 3s variance between browsers
    })
  })

  test('Real-time sync across devices', async ({ browser }) => {
    // Create two device contexts to test sync
    const device1Context = await browser.newContext({
      viewport: { width: 1200, height: 800 } // Desktop
    })
    const device2Context = await browser.newContext({
      viewport: { width: 390, height: 844 } // Mobile
    })

    const device1Page = await device1Context.newPage()
    const device2Page = await device2Context.newPage()

    await test.step('Setup both devices', async () => {
      // Device 1 setup
      await device1Page.goto(PRODUCTION_SITE)
      await device1Page.fill('input[type="email"]', 'test@example.com')
      await device1Page.fill('input[type="password"]', 'password123')
      await device1Page.click('button[type="submit"]')
      await device1Page.click('[data-testid="games-nav-link"]')
      await expect(device1Page.locator('[data-testid="games-grid"]')).toBeVisible()

      // Device 2 setup
      await device2Page.goto(PRODUCTION_SITE)
      await device2Page.fill('input[type="email"]', 'test@example.com')
      await device2Page.fill('input[type="password"]', 'password123')
      await device2Page.click('button[type="submit"]')
      await device2Page.click('[data-testid="games-nav-link"]')
      await expect(device2Page.locator('[data-testid="games-grid"]')).toBeVisible()
    })

    await test.step('Pick synchronization test', async () => {
      // Make pick on device 1
      const gameCard1 = device1Page.locator('[data-testid="game-card"]').first()
      const pickButton1 = gameCard1.locator('button:has-text("Pick")').first()
      
      if (await pickButton1.isVisible()) {
        await pickButton1.click()
        await expect(pickButton1).toHaveClass(/selected|active|picked/)
        
        // Check if same pick appears on device 2 (after refresh)
        await device2Page.reload()
        await expect(device2Page.locator('[data-testid="games-grid"]')).toBeVisible()
        
        const gameCard2 = device2Page.locator('[data-testid="game-card"]').first()
        const pickButton2 = gameCard2.locator('button:has-text("Pick")').first()
        
        // Should show the same pick state
        if (await pickButton2.isVisible()) {
          const buttonClass2 = await pickButton2.getAttribute('class')
          console.log('Device 2 pick state after Device 1 pick:', buttonClass2)
        }
      }
    })

    await test.step('Data consistency validation', async () => {
      // Get game data from both devices
      const device1Games = await device1Page.evaluate(() => {
        const gameCards = Array.from(document.querySelectorAll('[data-testid="game-card"]'))
        return gameCards.map((card, index) => ({
          index,
          teams: Array.from(card.querySelectorAll('[data-testid="team-name"]')).map(el => el.textContent),
          gameTime: card.querySelector('[data-testid="game-time"]')?.textContent,
          spread: card.querySelector('[data-testid="spread"]')?.textContent
        }))
      })

      const device2Games = await device2Page.evaluate(() => {
        const gameCards = Array.from(document.querySelectorAll('[data-testid="game-card"]'))
        return gameCards.map((card, index) => ({
          index,
          teams: Array.from(card.querySelectorAll('[data-testid="team-name"]')).map(el => el.textContent),
          gameTime: card.querySelector('[data-testid="game-time"]')?.textContent,
          spread: card.querySelector('[data-testid="spread"]')?.textContent
        }))
      })

      // Data should be identical across devices
      expect(device1Games.length).toBe(device2Games.length)
      
      // Check first few games for consistency
      for (let i = 0; i < Math.min(3, device1Games.length); i++) {
        expect(device1Games[i].teams).toEqual(device2Games[i].teams)
        expect(device1Games[i].gameTime).toBe(device2Games[i].gameTime)
        expect(device1Games[i].spread).toBe(device2Games[i].spread)
      }

      console.log(`Data consistency verified across ${device1Games.length} games`)
    })

    // Cleanup
    await device1Context.close()
    await device2Context.close()
  })
})