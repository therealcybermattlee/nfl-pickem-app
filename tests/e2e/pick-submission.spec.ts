import { test, expect } from '@playwright/test'

test.describe('Pick Submission and Validation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const mockDate = new Date('2025-09-07T12:00:00.000Z')
      Date.now = () => mockDate.getTime()
    })

    // Mock games API with unlocked games
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
            gameDate: '2025-09-07T16:00:00.000Z', // 4 hours in future
            week: 1,
            season: 2025,
            isCompleted: false,
            homeSpread: -350,
            overUnder: 4750
          },
          {
            id: 'game-2',
            homeTeamId: 'team-home2',
            awayTeamId: 'team-away2',
            homeTeam: { id: 'team-home2', abbreviation: 'HOM2', name: 'Home Team 2' },
            awayTeam: { id: 'team-away2', abbreviation: 'AWY2', name: 'Away Team 2' },
            gameDate: '2025-09-07T20:00:00.000Z', // 8 hours in future
            week: 1,
            season: 2025,
            isCompleted: false
          }
        ])
      })
    })
  })

  test('Successful pick submission workflow', async ({ page }) => {
    // Mock successful pick submission
    await page.route('**/api/picks', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, pickId: 'pick-123' })
        })
      } else {
        // GET request for existing picks
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ picks: [] })
        })
      }
    })

    await page.goto('/')
    
    // Wait for games to load
    await expect(page.locator('text=Week 1 Games (2 games)')).toBeVisible()
    
    // First, select a user
    await page.selectOption('select', 'dad-user-id')
    await expect(page.locator('select')).toHaveValue('dad-user-id')
    
    // Find the first game and click home team
    const gameCard = page.locator('.bg-muted\\/50').first()
    const homeTeamButton = gameCard.locator('text=HOM').first()
    
    await homeTeamButton.click()
    
    // Verify pick submission success feedback
    // Note: The app doesn't show success message UI, but updates state
    // Check that the team button shows selected state
    await expect(homeTeamButton.locator('../..')).toHaveClass(/.*bg-green-100.*/)
    
    // Verify pick status is shown
    await expect(gameCard.locator('text=✓ You picked: HOM')).toBeVisible()
  })

  test('Pick submission requires user selection', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Week 1 Games (2 games)')).toBeVisible()
    
    // Try to pick without selecting user first
    const gameCard = page.locator('.bg-muted\\/50').first()
    const homeTeamButton = gameCard.locator('text=HOM').first()
    
    // Set up dialog handler for alert
    page.on('dialog', dialog => {
      expect(dialog.message()).toBe('Please select a user first!')
      dialog.accept()
    })
    
    await homeTeamButton.click()
    
    // Verify no pick was registered (no green background)
    await expect(homeTeamButton.locator('../..')).not.toHaveClass(/.*bg-green-100.*/)
  })

  test('Pick submission with API error handling', async ({ page }) => {
    // Mock API error
    await page.route('**/api/picks', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ picks: [] })
        })
      }
    })

    await page.goto('/')
    await expect(page.locator('text=Week 1 Games (2 games)')).toBeVisible()
    
    // Select user and try to pick
    await page.selectOption('select', 'dad-user-id')
    
    // Set up dialog handler for error alert
    page.on('dialog', dialog => {
      expect(dialog.message()).toBe('Failed to save pick')
      dialog.accept()
    })
    
    const gameCard = page.locator('.bg-muted\\/50').first()
    const homeTeamButton = gameCard.locator('text=HOM').first()
    
    await homeTeamButton.click()
    
    // Verify pick was not registered
    await expect(homeTeamButton.locator('../..')).not.toHaveClass(/.*bg-green-100.*/)
  })

  test('Pick update workflow (changing existing pick)', async ({ page }) => {
    // Mock existing picks
    let currentPicks = [
      {
        gameId: 'game-1',
        userId: 'dad-user-id',
        teamId: 'team-home',
        userName: 'Dad',
        teamAbbr: 'HOM'
      }
    ]

    await page.route('**/api/picks', route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        // Update the pick in our mock data
        currentPicks = currentPicks.filter(p => !(p.gameId === body.gameId && p.userId === body.userId))
        currentPicks.push({
          gameId: body.gameId,
          userId: body.userId,
          teamId: body.teamId,
          userName: 'Dad',
          teamAbbr: body.teamId === 'team-home' ? 'HOM' : 'AWY'
        })
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ picks: currentPicks })
        })
      }
    })

    await page.goto('/')
    await expect(page.locator('text=Week 1 Games (2 games)')).toBeVisible()
    
    // Select user
    await page.selectOption('select', 'dad-user-id')
    
    // Verify existing pick is shown
    const gameCard = page.locator('.bg-muted\\/50').first()
    await expect(gameCard.locator('text=✓ You picked: HOM')).toBeVisible()
    await expect(gameCard.locator('text=HOM').first().locator('../..')).toHaveClass(/.*bg-green-100.*/)
    
    // Change pick to away team
    const awayTeamButton = gameCard.locator('text=AWY').first()
    await awayTeamButton.click()
    
    // Verify pick changed
    await expect(gameCard.locator('text=✓ You picked: AWY')).toBeVisible()
    await expect(awayTeamButton.locator('../..')).toHaveClass(/.*bg-green-100.*/)
    await expect(gameCard.locator('text=HOM').first().locator('../..')).not.toHaveClass(/.*bg-green-100.*/)
  })

  test('Multiple users pick tracking', async ({ page }) => {
    // Mock picks from multiple users
    const allPicks = [
      {
        gameId: 'game-1',
        userId: 'dad-user-id',
        teamId: 'team-home',
        userName: 'Dad',
        teamAbbr: 'HOM'
      },
      {
        gameId: 'game-1',
        userId: 'mom-user-id',
        teamId: 'team-away',
        userName: 'Mom',
        teamAbbr: 'AWY'
      }
    ]

    await page.route('**/api/picks', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ picks: allPicks })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    await page.goto('/')
    await expect(page.locator('text=Week 1 Games (2 games)')).toBeVisible()
    
    // Verify current picks are displayed for the game
    const gameCard = page.locator('.bg-muted\\/50').first()
    await expect(gameCard.locator('text=Current Picks:')).toBeVisible()
    await expect(gameCard.locator('text=Dad: HOM')).toBeVisible()
    await expect(gameCard.locator('text=Mom: AWY')).toBeVisible()
    
    // Switch to Dad user and verify his pick is highlighted
    await page.selectOption('select', 'dad-user-id')
    await expect(gameCard.locator('text=✓ You picked: HOM')).toBeVisible()
    
    // Switch to Mom user and verify her pick is highlighted
    await page.selectOption('select', 'mom-user-id')
    await expect(gameCard.locator('text=✓ You picked: AWY')).toBeVisible()
  })

  test('Completed game pick prevention', async ({ page }) => {
    // Mock completed game
    await page.route('**/api/games*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'game-completed',
            homeTeamId: 'team-home',
            awayTeamId: 'team-away',
            homeTeam: { id: 'team-home', abbreviation: 'HOM', name: 'Home Team' },
            awayTeam: { id: 'team-away', abbreviation: 'AWY', name: 'Away Team' },
            gameDate: '2025-09-07T10:00:00.000Z', // Past date
            week: 1,
            season: 2025,
            isCompleted: true // Game is completed
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
    
    // Select user
    await page.selectOption('select', 'dad-user-id')
    
    // Verify game shows as final and picks are not allowed
    const gameCard = page.locator('.bg-muted\\/50').first()
    await expect(gameCard.locator('text=FINAL')).toBeVisible()
    await expect(gameCard.locator('text=Game has started - no picks allowed')).toBeVisible()
    
    // Try clicking team buttons - they should not be clickable
    const homeTeamButton = gameCard.locator('text=HOM').first()
    await expect(homeTeamButton.locator('../..')).not.toHaveClass(/.*hover:bg-blue-50.*/)
  })

  test('Mobile pick interface interactions', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    await page.route('**/api/picks', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ picks: [] })
      })
    })

    await page.goto('/')
    await expect(page.locator('text=Week 1 Games (2 games)')).toBeVisible()
    
    // Select user
    await page.selectOption('select', 'dad-user-id')
    
    // Test touch interactions
    const gameCard = page.locator('.bg-muted\\/50').first()
    const homeTeamButton = gameCard.locator('text=HOM').first()
    
    // Use tap instead of click for mobile
    await homeTeamButton.tap()
    
    // Verify mobile-friendly feedback
    await expect(homeTeamButton.locator('../..')).toHaveClass(/.*bg-green-100.*/)
    
    // Test that mobile layout is responsive
    await expect(gameCard).toBeVisible()
    
    // Verify mobile-specific pick status display
    await expect(gameCard.locator('text=✓ You picked: HOM')).toBeVisible()
  })

  test('Pick submission payload validation', async ({ page }) => {
    let capturedRequest: any = null
    
    await page.route('**/api/picks', route => {
      if (route.request().method() === 'POST') {
        capturedRequest = route.request().postDataJSON()
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ picks: [] })
        })
      }
    })

    await page.goto('/')
    await expect(page.locator('text=Week 1 Games (2 games)')).toBeVisible()
    
    // Select user and make pick
    await page.selectOption('select', 'dad-user-id')
    const gameCard = page.locator('.bg-muted\\/50').first()
    await gameCard.locator('text=HOM').first().click()
    
    // Wait a moment for request to be captured
    await page.waitForTimeout(500)
    
    // Verify request payload
    expect(capturedRequest).toBeTruthy()
    expect(capturedRequest.userId).toBe('dad-user-id')
    expect(capturedRequest.gameId).toBe('game-1')
    expect(capturedRequest.teamId).toBe('team-home')
  })

  test('Concurrent pick submission handling', async ({ page, context }) => {
    let requestCount = 0
    
    await page.route('**/api/picks', route => {
      if (route.request().method() === 'POST') {
        requestCount++
        
        // Simulate delay for first request, immediate for second
        if (requestCount === 1) {
          setTimeout(() => {
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ success: true })
            })
          }, 1000)
        } else {
          route.fulfill({
            status: 409, // Conflict
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Pick already exists' })
          })
        }
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ picks: [] })
        })
      }
    })

    await page.goto('/')
    await expect(page.locator('text=Week 1 Games (2 games)')).toBeVisible()
    
    // Select user
    await page.selectOption('select', 'dad-user-id')
    
    const gameCard = page.locator('.bg-muted\\/50').first()
    const homeTeamButton = gameCard.locator('text=HOM').first()
    
    // Click rapidly twice to simulate concurrent requests
    await homeTeamButton.click()
    await homeTeamButton.click()
    
    // First request should succeed, second might fail or be ignored
    // The UI should handle this gracefully without breaking
    await expect(gameCard.locator('text=✓ You picked: HOM')).toBeVisible({ timeout: 2000 })
  })
})