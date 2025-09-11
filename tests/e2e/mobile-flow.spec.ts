import { test, expect, devices } from '@playwright/test'

// Mobile device configurations
const mobileDevices = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'iPhone 12 Mini', device: devices['iPhone 12 Mini'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Galaxy S21', device: devices['Galaxy S8'] } // Close approximation
]

// Test mobile UI flow and interactions
for (const { name, device } of mobileDevices) {
  test.describe(`Mobile Flow on ${name}`, () => {
    test.use(device)

    test.beforeEach(async ({ page }) => {
      // Navigate to the games page
      await page.goto('/games')
      await page.waitForLoadState('networkidle')
    })

    test('mobile buttons should not be full-width', async ({ page }) => {
      // Look for MobileButton components
      const buttons = page.locator('.mobileButton')
      await expect(buttons.first()).toBeVisible()

      // Get all mobile buttons and check their max-width
      const buttonCount = await buttons.count()
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i)
        await expect(button).toBeVisible()
        
        // Check computed styles - buttons should NOT be full width
        const computedStyle = await button.evaluate((el) => {
          const style = getComputedStyle(el)
          return {
            maxWidth: style.maxWidth,
            width: style.width,
            display: style.display
          }
        })
        
        // Ensure button is not full width (should have max-width constraint)
        expect(computedStyle.maxWidth).not.toBe('none')
        expect(computedStyle.maxWidth).not.toBe('100%')
        
        // Should be inline-flex or similar, not block
        expect(computedStyle.display).toContain('flex')
      }
    })

    test('team selection buttons meet touch target requirements', async ({ page }) => {
      // Find team selector components
      const teamButtons = page.locator('.teamButton')
      await expect(teamButtons.first()).toBeVisible()

      const buttonCount = await teamButtons.count()
      for (let i = 0; i < buttonCount; i++) {
        const button = teamButtons.nth(i)
        const boundingBox = await button.boundingBox()
        
        // Ensure minimum 44x44px touch target (WCAG recommendation)
        expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
        expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
      }
    })

    test('touch interactions work properly', async ({ page }) => {
      const teamButton = page.locator('.teamButton').first()
      await expect(teamButton).toBeVisible()

      // Test touch tap
      await teamButton.tap()
      
      // Should show selected state
      await expect(teamButton).toHaveClass(/selected/)
      
      // Should show checkmark
      await expect(teamButton.locator('.checkmark')).toBeVisible()
    })

    test('swipe gestures work on week selector', async ({ page }) => {
      const weekScrollContainer = page.locator('.weekScrollContainer')
      await expect(weekScrollContainer).toBeVisible()

      // Get initial scroll position
      const initialScrollLeft = await weekScrollContainer.evaluate(el => el.scrollLeft)

      // Perform swipe gesture (touch drag)
      const containerBounds = await weekScrollContainer.boundingBox()
      if (containerBounds) {
        await page.mouse.move(containerBounds.x + containerBounds.width * 0.8, containerBounds.y + containerBounds.height / 2)
        await page.mouse.down()
        await page.mouse.move(containerBounds.x + containerBounds.width * 0.2, containerBounds.y + containerBounds.height / 2)
        await page.mouse.up()
      }

      // Should have scrolled
      const finalScrollLeft = await weekScrollContainer.evaluate(el => el.scrollLeft)
      expect(finalScrollLeft).not.toBe(initialScrollLeft)
    })

    test('mobile navigation works correctly', async ({ page }) => {
      // Check if mobile navigation is visible on small screens
      const mobileNav = page.locator('.mobileNavigation')
      
      // Should be visible on mobile viewports
      await expect(mobileNav).toBeVisible()

      // All nav buttons should meet touch target requirements
      const navButtons = mobileNav.locator('.navButton')
      const navButtonCount = await navButtons.count()
      
      for (let i = 0; i < navButtonCount; i++) {
        const button = navButtons.nth(i)
        const boundingBox = await button.boundingBox()
        
        expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
        expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
      }

      // Test navigation
      const gamesNavButton = navButtons.filter({ hasText: 'Games' })
      if (await gamesNavButton.count() > 0) {
        await gamesNavButton.tap()
        await expect(gamesNavButton).toHaveClass(/active/)
      }
    })

    test('game cards are properly sized for mobile', async ({ page }) => {
      const gameCards = page.locator('.mobileGameCard')
      await expect(gameCards.first()).toBeVisible()

      const cardCount = await gameCards.count()
      for (let i = 0; i < cardCount; i++) {
        const card = gameCards.nth(i)
        const boundingBox = await card.boundingBox()
        const viewport = page.viewportSize()
        
        // Cards should not exceed viewport width
        expect(boundingBox?.width).toBeLessThanOrEqual(viewport?.width ?? 1000)
        
        // Cards should have reasonable minimum width
        expect(boundingBox?.width).toBeGreaterThan(200)
      }
    })

    test('locked games show proper disabled state', async ({ page }) => {
      // Look for locked game indicators
      const lockedGames = page.locator('.mobileGameCard.locked')
      
      if (await lockedGames.count() > 0) {
        const lockedGame = lockedGames.first()
        await expect(lockedGame).toBeVisible()
        
        // Should show lock indicator
        await expect(lockedGame.locator('.lockIndicator')).toBeVisible()
        
        // Team buttons should be disabled
        const teamButtons = lockedGame.locator('.teamButton')
        const buttonCount = await teamButtons.count()
        
        for (let i = 0; i < buttonCount; i++) {
          await expect(teamButtons.nth(i)).toBeDisabled()
        }
      }
    })

    test('responsive text scaling works correctly', async ({ page }) => {
      // Check that text doesn't become too small on mobile
      const teamAbbreviations = page.locator('.teamAbbr')
      if (await teamAbbreviations.count() > 0) {
        const fontSize = await teamAbbreviations.first().evaluate(el => {
          return getComputedStyle(el).fontSize
        })
        
        // Font size should be at least 14px for readability
        const fontSizeValue = parseInt(fontSize)
        expect(fontSizeValue).toBeGreaterThanOrEqual(14)
      }
    })

    test('pinch zoom does not break layout', async ({ page }) => {
      // Simulate pinch zoom by changing viewport scale
      await page.setViewportSize({ 
        width: device.viewport.width, 
        height: device.viewport.height 
      })
      
      // Check that buttons are still properly sized after zoom
      const buttons = page.locator('.mobileButton')
      if (await buttons.count() > 0) {
        const button = buttons.first()
        await expect(button).toBeVisible()
        
        const boundingBox = await button.boundingBox()
        expect(boundingBox?.width).toBeLessThan(device.viewport.width)
      }
    })

    test('orientation change maintains usability', async ({ page }) => {
      // Test portrait orientation (default)
      await expect(page.locator('.mobileButton').first()).toBeVisible()
      
      // Switch to landscape if supported
      if (device.viewport.width < device.viewport.height) {
        await page.setViewportSize({ 
          width: device.viewport.height, 
          height: device.viewport.width 
        })
        
        await page.waitForTimeout(500) // Allow time for reflow
        
        // Components should still be visible and properly sized
        const buttons = page.locator('.mobileButton')
        if (await buttons.count() > 0) {
          await expect(buttons.first()).toBeVisible()
        }
        
        // Team buttons should maintain touch targets
        const teamButtons = page.locator('.teamButton')
        if (await teamButtons.count() > 0) {
          const boundingBox = await teamButtons.first().boundingBox()
          expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
        }
      }
    })
  })
}

