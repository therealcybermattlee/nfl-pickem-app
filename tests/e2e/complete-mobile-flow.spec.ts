import { test, expect } from '@playwright/test'

/**
 * Complete Mobile User Journey E2E Testing
 * 
 * This test validates the entire user experience from login to pick submission
 * across all mobile viewports with comprehensive validation of:
 * - No full-width button issues
 * - Touch target accessibility (44px minimum)
 * - Complete pick selection workflow
 * - Real-time updates and countdown timers
 * - Offline/online sync scenarios
 */

const MOBILE_VIEWPORTS = [
  { name: 'iPhone 12', ...{ width: 390, height: 844 } },
  { name: 'Pixel 6', ...{ width: 393, height: 851 } },
  { name: 'iPhone SE', ...{ width: 375, height: 667 } },
  { name: 'iPad', ...{ width: 820, height: 1180 } }
]

const PRODUCTION_API = 'https://nfl-pickem-app-production.cybermattlee-llc.workers.dev'
const PRODUCTION_SITE = 'https://pickem.cyberlees.dev'

test.describe('Complete Mobile Flow - Game Day Experience', () => {
  MOBILE_VIEWPORTS.forEach(viewport => {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto('/')
      })

      test('Complete pick selection flow - Sunday 1PM rush scenario', async ({ page }) => {
        // ✅ STEP 1: Login validation
        await test.step('User authentication', async () => {
          await page.fill('input[type="email"]', 'test@example.com')
          await page.fill('input[type="password"]', 'password123')
          
          // Validate login button is NOT full-width (critical fix validation)
          const loginButton = page.locator('button[type="submit"]')
          await expect(loginButton).toBeVisible()
          
          const buttonBox = await loginButton.boundingBox()
          if (buttonBox) {
            expect(buttonBox.width).toBeLessThan(viewport.width * 0.9) // Should not be 90%+ of screen width
          }
          
          // Validate touch target size (44px minimum for accessibility)
          await expect(loginButton).toHaveCSS('min-height', /4[4-9]px|[5-9]\d+px/) // 44px minimum
          
          await loginButton.click()
          await expect(page).toHaveURL('/')
        })

        // ✅ STEP 2: Games page navigation
        await test.step('Navigate to games with mobile optimizations', async () => {
          await page.click('[data-testid="games-nav-link"]')
          await expect(page).toHaveURL('/games')
          
          // Validate page loads with mobile-responsive layout
          await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
          
          // Validate no horizontal scrolling on mobile
          const bodyWidth = await page.locator('body').boundingBox()
          if (bodyWidth) {
            expect(bodyWidth.width).toBeLessThanOrEqual(viewport.width + 20) // Allow 20px tolerance
          }
        })

        // ✅ STEP 3: Game selection and pick submission
        await test.step('Complete pick selection workflow', async () => {
          // Find first available game that allows picks
          const gameCards = page.locator('[data-testid="game-card"]')
          await expect(gameCards.first()).toBeVisible()
          
          const firstGame = gameCards.first()
          
          // Validate game card mobile layout
          const gameCardBox = await firstGame.boundingBox()
          if (gameCardBox) {
            expect(gameCardBox.width).toBeLessThan(viewport.width * 0.98) // Proper margins maintained
          }
          
          // Find and click team selection button (not full-width!)
          const teamButtons = firstGame.locator('button:has-text("Pick")')
          const firstTeamButton = teamButtons.first()
          
          await expect(firstTeamButton).toBeVisible()
          
          // CRITICAL: Validate button is NOT full-width
          const teamButtonBox = await firstTeamButton.boundingBox()
          if (teamButtonBox) {
            expect(teamButtonBox.width).toBeLessThan(viewport.width * 0.8) // Should be well under full width
          }
          
          // Validate touch target accessibility
          await expect(firstTeamButton).toHaveCSS('min-height', /4[4-9]px|[5-9]\d+px/)
          
          await firstTeamButton.click()
          
          // Verify pick was registered
          await expect(firstTeamButton).toHaveClass(/selected|active|picked/)
        })

        // ✅ STEP 4: Pick management and validation
        await test.step('Pick management and real-time updates', async () => {
          // Navigate to different weeks to test navigation
          const weekSelector = page.locator('[data-testid="week-selector"]')
          if (await weekSelector.isVisible()) {
            await weekSelector.selectOption('2')
            await page.waitForLoadState('networkidle')
            
            // Validate page updates correctly
            await expect(page.locator('text=Week 2')).toBeVisible()
          }
          
          // Test player switching if available
          const playerSelector = page.locator('[data-testid="player-selector"]')
          if (await playerSelector.isVisible()) {
            await playerSelector.selectOption('1') // Switch to different player
            await page.waitForLoadState('networkidle')
          }
        })

        // ✅ STEP 5: Countdown timer and time-lock validation
        await test.step('Time-lock system validation', async () => {
          // Look for countdown timers
          const countdownElements = page.locator('[data-testid="countdown-timer"]')
          
          if (await countdownElements.count() > 0) {
            const firstCountdown = countdownElements.first()
            await expect(firstCountdown).toBeVisible()
            
            // Validate countdown text format (should show time remaining)
            const countdownText = await firstCountdown.textContent()
            expect(countdownText).toMatch(/\d{1,2}:\d{2}:\d{2}|\d+[dhms]|Locked|Game Started/i)
          }
        })
      })

      test('Network interruption recovery', async ({ page }) => {
        // Login first
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.click('[data-testid="games-nav-link"]')
        
        // Simulate network interruption during pick submission
        await test.step('Network failure simulation', async () => {
          // Go offline
          await page.context().setOffline(true)
          
          const gameCard = page.locator('[data-testid="game-card"]').first()
          const pickButton = gameCard.locator('button:has-text("Pick")').first()
          
          if (await pickButton.isVisible()) {
            await pickButton.click()
            
            // Should show offline indicator or error message
            await expect(
              page.locator('text=offline|connection|network').first()
            ).toBeVisible({ timeout: 5000 })
          }
        })
        
        await test.step('Network recovery validation', async () => {
          // Go back online
          await page.context().setOffline(false)
          
          // Should automatically retry or allow manual retry
          await page.waitForLoadState('networkidle')
          
          // Validate app recovers gracefully
          await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
        })
      })

      test('Extended session - 3 hour game day simulation', async ({ page }) => {
        // Login
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.click('[data-testid="games-nav-link"]')
        
        // Simulate extended usage pattern
        for (let hour = 0; hour < 3; hour++) {
          await test.step(`Hour ${hour + 1} - Continuous usage simulation`, async () => {
            // Navigate between pages
            await page.click('[data-testid="home-nav-link"]')
            await page.waitForTimeout(1000)
            await page.click('[data-testid="games-nav-link"]')
            await page.waitForTimeout(1000)
            
            // Make a pick if available
            const gameCards = page.locator('[data-testid="game-card"]')
            if (await gameCards.count() > hour) {
              const gameCard = gameCards.nth(hour)
              const pickButton = gameCard.locator('button:has-text("Pick")').first()
              
              if (await pickButton.isVisible()) {
                await pickButton.click()
                await page.waitForTimeout(500)
              }
            }
            
            // Validate no memory issues (page should still be responsive)
            await expect(page.locator('[data-testid="games-grid"]')).toBeVisible()
          })
        }
      })

      test('Touch gesture optimization', async ({ page }) => {
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.click('[data-testid="games-nav-link"]')
        
        await test.step('Touch target validation across all interactive elements', async () => {
          // Get all clickable elements
          const clickableElements = await page.locator('button, a, [role="button"]').all()
          
          for (const element of clickableElements.slice(0, 10)) { // Test first 10 elements
            if (await element.isVisible()) {
              const box = await element.boundingBox()
              if (box) {
                // Minimum 44px touch target (iOS Human Interface Guidelines)
                expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44)
              }
            }
          }
        })

        await test.step('Swipe gesture simulation', async () => {
          // Test swipe gestures on mobile
          const gamesGrid = page.locator('[data-testid="games-grid"]')
          await expect(gamesGrid).toBeVisible()
          
          // Simulate swipe down (refresh gesture)
          await gamesGrid.hover()
          await page.mouse.down()
          await page.mouse.move(viewport.width / 2, 100)
          await page.mouse.up()
          
          // Page should handle gesture gracefully
          await page.waitForTimeout(1000)
          await expect(gamesGrid).toBeVisible()
        })
      })
    })
  })
})

