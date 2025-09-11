import { test, expect } from '@playwright/test'

/**
 * Production Environment Validation Suite
 * 
 * Tests the live production environment with real data scenarios:
 * - Production API endpoints and data consistency
 * - Real NFL games and betting lines
 * - Performance under production load
 * - Network condition variations
 * - Cross-browser compatibility on production
 */

const PRODUCTION_API = 'https://nfl-pickem-app-production.cybermattlee-llc.workers.dev'
const PRODUCTION_SITE = 'https://pickem.leefamilysso.com'

const NETWORK_CONDITIONS = [
  { name: 'Fast 3G', downloadThroughput: 1.5 * 1024, uploadThroughput: 750, latency: 40 },
  { name: 'Slow 3G', downloadThroughput: 0.5 * 1024, uploadThroughput: 250, latency: 400 },
  { name: 'WiFi', downloadThroughput: 10 * 1024, uploadThroughput: 5 * 1024, latency: 10 }
]

test.describe('Production Environment Validation', () => {
  test.describe.configure({ mode: 'serial' }) // Run tests sequentially to avoid rate limiting

  test.beforeAll(async () => {
    // Validate production API is accessible
    const response = await fetch(`${PRODUCTION_API}/api/health`)
    expect(response.status).toBe(200)
  })

  test('Production API health and endpoints validation', async ({ request }) => {
    await test.step('API Health Check', async () => {
      const response = await request.get(`${PRODUCTION_API}/api/health`)
      expect(response.status()).toBe(200)
      
      const healthData = await response.json()
      expect(healthData).toHaveProperty('status', 'ok')
    })

    await test.step('Authentication endpoint', async () => {
      const loginResponse = await request.post(`${PRODUCTION_API}/api/auth/login`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      })
      expect(loginResponse.status()).toBe(200)
      
      const loginData = await loginResponse.json()
      expect(loginData).toHaveProperty('token')
      expect(loginData).toHaveProperty('user')
    })

    await test.step('Games endpoint with real data', async () => {
      // Get auth token first
      const loginResponse = await request.post(`${PRODUCTION_API}/api/auth/login`, {
        data: { email: 'test@example.com', password: 'password123' }
      })
      const { token } = await loginResponse.json()

      const gamesResponse = await request.get(`${PRODUCTION_API}/api/games`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      expect(gamesResponse.status()).toBe(200)
      
      const gamesData = await gamesResponse.json()
      expect(Array.isArray(gamesData)).toBeTruthy()
      
      if (gamesData.length > 0) {
        const firstGame = gamesData[0]
        // Validate game structure
        expect(firstGame).toHaveProperty('id')
        expect(firstGame).toHaveProperty('homeTeam')
        expect(firstGame).toHaveProperty('awayTeam')
        expect(firstGame).toHaveProperty('gameTime')
        expect(firstGame).toHaveProperty('week')
        expect(firstGame).toHaveProperty('season')
      }
    })

    await test.step('Picks endpoint functionality', async () => {
      const loginResponse = await request.post(`${PRODUCTION_API}/api/auth/login`, {
        data: { email: 'test@example.com', password: 'password123' }
      })
      const { token } = await loginResponse.json()

      const picksResponse = await request.get(`${PRODUCTION_API}/api/picks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      expect(picksResponse.status()).toBe(200)
      
      const picksData = await picksResponse.json()
      expect(Array.isArray(picksData)).toBeTruthy()
    })
  })

  NETWORK_CONDITIONS.forEach(condition => {
    test(`Production site performance - ${condition.name}`, async ({ page, context }) => {
      // Simulate network conditions
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, condition.latency))
        await route.continue()
      })

      // Set viewport to mobile for performance testing
      await page.setViewportSize({ width: 390, height: 844 })

      const startTime = Date.now()
      
      await test.step('Page load performance', async () => {
        await page.goto(PRODUCTION_SITE)
        
        const loadTime = Date.now() - startTime
        console.log(`${condition.name} load time: ${loadTime}ms`)
        
        // Performance expectations based on network condition
        if (condition.name === 'WiFi') {
          expect(loadTime).toBeLessThan(3000) // 3s for WiFi
        } else if (condition.name === 'Fast 3G') {
          expect(loadTime).toBeLessThan(5000) // 5s for Fast 3G
        } else {
          expect(loadTime).toBeLessThan(10000) // 10s for Slow 3G
        }
      })

      await test.step('Login performance under network conditions', async () => {
        const loginStartTime = Date.now()
        
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        
        await expect(page).toHaveURL('/')
        
        const loginTime = Date.now() - loginStartTime
        console.log(`${condition.name} login time: ${loginTime}ms`)
        
        // Login should complete within reasonable time even on slow networks
        expect(loginTime).toBeLessThan(15000)
      })

      await test.step('Games page performance', async () => {
        const gamesStartTime = Date.now()
        
        await page.click('[data-testid="games-nav-link"]')
        await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
        
        const gamesTime = Date.now() - gamesStartTime
        console.log(`${condition.name} games load time: ${gamesTime}ms`)
        
        expect(gamesTime).toBeLessThan(10000) // 10s max for games load
      })
    })
  })

  test('Production data consistency validation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(PRODUCTION_SITE)

    // Login
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await test.step('Home page data validation', async () => {
      // Validate home page shows current week games
      await expect(page.locator('[data-testid="current-week-games"]')).toBeVisible()
      
      // Check for game cards with real data
      const gameCards = page.locator('[data-testid="game-card"]')
      const gameCount = await gameCards.count()
      
      if (gameCount > 0) {
        const firstGame = gameCards.first()
        
        // Validate game has required data
        await expect(firstGame.locator('[data-testid="team-name"]')).toHaveCount(2) // Home and away teams
        await expect(firstGame.locator('[data-testid="game-time"]')).toBeVisible()
        
        // Check for betting lines (if available)
        const spreadElement = firstGame.locator('[data-testid="spread"]')
        if (await spreadElement.isVisible()) {
          const spreadText = await spreadElement.textContent()
          expect(spreadText).toMatch(/-?\d+\.?\d*/) // Should be a number with optional decimal
        }
      }
    })

    await test.step('Games page data consistency', async () => {
      await page.click('[data-testid="games-nav-link"]')
      await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
      
      // Get games data and validate structure
      const gameCards = page.locator('[data-testid="game-card"]')
      const gameCount = await gameCards.count()
      
      console.log(`Found ${gameCount} games on production`)
      
      if (gameCount > 0) {
        // Validate first few games have consistent data structure
        for (let i = 0; i < Math.min(3, gameCount); i++) {
          const gameCard = gameCards.nth(i)
          
          // Each game should have teams and time
          await expect(gameCard.locator('[data-testid="team-name"]')).toHaveCount(2)
          await expect(gameCard.locator('[data-testid="game-time"]')).toBeVisible()
          
          // Validate mobile-responsive layout
          const cardBox = await gameCard.boundingBox()
          if (cardBox) {
            expect(cardBox.width).toBeLessThan(400) // Should fit in mobile viewport
          }
        }
      }
    })

    await test.step('Time-lock system validation in production', async () => {
      // Look for countdown timers or lock indicators
      const countdownElements = page.locator('[data-testid="countdown-timer"]')
      const lockElements = page.locator('[data-testid="game-lock-status"]')
      
      const countdownCount = await countdownElements.count()
      const lockCount = await lockElements.count()
      
      console.log(`Countdown timers: ${countdownCount}, Lock indicators: ${lockCount}`)
      
      // At least some games should have timing information
      expect(countdownCount + lockCount).toBeGreaterThan(0)
      
      // If countdown timers are present, validate their format
      if (countdownCount > 0) {
        const firstCountdown = countdownElements.first()
        const countdownText = await firstCountdown.textContent()
        
        // Should show time format or status
        expect(countdownText).toMatch(/\d{1,2}:\d{2}:\d{2}|\d+[dhms]|Locked|Started|Final/i)
      }
    })
  })

  test('Production mobile UI validation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }) // iPhone 12
    await page.goto(PRODUCTION_SITE)

    await test.step('Critical UI fix validation - No full-width buttons', async () => {
      // Login first to access all buttons
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.click('[data-testid="games-nav-link"]')

      // Get all buttons on the page
      const allButtons = await page.locator('button').all()
      const fullWidthViolations: Array<{element: string, width: number, maxAllowed: number}> = []

      for (let i = 0; i < allButtons.length; i++) {
        const button = allButtons[i]
        
        if (await button.isVisible()) {
          const box = await button.boundingBox()
          if (box) {
            const maxAllowedWidth = 390 * 0.85 // 85% of viewport width is max acceptable
            
            if (box.width > maxAllowedWidth) {
              const buttonText = await button.textContent()
              fullWidthViolations.push({
                element: buttonText?.slice(0, 30) || `Button ${i}`,
                width: box.width,
                maxAllowed: maxAllowedWidth
              })
            }
          }
        }
      }

      // Log violations for debugging
      if (fullWidthViolations.length > 0) {
        console.log('Full-width button violations found:')
        fullWidthViolations.forEach(violation => {
          console.log(`  - "${violation.element}": ${violation.width}px (max allowed: ${violation.maxAllowed}px)`)
        })
      }

      // CRITICAL: Must pass with zero violations
      expect(fullWidthViolations.length).toBe(0)
    })

    await test.step('Touch target accessibility validation', async () => {
      const interactiveElements = await page.locator('button, a, [role="button"], input[type="submit"]').all()
      const touchTargetViolations: Array<{element: string, size: number}> = []

      for (let i = 0; i < Math.min(10, interactiveElements.length); i++) {
        const element = interactiveElements[i]
        
        if (await element.isVisible()) {
          const box = await element.boundingBox()
          if (box) {
            const minSize = Math.min(box.width, box.height)
            
            if (minSize < 44) { // 44px minimum per iOS guidelines
              const elementText = await element.textContent()
              touchTargetViolations.push({
                element: elementText?.slice(0, 30) || `Element ${i}`,
                size: minSize
              })
            }
          }
        }
      }

      if (touchTargetViolations.length > 0) {
        console.log('Touch target violations found:')
        touchTargetViolations.forEach(violation => {
          console.log(`  - "${violation.element}": ${violation.size}px (minimum: 44px)`)
        })
      }

      // Should have minimal violations (allow up to 2 for minor elements)
      expect(touchTargetViolations.length).toBeLessThanOrEqual(2)
    })
  })

  test('Production concurrent user simulation', async ({ context }) => {
    const NUM_CONCURRENT_USERS = 5
    const pages: Array<any> = []

    await test.step('Setup concurrent users', async () => {
      // Create multiple pages to simulate concurrent users
      for (let i = 0; i < NUM_CONCURRENT_USERS; i++) {
        const page = await context.newPage()
        await page.setViewportSize({ width: 390, height: 844 })
        pages.push(page)
      }
    })

    await test.step('Concurrent login simulation', async () => {
      const loginPromises = pages.map(async (page, index) => {
        await page.goto(PRODUCTION_SITE)
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        
        // Stagger logins slightly to simulate real usage
        await page.waitForTimeout(index * 100)
        await page.click('button[type="submit"]')
        
        return expect(page).toHaveURL('/')
      })

      // All logins should succeed
      await Promise.all(loginPromises)
    })

    await test.step('Concurrent games page access', async () => {
      const gamesPromises = pages.map(async (page) => {
        await page.click('[data-testid="games-nav-link"]')
        return expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
      })

      // All pages should load successfully
      await Promise.all(gamesPromises)
    })

    await test.step('Concurrent pick submissions', async () => {
      const pickPromises = pages.map(async (page, index) => {
        const gameCards = page.locator('[data-testid="game-card"]')
        const gameCount = await gameCards.count()
        
        if (gameCount > index) {
          const gameCard = gameCards.nth(index)
          const pickButton = gameCard.locator('button:has-text("Pick")').first()
          
          if (await pickButton.isVisible()) {
            await pickButton.click()
            // Should show selection or success state
            return expect(pickButton).toHaveClass(/selected|active|picked/)
          }
        }
      })

      // Filter out undefined promises
      const validPromises = pickPromises.filter(p => p)
      if (validPromises.length > 0) {
        await Promise.all(validPromises)
      }
    })

    await test.step('Cleanup concurrent users', async () => {
      // Close all pages
      for (const page of pages) {
        await page.close()
      }
    })
  })
})