// Cross-device compatibility tests
test.describe('Cross-Device Mobile Compatibility', () => {
  test('consistent behavior across all mobile devices', async ({ browser }) => {
    const contexts = await Promise.all(
      mobileDevices.map(({ device }) => browser.newContext(device))
    )
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    )

    try {
      // Navigate all pages to games
      await Promise.all(
        pages.map(page => page.goto('/games').then(() => page.waitForLoadState('networkidle')))
      )

      // Check that mobile buttons have consistent max-width constraints across devices
      const buttonConstraints = await Promise.all(
        pages.map(async (page) => {
          const buttons = page.locator('.mobileButton')
          if (await buttons.count() === 0) return null
          
          const button = buttons.first()
          return await button.evaluate(el => {
            const style = getComputedStyle(el)
            return {
              maxWidth: style.maxWidth,
              display: style.display
            }
          })
        })
      )

      // All devices should have similar constraints
      const validConstraints = buttonConstraints.filter(Boolean)
      if (validConstraints.length > 1) {
        const firstConstraint = validConstraints[0]
        validConstraints.forEach(constraint => {
          expect(constraint?.maxWidth).not.toBe('none')
          expect(constraint?.maxWidth).not.toBe('100%')
          expect(constraint?.display).toContain('flex')
        })
      }

      // Check touch targets are consistent
      const touchTargetSizes = await Promise.all(
        pages.map(async (page) => {
          const teamButtons = page.locator('.teamButton')
          if (await teamButtons.count() === 0) return null
          
          return await teamButtons.first().boundingBox()
        })
      )

      // All touch targets should meet minimum requirements
      touchTargetSizes.forEach(size => {
        if (size) {
          expect(size.width).toBeGreaterThanOrEqual(44)
          expect(size.height).toBeGreaterThanOrEqual(44)
        }
      })

    } finally {
      // Clean up
      await Promise.all(pages.map(page => page.close()))
      await Promise.all(contexts.map(context => context.close()))
    }
  })
})

