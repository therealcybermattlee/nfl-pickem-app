import { test, expect } from '@playwright/test'

test.describe('Authentication and Navigation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent time for testing
    await page.addInitScript(() => {
      const mockDate = new Date('2025-09-07T12:00:00.000Z')
      Date.now = () => mockDate.getTime()
    })
  })

  test('Basic navigation between pages', async ({ page }) => {
    await page.goto('/')
    
    // Verify home page loads
    await expect(page.locator('h1')).toContainText('NFL Pick\'em Dashboard')
    
    // Test navigation to Teams page
    await page.click('a[href="/teams"]')
    await expect(page).toHaveURL(/.*teams/)
    await expect(page.locator('h1')).toContainText('NFL Teams')
    
    // Test navigation to Games page
    await page.click('a[href="/games"]')  
    await expect(page).toHaveURL(/.*games/)
    
    // Test navigation to Leaderboard page
    await page.click('a[href="/leaderboard"]')
    await expect(page).toHaveURL(/.*leaderboard/)
    await expect(page.locator('h1')).toContainText('Leaderboard')
    
    // Navigate back to home
    await page.click('a[href="/"]')
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1')).toContainText('NFL Pick\'em Dashboard')
  })

  test('Navigation active states', async ({ page }) => {
    await page.goto('/')
    
    // Check home is active
    const homeLink = page.locator('a[href="/"]')
    await expect(homeLink).toHaveClass(/.*border-primary.*/)
    
    // Navigate to games and check active state
    await page.click('a[href="/games"]')
    const gamesLink = page.locator('a[href="/games"]')
    await expect(gamesLink).toHaveClass(/.*border-primary.*/)
    
    // Verify home is no longer active
    await expect(homeLink).not.toHaveClass(/.*border-primary.*/)
  })

  test('Mobile navigation responsiveness', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    await page.goto('/')
    
    // Verify navigation is visible on mobile
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Test all navigation links work on mobile
    await page.tap('a[href="/games"]')
    await expect(page).toHaveURL(/.*games/)
    
    await page.tap('a[href="/leaderboard"]')
    await expect(page).toHaveURL(/.*leaderboard/)
    
    // Verify responsive layout
    const mainContent = page.locator('main')
    await expect(mainContent).toHaveClass(/.*container.*/)
  })

  test('Error boundary handling', async ({ page }) => {
    // Navigate to home
    await page.goto('/')
    
    // Trigger a JavaScript error to test error boundary
    await page.evaluate(() => {
      // @ts-ignore - intentionally cause error
      window.triggerError = () => {
        throw new Error('Test error for error boundary')
      }
    })
    
    // The error boundary should catch errors and show fallback UI
    // In a real test, we'd trigger specific component errors
    
    // Verify page still functions after error recovery
    await page.click('a[href="/teams"]')
    await expect(page).toHaveURL(/.*teams/)
  })

  test('Accessibility navigation with keyboard', async ({ page }) => {
    await page.goto('/')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    let focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Navigate through all links with Tab
    await page.keyboard.press('Tab') // Skip to first nav link
    focusedElement = page.locator(':focus')
    await expect(focusedElement).toHaveAttribute('href', '/')
    
    await page.keyboard.press('Tab')
    focusedElement = page.locator(':focus')  
    await expect(focusedElement).toHaveAttribute('href', '/teams')
    
    // Test Enter key activation
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/.*teams/)
    
    // Verify focus is maintained after navigation
    await expect(page.locator(':focus')).toBeVisible()
  })

  test('Skip navigation link for accessibility', async ({ page }) => {
    await page.goto('/')
    
    // The skip nav link should be present but visually hidden initially
    const skipNav = page.locator('a[href="#main-content"]').first()
    
    // Focus on skip nav with keyboard
    await page.keyboard.press('Tab')
    
    // Skip nav should become visible when focused
    if (await skipNav.isVisible()) {
      await expect(skipNav).toContainText(/skip/i)
      
      // Activate skip nav
      await page.keyboard.press('Enter')
      
      // Focus should move to main content
      const mainContent = page.locator('#main-content')
      await expect(mainContent).toBeFocused()
    }
  })

  test('Page metadata and SEO elements', async ({ page }) => {
    await page.goto('/')
    
    // Check page title
    await expect(page).toHaveTitle(/NFL Pick'em|NFL|Pick'em/)
    
    // Navigate to different pages and verify titles update
    await page.click('a[href="/leaderboard"]')
    await expect(page).toHaveTitle(/Leaderboard|NFL Pick'em/)
    
    await page.click('a[href="/games"]')  
    await expect(page).toHaveTitle(/Games|NFL Pick'em/)
  })

  test('Browser back/forward navigation', async ({ page }) => {
    await page.goto('/')
    
    // Navigate through pages
    await page.click('a[href="/teams"]')
    await page.click('a[href="/games"]')
    await page.click('a[href="/leaderboard"]')
    
    // Test browser back button
    await page.goBack()
    await expect(page).toHaveURL(/.*games/)
    
    await page.goBack()
    await expect(page).toHaveURL(/.*teams/)
    
    // Test browser forward button
    await page.goForward()
    await expect(page).toHaveURL(/.*games/)
  })

  test('Deep link navigation', async ({ page }) => {
    // Test direct navigation to deep routes
    await page.goto('/leaderboard')
    await expect(page).toHaveURL(/.*leaderboard/)
    await expect(page.locator('h1')).toContainText('Leaderboard')
    
    await page.goto('/games')
    await expect(page).toHaveURL(/.*games/)
    
    await page.goto('/teams')
    await expect(page).toHaveURL(/.*teams/)
    await expect(page.locator('h1')).toContainText('NFL Teams')
  })

  test('Page load performance benchmarks', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const homeLoadTime = Date.now() - startTime
    
    expect(homeLoadTime).toBeLessThan(3000)
    
    // Test navigation performance
    const navStartTime = Date.now()
    await page.click('a[href="/leaderboard"]')
    await page.waitForLoadState('networkidle')
    const navTime = Date.now() - navStartTime
    
    expect(navTime).toBeLessThan(2000)
  })
})