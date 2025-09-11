import { test, expect, devices } from '@playwright/test'

/**
 * Visual Regression Tests for Mobile Components
 * 
 * These tests capture screenshots of mobile UI components and compare them
 * against baseline images to detect unintended visual changes.
 * 
 * Critical scenarios tested:
 * - Mobile button width constraints (the main issue we're solving)
 * - Component states (normal, selected, disabled, loading)
 * - Responsive behavior across different mobile viewports
 * - Dark mode compatibility
 */

const mobileViewports = [
  { name: 'iPhone 12', device: devices['iPhone 12'], width: 390, height: 844 },
  { name: 'iPhone 12 Mini', device: devices['iPhone 12 Mini'], width: 375, height: 812 },
  { name: 'Pixel 5', device: devices['Pixel 5'], width: 393, height: 851 },
  { name: 'Galaxy S21', device: devices['Galaxy S8'], width: 360, height: 740 } // Closest approximation
]

// Test mobile component visual consistency across devices
mobileViewports.forEach(({ name, device, width, height }) => {
  test.describe(`Mobile Visual Regression - ${name}`, () => {
    test.use(device)

    test.beforeEach(async ({ page }) => {
      // Ensure consistent state for visual tests
      await page.goto('/games')
      await page.waitForLoadState('networkidle')
      
      // Wait for any animations to complete
      await page.waitForTimeout(500)
    })

    test('mobile button width constraints - before/after comparison', async ({ page }) => {
      // This is the CRITICAL test to verify the full-width button fix
      
      // Find mobile buttons on the page
      const mobileButtons = page.locator('.mobileButton')
      
      if (await mobileButtons.count() > 0) {
        const firstButton = mobileButtons.first()
        await expect(firstButton).toBeVisible()
        
        // Take screenshot of button to verify it's NOT full-width
        await expect(firstButton).toHaveScreenshot(`button-width-constraint-${name.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        })
        
        // Verify button doesn't extend to full container width
        const buttonBounds = await firstButton.boundingBox()
        const containerBounds = await page.locator('body').boundingBox()
        
        if (buttonBounds && containerBounds) {
          // Button width should be significantly less than container width
          expect(buttonBounds.width).toBeLessThan(containerBounds.width * 0.7)
        }
      }
    })

    test('mobile button variants visual consistency', async ({ page }) => {
      // Test different button variants if they exist
      const buttonVariants = [
        '.button-primary',
        '.button-secondary', 
        '.button-danger',
        '.button-success'
      ]
      
      for (const variant of buttonVariants) {
        const variantButton = page.locator(`.mobileButton${variant}`)
        if (await variantButton.count() > 0) {
          await expect(variantButton.first()).toHaveScreenshot(
            `button-${variant.replace('.button-', '')}-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
            { animations: 'disabled' }
          )
        }
      }
    })

    test('mobile button sizes maintain constraints', async ({ page }) => {
      // Test button size variants
      const sizeVariants = ['.button-sm', '.button-md', '.button-lg']
      
      for (const size of sizeVariants) {
        const sizeButton = page.locator(`.mobileButton${size}`)
        if (await sizeButton.count() > 0) {
          await expect(sizeButton.first()).toHaveScreenshot(
            `button-${size.replace('.button-', '')}-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
            { animations: 'disabled' }
          )
          
          // Verify size constraints
          const bounds = await sizeButton.first().boundingBox()
          if (bounds) {
            // Even large buttons shouldn't be full-width unless explicitly set
            expect(bounds.width).toBeLessThan(device.viewport.width * 0.8)
          }
        }
      }
    })

    test('game card component visual consistency', async ({ page }) => {
      const gameCards = page.locator('.mobileGameCard')
      
      if (await gameCards.count() > 0) {
        const firstCard = gameCards.first()
        await expect(firstCard).toBeVisible()
        
        // Screenshot normal state
        await expect(firstCard).toHaveScreenshot(`game-card-normal-${name.toLowerCase().replace(/\s+/g, '-')}.png`, {
          animations: 'disabled'
        })
        
        // Test compact mode if available
        const compactCards = page.locator('.mobileGameCard.compact')
        if (await compactCards.count() > 0) {
          await expect(compactCards.first()).toHaveScreenshot(
            `game-card-compact-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
            { animations: 'disabled' }
          )
        }
      }
    })

    test('team selector touch targets visual verification', async ({ page }) => {
      const teamSelectors = page.locator('.teamSelector')
      
      if (await teamSelectors.count() > 0) {
        const firstSelector = teamSelectors.first()
        await expect(firstSelector).toBeVisible()
        
        // Screenshot unselected state
        await expect(firstSelector).toHaveScreenshot(
          `team-selector-unselected-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
          { animations: 'disabled' }
        )
        
        // Click a team and screenshot selected state
        const teamButton = firstSelector.locator('.teamButton').first()
        await teamButton.tap()
        await page.waitForTimeout(200) // Allow selection animation
        
        await expect(firstSelector).toHaveScreenshot(
          `team-selector-selected-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
          { animations: 'disabled' }
        )
      }
    })

    test('week selector scrolling visual state', async ({ page }) => {
      const weekSelector = page.locator('.weekSelector')
      
      if (await weekSelector.count() > 0) {
        await expect(weekSelector).toBeVisible()
        
        await expect(weekSelector).toHaveScreenshot(
          `week-selector-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
          { animations: 'disabled' }
        )
        
        // Test selected week visual state
        const weekButtons = weekSelector.locator('.weekButton')
        if (await weekButtons.count() > 0) {
          await weekButtons.first().tap()
          await page.waitForTimeout(200)
          
          await expect(weekSelector).toHaveScreenshot(
            `week-selector-selected-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
            { animations: 'disabled' }
          )
        }
      }
    })

    test('mobile navigation bottom bar', async ({ page }) => {
      const mobileNav = page.locator('.mobileNavigation')
      
      if (await mobileNav.count() > 0) {
        await expect(mobileNav).toBeVisible()
        
        await expect(mobileNav).toHaveScreenshot(
          `mobile-navigation-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
          { animations: 'disabled' }
        )
      }
    })

    test('disabled/locked states visual verification', async ({ page }) => {
      // Look for disabled buttons
      const disabledButtons = page.locator('.mobileButton.disabled')
      if (await disabledButtons.count() > 0) {
        await expect(disabledButtons.first()).toHaveScreenshot(
          `button-disabled-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
          { animations: 'disabled' }
        )
      }
      
      // Look for loading buttons
      const loadingButtons = page.locator('.mobileButton.loading')
      if (await loadingButtons.count() > 0) {
        await expect(loadingButtons.first()).toHaveScreenshot(
          `button-loading-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
          { animations: 'disabled' }
        )
      }
      
      // Look for locked game cards
      const lockedCards = page.locator('.mobileGameCard.locked')
      if (await lockedCards.count() > 0) {
        await expect(lockedCards.first()).toHaveScreenshot(
          `game-card-locked-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
          { animations: 'disabled' }
        )
      }
    })

    test('full page layout consistency', async ({ page }) => {
      // Full page screenshot to verify overall layout
      await expect(page).toHaveScreenshot(
        `full-page-layout-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
        { 
          fullPage: true,
          animations: 'disabled',
          // Mask dynamic content that might change between runs
          mask: [
            page.locator('.gameTime'), // Game times might be dynamic
            page.locator('[data-testid="current-time"]') // Any current time displays
          ]
        }
      )
    })
  })
})

// Cross-viewport comparison tests
test.describe('Cross-Viewport Visual Consistency', () => {
  test('mobile button constraints consistent across viewports', async ({ browser }) => {
    // Create contexts for different mobile devices
    const contexts = await Promise.all(
      mobileViewports.slice(0, 3).map(({ device }) => browser.newContext(device))
    )
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    )

    try {
      // Navigate all pages
      await Promise.all(
        pages.map(page => page.goto('/games').then(() => page.waitForLoadState('networkidle')))
      )

      // Take screenshots of the same component across different viewports
      const buttonScreenshots = await Promise.all(
        pages.map(async (page, index) => {
          const button = page.locator('.mobileButton').first()
          if (await button.count() > 0) {
            const viewport = mobileViewports[index]
            return {
              viewport: viewport.name,
              screenshot: await button.screenshot({ animations: 'disabled' }),
              bounds: await button.boundingBox()
            }
          }
          return null
        })
      )

      // Verify all buttons maintain width constraints relative to their viewport
      buttonScreenshots.forEach((result, index) => {
        if (result && result.bounds) {
          const viewport = mobileViewports[index]
          const widthRatio = result.bounds.width / viewport.width
          
          // Button should not take more than 60% of viewport width
          expect(widthRatio).toBeLessThan(0.6)
        }
      })

    } finally {
      await Promise.all(pages.map(page => page.close()))
      await Promise.all(contexts.map(context => context.close()))
    }
  })
})

// Dark mode visual regression tests
test.describe('Dark Mode Mobile Visual Regression', () => {
  test('mobile components in dark mode', async ({ page }) => {
    test.use(devices['iPhone 12'])
    
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' })
    
    await page.goto('/games')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500) // Allow theme to apply
    
    // Test button appearance in dark mode
    const mobileButton = page.locator('.mobileButton').first()
    if (await mobileButton.count() > 0) {
      await expect(mobileButton).toHaveScreenshot('button-dark-mode-iphone12.png', {
        animations: 'disabled'
      })
    }
    
    // Test game card in dark mode
    const gameCard = page.locator('.mobileGameCard').first()
    if (await gameCard.count() > 0) {
      await expect(gameCard).toHaveScreenshot('game-card-dark-mode-iphone12.png', {
        animations: 'disabled'
      })
    }
    
    // Full page dark mode
    await expect(page).toHaveScreenshot('full-page-dark-mode-iphone12.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('.gameTime')]
    })
  })
})

// High contrast mode visual tests
test.describe('High Contrast Mode Visual Tests', () => {
  test('mobile components with high contrast', async ({ page }) => {
    test.use(devices['iPhone 12'])
    
    // Enable high contrast mode
    await page.emulateMedia({ 
      colorScheme: 'light',
      forcedColors: 'active'
    })
    
    await page.goto('/games')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    
    // Test high contrast button appearance
    const mobileButton = page.locator('.mobileButton').first()
    if (await mobileButton.count() > 0) {
      await expect(mobileButton).toHaveScreenshot('button-high-contrast-iphone12.png', {
        animations: 'disabled'
      })
    }
  })
})

// Animation and transition visual states
test.describe('Animation States Visual Tests', () => {
  test('button press states visual feedback', async ({ page }) => {
    test.use(devices['Pixel 5'])
    
    await page.goto('/games')
    await page.waitForLoadState('networkidle')
    
    const teamButton = page.locator('.teamButton').first()
    if (await teamButton.count() > 0) {
      // Normal state
      await expect(teamButton).toHaveScreenshot('team-button-normal-pixel5.png', {
        animations: 'disabled'
      })
      
      // Simulate press state (this would require JS evaluation to add .pressed class)
      await teamButton.evaluate(el => el.classList.add('pressed'))
      await expect(teamButton).toHaveScreenshot('team-button-pressed-pixel5.png', {
        animations: 'disabled'
      })
      
      await teamButton.evaluate(el => el.classList.remove('pressed'))
      
      // Tap to select
      await teamButton.tap()
      await page.waitForTimeout(200)
      
      // Selected state
      await expect(teamButton).toHaveScreenshot('team-button-selected-pixel5.png', {
        animations: 'disabled'
      })
    }
  })
})

// Error state visual tests
test.describe('Error State Visual Tests', () => {
  test('components in error states', async ({ page }) => {
    test.use(devices['iPhone 12 Mini'])
    
    // Simulate network error to trigger error states
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('/games')
    
    // Wait for error states to appear
    await page.waitForTimeout(2000)
    
    // Take screenshot of error state
    await expect(page).toHaveScreenshot('error-state-mobile-iphone12mini.png', {
      fullPage: true,
      animations: 'disabled'
    })
  })
})

// Loading state visual tests
test.describe('Loading State Visual Tests', () => {
  test('components in loading states', async ({ page }) => {
    test.use(devices['Galaxy S8']) // Closest to Galaxy S21
    
    // Slow down network to catch loading states
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      route.continue()
    })
    
    const gotoPromise = page.goto('/games')
    
    // Try to capture loading state
    await page.waitForTimeout(500)
    
    // If loading buttons exist, capture them
    const loadingButtons = page.locator('.mobileButton.loading')
    if (await loadingButtons.count() > 0) {
      await expect(loadingButtons.first()).toHaveScreenshot('button-loading-galaxy-s21.png', {
        animations: 'disabled'
      })
    }
    
    await gotoPromise
  })
})

// Responsive breakpoint visual tests
test.describe('Responsive Breakpoint Visual Tests', () => {
  const customViewports = [
    { width: 320, height: 568, name: 'very-small' }, // iPhone 5 size
    { width: 375, height: 667, name: 'small' },      // iPhone 6/7/8 size  
    { width: 414, height: 896, name: 'large' },      // iPhone 11 Pro Max size
    { width: 768, height: 1024, name: 'tablet' }     // iPad size
  ]
  
  customViewports.forEach(({ width, height, name }) => {
    test(`breakpoint visual consistency at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      
      await page.goto('/games')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      
      // Test button constraints at this breakpoint
      const mobileButton = page.locator('.mobileButton').first()
      if (await mobileButton.count() > 0) {
        await expect(mobileButton).toHaveScreenshot(`button-breakpoint-${name}.png`, {
          animations: 'disabled'
        })
        
        // Verify button doesn't become full-width
        const bounds = await mobileButton.boundingBox()
        if (bounds) {
          expect(bounds.width).toBeLessThan(width * 0.8)
        }
      }
      
      // Full layout at this breakpoint
      await expect(page).toHaveScreenshot(`layout-breakpoint-${name}.png`, {
        fullPage: true,
        animations: 'disabled',
        mask: [page.locator('.gameTime')]
      })
    })
  })
})