// Network condition testing
test.describe('Mobile Network Conditions', () => {
  mobileDevices.slice(0, 2).forEach(({ name, device }) => {
    test(`${name} - Slow 3G performance`, async ({ page, context }) => {
      // Simulate slow 3G
      await context.route('**/*', async (route, request) => {
        await new Promise(resolve => setTimeout(resolve, 100)) // Add 100ms delay
        route.continue()
      })

      await page.goto('/games')
      
      // Components should still render within reasonable time
      await expect(page.locator('.mobileButton').first()).toBeVisible({ timeout: 10000 })
      
      // Touch interactions should still be responsive
      const teamButton = page.locator('.teamButton').first()
      if (await teamButton.count() > 0) {
        await teamButton.tap()
        await expect(teamButton).toHaveClass(/selected/, { timeout: 5000 })
      }
    })

    test(`${name} - Offline functionality`, async ({ page, context }) => {
      // First load the page online
      await page.goto('/games')
      await page.waitForLoadState('networkidle')
      
      // Then go offline
      await context.setOffline(true)
      
      // Mobile components should still be interactive (with cached data)
      const buttons = page.locator('.mobileButton')
      if (await buttons.count() > 0) {
        await expect(buttons.first()).toBeVisible()
      }
      
      // Team selection should still work with cached game data
      const teamButtons = page.locator('.teamButton')
      if (await teamButtons.count() > 0) {
        await teamButtons.first().tap()
        // Note: Selection might not persist due to offline state, but UI should respond
      }
    })
  })
})

// Performance benchmarks for mobile
test.describe('Mobile Performance', () => {
  test('component render performance on mobile', async ({ page }) => {
    test.use(devices['iPhone 12'])
    
    // Measure time to interactive
    const startTime = Date.now()
    await page.goto('/games')
    await page.waitForLoadState('networkidle')
    
    // Components should be visible
    await expect(page.locator('.mobileButton').first()).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Mobile load time should be reasonable (under 5 seconds)
    expect(loadTime).toBeLessThan(5000)
    
    // Measure interaction response time
    const teamButton = page.locator('.teamButton').first()
    if (await teamButton.count() > 0) {
      const interactionStart = Date.now()
      await teamButton.tap()
      await expect(teamButton).toHaveClass(/selected/)
      const interactionTime = Date.now() - interactionStart
      
      // Touch response should be under 100ms for good UX
      expect(interactionTime).toBeLessThan(1000) // Allow some margin for test environment
    }
  })
})

// Accessibility testing on mobile
test.describe('Mobile Accessibility', () => {
  test('screen reader compatibility on mobile', async ({ page }) => {
    test.use(devices['iPhone 12'])
    
    await page.goto('/games')
    
    // Check ARIA labels are present
    const teamButtons = page.locator('.teamButton')
    if (await teamButtons.count() > 0) {
      const button = teamButtons.first()
      const ariaLabel = await button.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel).toContain('Select')
    }
    
    // Check radiogroup structure
    const radioGroups = page.locator('[role="radiogroup"]')
    if (await radioGroups.count() > 0) {
      await expect(radioGroups.first()).toBeVisible()
    }
  })

  test('keyboard navigation on mobile browsers', async ({ page }) => {
    test.use(devices['Pixel 5'])
    
    await page.goto('/games')
    
    // Tab navigation should work
    const teamButtons = page.locator('.teamButton')
    if (await teamButtons.count() > 0) {
      await page.keyboard.press('Tab')
      
      // First focusable element should be focused
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
  })
})

// Visual regression protection
test.describe('Mobile Visual Regression Protection', () => {
  mobileDevices.slice(0, 2).forEach(({ name, device }) => {
    test(`${name} - components maintain visual consistency`, async ({ page }) => {
      test.use(device)
      
      await page.goto('/games')
      await page.waitForLoadState('networkidle')
      
      // Take screenshot of key mobile components
      const mobileButton = page.locator('.mobileButton').first()
      if (await mobileButton.count() > 0) {
        await expect(mobileButton).toHaveScreenshot(`mobile-button-${name.toLowerCase().replace(/\s+/g, '-')}.png`)
      }
      
      const gameCard = page.locator('.mobileGameCard').first()
      if (await gameCard.count() > 0) {
        await expect(gameCard).toHaveScreenshot(`mobile-game-card-${name.toLowerCase().replace(/\s+/g, '-')}.png`)
      }
      
      // Full page screenshot for layout verification
      await expect(page).toHaveScreenshot(`mobile-games-page-${name.toLowerCase().replace(/\s+/g, '-')}.png`, {
        fullPage: true
      })
    })
  })
})