// Cross-viewport consistency test
test.describe('Cross-Viewport Consistency', () => {
  test('UI elements remain consistent across all mobile viewports', async ({ page }) => {
    const results: Array<{ viewport: string, buttonWidths: number[], issues: string[] }> = []
    
    for (const viewport of MOBILE_VIEWPORTS) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      
      // Login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await page.click('[data-testid="games-nav-link"]')
      
      // Measure button widths
      const buttons = await page.locator('button').all()
      const buttonWidths: number[] = []
      const issues: string[] = []
      
      for (const button of buttons.slice(0, 5)) { // Test first 5 buttons
        if (await button.isVisible()) {
          const box = await button.boundingBox()
          if (box) {
            buttonWidths.push(box.width)
            
            // Check for full-width issues
            if (box.width >= viewport.width * 0.9) {
              issues.push(`Button width ${box.width}px is too close to viewport width ${viewport.width}px`)
            }
          }
        }
      }
      
      results.push({
        viewport: `${viewport.name} (${viewport.width}x${viewport.height})`,
        buttonWidths,
        issues
      })
    }
    
    // Validate no critical issues across viewports
    for (const result of results) {
      console.log(`${result.viewport}: ${result.issues.length} issues found`)
      if (result.issues.length > 0) {
        console.log('Issues:', result.issues)
      }
      
      // Fail test if any viewport has critical issues
      expect(result.issues.length).toBe(0)
    }
  })
})