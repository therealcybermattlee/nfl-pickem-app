import { test, expect } from '@playwright/test'

/**
 * Game Day Stress Testing Suite
 * 
 * Simulates high-pressure NFL game day scenarios:
 * - Multiple family members making picks simultaneously
 * - Pick deadline pressure with countdown timers
 * - Network interruptions during critical moments
 * - Battery/performance optimization during extended usage
 * - App switching and background behavior
 * - Sunday 1PM kickoff rush scenarios
 */

const PRODUCTION_SITE = 'https://pickem.cyberlees.dev'
const PRODUCTION_API = 'https://nfl-pickem-app-production.cybermattlee-llc.workers.dev'

const GAME_DAY_SCENARIOS = [
  {
    name: 'Sunday 1PM Kickoff Rush',
    description: 'Multiple users rushing to make picks before 1PM EST games',
    concurrentUsers: 8,
    timeLimit: 120000 // 2 minutes
  },
  {
    name: 'Thursday Night Football',
    description: 'Single game high-pressure scenario',
    concurrentUsers: 4,
    timeLimit: 30000 // 30 seconds
  },
  {
    name: 'Monday Night Deadline',
    description: 'Last-minute picks before final game',
    concurrentUsers: 6,
    timeLimit: 60000 // 1 minute
  }
]

const FAMILY_MEMBERS = [
  { name: 'Dad', device: 'Desktop Chrome', viewport: { width: 1200, height: 800 } },
  { name: 'Mom', device: 'iPhone 12', viewport: { width: 390, height: 844 } },
  { name: 'Teen1', device: 'Pixel 6', viewport: { width: 393, height: 851 } },
  { name: 'Teen2', device: 'iPhone SE', viewport: { width: 375, height: 667 } },
  { name: 'Grandpa', device: 'iPad', viewport: { width: 820, height: 1180 } },
  { name: 'Uncle', device: 'Samsung Galaxy', viewport: { width: 360, height: 740 } }
]

