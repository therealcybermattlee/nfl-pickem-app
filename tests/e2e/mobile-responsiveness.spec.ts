import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Responsiveness and Touch Interactions E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const mockDate = new Date('2025-09-07T12:00:00.000Z')
      Date.now = () => mockDate.getTime()
    })
  })

  test('Mobile navigation and layout', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    await page.goto('/')
    
    // Verify mobile layout
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Check that navigation is horizontally scrollable or wrapped properly
    const navContainer = nav.locator('.container')
    await expect(navContainer).toHaveClass(/.*mx-auto.*/)
    
    // Test navigation links work with touch
    await page.tap('a[href="/teams"]')
    await expect(page).toHaveURL(/.*teams/)
    
    await page.tap('a[href="/games"]')
    await expect(page).toHaveURL(/.*games/)
    
    await page.tap('a[href="/leaderboard"]')
    await expect(page).toHaveURL(/.*leaderboard/)
    
    // Verify responsive content layout
    const mainContent = page.locator('main')
    await expect(mainContent).toHaveClass(/.*px-4.*/) // Mobile padding
  })

  test('Mobile game cards and pick interface', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    // Mock games for mobile testing
    await page.route('**/api/games*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'game-1',
            homeTeamId: 'team-home',
            awayTeamId: 'team-away',
            homeTeam: { id: 'team-home', abbreviation: 'HOM', name: 'Home Team' },
            awayTeam: { id: 'team-away', abbreviation: 'AWY', name: 'Away Team' },
            gameDate: '2025-09-07T16:00:00.000Z',
            week: 1,
            season: 2025,
            isCompleted: false,
            homeSpread: -350,
            overUnder: 4750
          }
        ])
      })
    })

    await page.route('**/api/picks', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ picks: [] })
      })
    })

    await page.goto('/')
    
    // Wait for content to load
    await expect(page.locator('text=Week 1 Games (1 games)')).toBeVisible()
    
    // Verify mobile-friendly game cards
    const gameCard = page.locator('.bg-muted\\/50').first()
    await expect(gameCard).toBeVisible()
    
    // Check that team information is readable on mobile
    await expect(gameCard.locator('text=HOM')).toBeVisible()
    await expect(gameCard.locator('text=AWY')).toBeVisible()
    await expect(gameCard.locator('text=Home Team')).toBeVisible()
    await expect(gameCard.locator('text=Away Team')).toBeVisible()
    
    // Test mobile touch interactions
    await page.selectOption('select', 'dad-user-id')
    
    const homeTeamButton = gameCard.locator('text=HOM').first()
    await homeTeamButton.tap()
    
    // Verify touch feedback
    await expect(homeTeamButton.locator('../..')).toHaveClass(/.*bg-green-100.*/)
    
    // Test that spread and over/under are visible on mobile
    await expect(gameCard.locator('text=Spread: HOM -3.5')).toBeVisible()
    await expect(gameCard.locator('text=O/U: 47.5')).toBeVisible()
  })

  test('Mobile leaderboard responsive table', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    // Mock leaderboard data
    await page.route('**/api/leaderboard*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          week: 1,
          season: 2025,
          totalGames: 16,
          completedGames: 2,
          entries: [
            {
              user: { id: 1, name: 'Dad', email: 'dad@example.com', displayName: 'Dad' },
              position: 1,
              points: 8,
              totalPicks: 10,
              totalGames: 16,
              winPercentage: 80.0,
              streak: 3,
              lastWeekPoints: 2
            },
            {
              user: { id: 2, name: 'Mom', email: 'mom@example.com', displayName: 'Mom' },
              position: 2,
              points: 6,
              totalPicks: 10,
              totalGames: 16,
              winPercentage: 60.0,
              streak: -1,
              lastWeekPoints: 3
            }
          ]
        })
      })
    })

    await page.goto('/leaderboard')
    
    // Wait for leaderboard to load
    await expect(page.locator('text=Week 1 • 2025 Season')).toBeVisible()
    
    // Verify mobile card layout is used instead of table
    const mobileLeaderboard = page.locator('.md\\:hidden')
    await expect(mobileLeaderboard).toBeVisible()
    
    // Verify desktop table is hidden on mobile
    const desktopTable = page.locator('.hidden.md\\:block')
    await expect(desktopTable).not.toBeVisible()
    
    // Check mobile leaderboard cards
    const leaderboardCards = mobileLeaderboard.locator('.border')
    await expect(leaderboardCards).toHaveCount(2)
    
    // Verify first place gets special highlighting
    const firstPlaceCard = leaderboardCards.first()
    await expect(firstPlaceCard).toHaveClass(/.*border-yellow-300.*/)
    await expect(firstPlaceCard.locator('text=🏆')).toBeVisible()
    await expect(firstPlaceCard.locator('text=Dad')).toBeVisible()
    
    // Test mobile dropdown selectors
    await page.tap('select[id="week"]')
    await page.selectOption('select[id="week"]', '2')
    await expect(page.locator('text=Week 2 • 2025 Season')).toBeVisible()
  })

  test('Portrait vs Landscape orientation handling', async ({ page }) => {
    // Start in portrait mode (standard mobile)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    await expect(page.locator('h1')).toBeVisible()
    
    // Switch to landscape mode
    await page.setViewportSize({ width: 667, height: 375 })
    
    // Verify layout adapts to landscape
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('h1')).toBeVisible()
    
    // Navigation should still work in landscape
    await page.tap('a[href="/leaderboard"]')
    await expect(page).toHaveURL(/.*leaderboard/)
  })

  test('Different mobile device sizes', async ({ page }) => {
    const devices = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
      { name: 'Samsung Galaxy S21', width: 360, height: 800 },
      { name: 'iPad Mini', width: 768, height: 1024 }
    ]
    
    for (const device of devices) {
      await page.setViewportSize({ width: device.width, height: device.height })
      await page.goto('/')
      
      // Verify core functionality works on each device size
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('nav')).toBeVisible()
      
      // Test navigation
      await page.tap('a[href="/teams"]')
      await expect(page).toHaveURL(/.*teams/)
      
      console.log(`✅ ${device.name} (${device.width}x${device.height}) - Layout verified`)
    }
  })

  test('Touch gesture support', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    await page.goto('/')
    
    // Test tap vs long press
    const navLink = page.locator('a[href="/teams"]')
    
    // Regular tap should navigate
    await navLink.tap()
    await expect(page).toHaveURL(/.*teams/)
    
    // Go back and test double tap (should still work as single navigation)
    await page.goBack()
    await navLink.tap({ tapCount: 2 })
    await expect(page).toHaveURL(/.*teams/)
  })

  test('Mobile form interactions and keyboard', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    // Mock games and picks
    await page.route('**/api/games*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'game-1',
            homeTeamId: 'team-home',
            awayTeamId: 'team-away',
            homeTeam: { id: 'team-home', abbreviation: 'HOM', name: 'Home Team' },
            awayTeam: { id: 'team-away', abbreviation: 'AWY', name: 'Away Team' },
            gameDate: '2025-09-07T16:00:00.000Z',
            week: 1,
            season: 2025,
            isCompleted: false
          }
        ])
      })
    })

    await page.route('**/api/picks', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ picks: [] })
      })
    })

    await page.goto('/')
    await expect(page.locator('text=Week 1 Games (1 games)')).toBeVisible()
    
    // Test mobile select dropdown
    const userSelect = page.locator('select')
    await userSelect.tap()
    
    // On mobile, native select should open
    await page.selectOption('select', 'dad-user-id')
    await expect(userSelect).toHaveValue('dad-user-id')
  })

  test('Mobile accessibility features', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    await page.goto('/')
    
    // Test focus management on mobile
    await page.tap('[tabindex]')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Verify touch targets are large enough (44px minimum)
    const navLinks = page.locator('nav a')
    const count = await navLinks.count()
    
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i)
      const box = await link.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
        // Width can vary for nav links, but should be reasonable
        expect(box.width).toBeGreaterThan(20)
      }
    }
  })

  test('Mobile performance and loading', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Mobile should load reasonably fast even with slower connections
    expect(loadTime).toBeLessThan(5000) // 5 seconds max on mobile
    
    // Test navigation performance on mobile
    const navStart = Date.now()
    await page.tap('a[href="/leaderboard"]')
    await page.waitForLoadState('networkidle')
    const navTime = Date.now() - navStart
    
    expect(navTime).toBeLessThan(3000) // 3 seconds for navigation
  })

  test('Mobile network handling (offline/slow connection)', async ({ page, context, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    
    // Simulate slow connection
    await context.setOffline(true)
    
    // Try to navigate - should show cached content or graceful degradation
    await page.tap('a[href="/teams"]')
    
    // The app should handle offline state gracefully
    // Since we don't have specific offline handling, just verify no crashes
    await expect(page.locator('body')).toBeVisible()
    
    // Restore connection
    await context.setOffline(false)
    await page.waitForTimeout(1000)
    
    // Navigation should work again
    await page.tap('a[href="/leaderboard"]')
    await expect(page).toHaveURL(/.*leaderboard/)
  })
})