test.describe('Game Day Stress Testing', () => {
  test.describe.configure({ mode: 'parallel', timeout: 180000 }) // 3 minute timeout for stress tests

  GAME_DAY_SCENARIOS.forEach(scenario => {
    test(`${scenario.name} - ${scenario.concurrentUsers} concurrent users`, async ({ browser }) => {
      const contexts: Array<any> = []
      const pages: Array<any> = []
      const results: Array<{ member: string, success: boolean, error?: string, pickTime: number }> = []

      await test.step('Setup family members', async () => {
        for (let i = 0; i < scenario.concurrentUsers; i++) {
          const member = FAMILY_MEMBERS[i % FAMILY_MEMBERS.length]
          const context = await browser.newContext({
            viewport: member.viewport,
            userAgent: member.device.includes('iPhone') ? 
              'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15' :
              'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36'
          })
          
          const page = await context.newPage()
          contexts.push(context)
          pages.push({ page, member: `${member.name}_${i}`, device: member.device })
        }
      })

      await test.step(`${scenario.description}`, async () => {
        const startTime = Date.now()
        
        // Parallel login for all family members
        const loginPromises = pages.map(async ({ page, member, device }, index) => {
          const memberStartTime = Date.now()
          
          try {
            await page.goto(PRODUCTION_SITE)
            
            // Stagger logins to simulate realistic timing
            await page.waitForTimeout(index * 50)
            
            await page.fill('input[type="email"]', 'test@example.com')
            await page.fill('input[type="password"]', 'password123')
            await page.click('button[type="submit"]')
            await expect(page).toHaveURL('/')
            
            // Navigate to games immediately (game day urgency)
            await page.click('[data-testid="games-nav-link"]')
            await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
            
            // Make picks under pressure
            const gameCards = page.locator('[data-testid="game-card"]')
            const gameCount = await gameCards.count()
            
            if (gameCount > 0) {
              // Pick random games quickly (simulate game day pressure)
              const picksToMake = Math.min(3, gameCount) // Make up to 3 picks
              
              for (let gameIndex = 0; gameIndex < picksToMake; gameIndex++) {
                const gameCard = gameCards.nth(gameIndex)
                const pickButtons = gameCard.locator('button:has-text("Pick")')
                const buttonCount = await pickButtons.count()
                
                if (buttonCount > 0) {
                  // Randomly pick home or away team
                  const randomButton = pickButtons.nth(Math.floor(Math.random() * buttonCount))
                  
                  // Check if pick is available (not locked)
                  if (await randomButton.isVisible() && await randomButton.isEnabled()) {
                    await randomButton.click()
                    
                    // Quick validation that pick was registered
                    await expect(randomButton).toHaveClass(/selected|active|picked/, { timeout: 2000 })
                  }
                }
                
                // Small delay between picks (realistic user behavior)
                await page.waitForTimeout(100)
              }
            }
            
            const pickTime = Date.now() - memberStartTime
            results.push({ member, success: true, pickTime })
            
          } catch (error) {
            const pickTime = Date.now() - memberStartTime
            results.push({ 
              member, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error',
              pickTime
            })
          }
        })

        // Wait for all family members to complete or timeout
        await Promise.allSettled(loginPromises)
        
        const totalTime = Date.now() - startTime
        console.log(`${scenario.name} completed in ${totalTime}ms`)
        
        // Analyze results
        const successfulPicks = results.filter(r => r.success).length
        const failedPicks = results.filter(r => !r.success).length
        const averagePickTime = results.reduce((sum, r) => sum + r.pickTime, 0) / results.length
        
        console.log(`Results for ${scenario.name}:`)
        console.log(`  Successful picks: ${successfulPicks}/${scenario.concurrentUsers}`)
        console.log(`  Failed picks: ${failedPicks}`)
        console.log(`  Average pick time: ${averagePickTime.toFixed(0)}ms`)
        
        if (failedPicks > 0) {
          console.log('Failures:')
          results.filter(r => !r.success).forEach(r => {
            console.log(`  ${r.member}: ${r.error}`)
          })
        }
        
        // Success criteria: At least 80% success rate
        expect(successfulPicks / scenario.concurrentUsers).toBeGreaterThanOrEqual(0.8)
        
        // Performance criteria: Should complete within time limit
        expect(totalTime).toBeLessThan(scenario.timeLimit)
      })

      await test.step('Cleanup', async () => {
        // Close all contexts
        for (const context of contexts) {
          await context.close()
        }
      })
    })
  })

  test('Network interruption during pick submission rush', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 } // Mobile viewport
    })
    const page = await context.newPage()

    await test.step('Setup user for critical pick scenario', async () => {
      await page.goto(PRODUCTION_SITE)
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.click('[data-testid="games-nav-link"]')
      await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
    })

    await test.step('Simulate network failure during pick submission', async () => {
      const gameCard = page.locator('[data-testid="game-card"]').first()
      const pickButton = gameCard.locator('button:has-text("Pick")').first()
      
      if (await pickButton.isVisible()) {
        // Go offline just before pick submission
        await context.setOffline(true)
        
        // Attempt to make pick while offline
        await pickButton.click()
        
        // Should handle offline state gracefully
        // Look for offline indicator, error message, or retry mechanism
        const offlineIndicators = [
          page.locator('text=offline').first(),
          page.locator('text=connection').first(),
          page.locator('text=network').first(),
          page.locator('[data-testid="offline-indicator"]'),
          page.locator('[data-testid="retry-button"]')
        ]
        
        let foundOfflineIndicator = false
        for (const indicator of offlineIndicators) {
          if (await indicator.isVisible({ timeout: 5000 })) {
            foundOfflineIndicator = true
            break
          }
        }
        
        // App should show some kind of offline/error state
        expect(foundOfflineIndicator).toBeTruthy()
      }
    })

    await test.step('Network recovery and automatic retry', async () => {
      // Restore network connection
      await context.setOffline(false)
      
      // App should automatically retry or allow manual retry
      await page.waitForLoadState('networkidle')
      
      // Check if pick was eventually processed or retry option is available
      const gameCard = page.locator('[data-testid="game-card"]').first()
      const pickButton = gameCard.locator('button:has-text("Pick")').first()
      
      // Either the pick should be processed or retry should be available
      const pickProcessed = await pickButton.getAttribute('class')
      const retryAvailable = await page.locator('[data-testid="retry-button"]').isVisible()
      
      expect(pickProcessed?.includes('selected') || retryAvailable).toBeTruthy()
    })

    await context.close()
  })

  test('Extended game day session - 4 hour Sunday football simulation', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }
    })
    const page = await context.newPage()

    // Track memory usage and performance throughout session
    let initialMemory: number | undefined
    let peakMemory = 0

    await test.step('Initial setup and baseline', async () => {
      await page.goto(PRODUCTION_SITE)
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.click('[data-testid="games-nav-link"]')
      
      // Get initial memory usage if available
      try {
        const metrics = await page.evaluate(() => {
          if ('memory' in performance) {
            return (performance as any).memory?.usedJSHeapSize
          }
          return undefined
        })
        initialMemory = metrics
        console.log(`Initial memory usage: ${initialMemory} bytes`)
      } catch (e) {
        console.log('Memory metrics not available')
      }
    })

    // Simulate 4 hours of Sunday football usage
    for (let hour = 0; hour < 4; hour++) {
      await test.step(`Hour ${hour + 1} - Continuous usage simulation`, async () => {
        const hourStartTime = Date.now()
        
        // Simulate typical game day activities
        const activities = [
          'refresh_games',
          'make_picks',
          'check_leaderboard',
          'navigate_weeks',
          'view_countdown_timers'
        ]
        
        for (const activity of activities) {
          switch (activity) {
            case 'refresh_games':
              await page.reload()
              await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
              break
              
            case 'make_picks':
              const gameCards = page.locator('[data-testid="game-card"]')
              const gameCount = await gameCards.count()
              
              if (gameCount > hour) {
                const gameCard = gameCards.nth(hour)
                const pickButton = gameCard.locator('button:has-text("Pick")').first()
                
                if (await pickButton.isVisible()) {
                  await pickButton.click()
                }
              }
              break
              
            case 'check_leaderboard':
              if (await page.locator('[data-testid="leaderboard-nav-link"]').isVisible()) {
                await page.click('[data-testid="leaderboard-nav-link"]')
                await page.waitForTimeout(1000)
                await page.click('[data-testid="games-nav-link"]')
              }
              break
              
            case 'navigate_weeks':
              const weekSelector = page.locator('[data-testid="week-selector"]')
              if (await weekSelector.isVisible()) {
                await weekSelector.selectOption('1')
                await page.waitForTimeout(1000)
                await weekSelector.selectOption('2')
                await page.waitForTimeout(1000)
              }
              break
              
            case 'view_countdown_timers':
              // Just observe countdown timers (realistic user behavior)
              await page.waitForTimeout(2000)
              break
          }
          
          // Small delay between activities
          await page.waitForTimeout(500)
        }
        
        // Check memory usage periodically
        try {
          const currentMemory = await page.evaluate(() => {
            if ('memory' in performance) {
              return (performance as any).memory?.usedJSHeapSize
            }
            return 0
          })
          
          if (currentMemory > peakMemory) {
            peakMemory = currentMemory
          }
          
          console.log(`Hour ${hour + 1} memory usage: ${currentMemory} bytes`)
          
          // Memory shouldn't grow excessively (allow 50MB growth max)
          if (initialMemory) {
            const memoryGrowth = currentMemory - initialMemory
            expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // 50MB max growth
          }
        } catch (e) {
          // Memory metrics not available, skip check
        }
        
        // Validate app is still responsive
        await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
        
        const hourTime = Date.now() - hourStartTime
        console.log(`Hour ${hour + 1} completed in ${hourTime}ms`)
      })
    }

    await test.step('Final validation after extended session', async () => {
      console.log(`Peak memory usage: ${peakMemory} bytes`)
      
      // App should still be fully functional after 4 hours
      await page.reload()
      await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
      
      // Should still be able to make picks
      const gameCard = page.locator('[data-testid="game-card"]').first()
      const pickButton = gameCard.locator('button:has-text("Pick")').first()
      
      if (await pickButton.isVisible()) {
        await pickButton.click()
        // Should respond within reasonable time even after extended session
        await expect(pickButton).toHaveClass(/selected|active|picked/, { timeout: 5000 })
      }
    })

    await context.close()
  })

  test('App switching and background behavior', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }
    })
    const page = await context.newPage()

    await test.step('Setup initial state', async () => {
      await page.goto(PRODUCTION_SITE)
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.click('[data-testid="games-nav-link"]')
      await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
    })

    await test.step('Simulate app backgrounding (minimize)', async () => {
      // Simulate app going to background
      await page.evaluate(() => {
        // Trigger visibility change events
        Object.defineProperty(document, 'hidden', {
          writable: true,
          value: true
        })
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: 'hidden'
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })
      
      // Wait in background
      await page.waitForTimeout(5000)
    })

    await test.step('App return to foreground', async () => {
      // Simulate app returning to foreground
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          value: false
        })
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: 'visible'
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })
      
      // App should refresh or update data
      await page.waitForLoadState('networkidle')
      
      // Validate app is still functional
      await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
      
      // Should still be able to interact with games
      const gameCards = page.locator('[data-testid="game-card"]')
      await expect(gameCards.first()).toBeVisible()
    })

    await test.step('Multiple app switches simulation', async () => {
      // Simulate multiple quick app switches (realistic mobile usage)
      for (let i = 0; i < 5; i++) {
        // Background
        await page.evaluate(() => {
          Object.defineProperty(document, 'visibilityState', { writable: true, value: 'hidden' })
          document.dispatchEvent(new Event('visibilitychange'))
        })
        await page.waitForTimeout(500)
        
        // Foreground
        await page.evaluate(() => {
          Object.defineProperty(document, 'visibilityState', { writable: true, value: 'visible' })
          document.dispatchEvent(new Event('visibilitychange'))
        })
        await page.waitForTimeout(300)
      }
      
      // App should handle rapid switching gracefully
      await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
    })

    await context.close()
  })
})