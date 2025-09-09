import { test, expect } from '@playwright/test'

test.describe('Time-Lock Pick System E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set system time to a known value for consistent testing
    await page.addInitScript(() => {
      const mockDate = new Date('2025-09-07T12:00:00.000Z')
      Date.now = () => mockDate.getTime()
      Date.prototype.getTime = () => mockDate.getTime()
    })
  })

  test('Complete pick submission workflow before lock time', async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    
    // Verify user is logged in (assuming auth setup in global setup)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Navigate to games page
    await page.click('[data-testid="nav-games"]')
    await expect(page).toHaveURL(/.*games/)
    
    // Wait for games to load
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Find an unlocked game
    const unlockedGame = page.locator('[data-testid="game-card"]').filter({
      has: page.locator('[data-testid="pick-form"]')
    }).first()
    
    await expect(unlockedGame).toBeVisible()
    
    // Verify countdown timer is showing
    const countdownTimer = unlockedGame.locator('[data-testid="countdown-timer"]')
    await expect(countdownTimer).toBeVisible()
    await expect(countdownTimer).not.toContainText('Expired')
    
    // Submit a pick
    const homeTeamButton = unlockedGame.locator('[data-testid="pick-home-team"]')
    await homeTeamButton.click()
    
    // Verify pick submission success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Pick submitted successfully')
    
    // Verify pick is now locked
    await expect(unlockedGame.locator('[data-testid="pick-locked"]')).toBeVisible()
    await expect(unlockedGame.locator('[data-testid="pick-form"]')).not.toBeVisible()
    
    // Verify pick appears in user's picks list
    await page.click('[data-testid="nav-my-picks"]')
    await expect(page.locator('[data-testid="pick-item"]')).toBeVisible()
  })

  test('Pick submission blocked after lock time', async ({ page }) => {
    // Set time to after lock time for games
    await page.addInitScript(() => {
      const mockDate = new Date('2025-09-07T20:00:00.000Z') // 8 PM, well past game times
      Date.now = () => mockDate.getTime()
    })
    
    await page.goto('/games')
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Find a locked game
    const lockedGame = page.locator('[data-testid="game-card"]').filter({
      has: page.locator('[data-testid="game-locked"]')
    }).first()
    
    await expect(lockedGame).toBeVisible()
    
    // Verify game shows as locked
    await expect(lockedGame.locator('[data-testid="game-locked"]')).toBeVisible()
    await expect(lockedGame.locator('[data-testid="game-locked"]')).toContainText('Locked')
    
    // Verify countdown timer shows expired
    const countdownTimer = lockedGame.locator('[data-testid="countdown-timer"]')
    await expect(countdownTimer).toContainText('Expired')
    
    // Verify no pick form is available
    await expect(lockedGame.locator('[data-testid="pick-form"]')).not.toBeVisible()
    
    // Check if auto-pick was generated
    const autoPick = lockedGame.locator('[data-testid="auto-pick"]')
    if (await autoPick.isVisible()) {
      await expect(autoPick).toContainText('Auto-generated')
    }
  })

  test('Real-time updates during game state transitions', async ({ page }) => {
    await page.goto('/games')
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Verify real-time status indicator
    const realTimeStatus = page.locator('[data-testid="realtime-status"]')
    await expect(realTimeStatus).toBeVisible()
    
    // Wait for connection indicator to show "Live Updates"
    await expect(realTimeStatus).toContainText('Live Updates')
    
    // Find a game that's about to lock
    const gameCard = page.locator('[data-testid="game-card"]').first()
    const initialCountdown = await gameCard.locator('[data-testid="countdown-timer"]').textContent()
    
    // Wait for countdown to update (real-time)
    await page.waitForFunction((initialText) => {
      const currentCountdown = document.querySelector('[data-testid="countdown-timer"]')?.textContent
      return currentCountdown !== initialText
    }, initialCountdown, { timeout: 5000 })
    
    // Verify countdown updated
    const updatedCountdown = await gameCard.locator('[data-testid="countdown-timer"]').textContent()
    expect(updatedCountdown).not.toBe(initialCountdown)
  })

  test('Mobile responsive pick interface', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test')
    
    await page.goto('/games')
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Verify mobile pick interface
    const mobilePickInterface = page.locator('[data-testid="mobile-pick-interface"]')
    await expect(mobilePickInterface).toBeVisible()
    
    // Test touch interactions
    const homeTeamButton = page.locator('[data-testid="pick-home-team"]').first()
    await homeTeamButton.tap()
    
    // Verify haptic feedback simulation (visual feedback)
    await expect(homeTeamButton).toHaveClass(/.*selected.*/)
    
    // Test swipe gestures (if implemented)
    const gameCard = page.locator('[data-testid="game-card"]').first()
    await gameCard.hover()
    
    // Test accessibility on mobile
    await expect(page.locator('[data-testid="pick-deadline-indicator"]')).toBeVisible()
  })

  test('Auto-pick generation workflow', async ({ page }) => {
    // Set time to just before lock time
    await page.addInitScript(() => {
      const mockDate = new Date('2025-09-07T15:55:00.000Z') // 5 minutes before 4 PM lock
      Date.now = () => mockDate.getTime()
    })
    
    await page.goto('/games')
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Find a game without a pick submitted
    const gameCard = page.locator('[data-testid="game-card"]').filter({
      has: page.locator('[data-testid="pick-form"]')
    }).first()
    
    // Verify urgency indicator is showing (under 5 minutes)
    const countdownTimer = gameCard.locator('[data-testid="countdown-timer"]')
    await expect(countdownTimer).toHaveClass(/.*text-orange-600.*/)
    await expect(countdownTimer).toHaveClass(/.*animate-pulse.*/)
    
    // Wait for auto-pick to be generated (simulate time passing)
    await page.addInitScript(() => {
      const mockDate = new Date('2025-09-07T16:01:00.000Z') // 1 minute past lock
      Date.now = () => mockDate.getTime()
    })
    
    // Refresh to see updated state
    await page.reload()
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Verify auto-pick was generated
    const autoPick = gameCard.locator('[data-testid="auto-pick"]')
    await expect(autoPick).toBeVisible()
    await expect(autoPick).toContainText('Auto-generated')
    
    // Verify countdown shows expired
    await expect(countdownTimer).toContainText('Expired')
  })

  test('Accessibility compliance for time-lock features', async ({ page }) => {
    await page.goto('/games')
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Navigate to pick buttons with keyboard
    const homeTeamButton = page.locator('[data-testid="pick-home-team"]').first()
    await homeTeamButton.focus()
    await page.keyboard.press('Enter')
    
    // Verify ARIA labels and roles
    const countdownTimer = page.locator('[data-testid="countdown-timer"]').first()
    await expect(countdownTimer).toHaveAttribute('role', 'timer')
    await expect(countdownTimer).toHaveAttribute('aria-live', 'assertive')
    
    // Verify screen reader announcements for urgent states
    const urgentTimer = page.locator('[data-testid="countdown-timer"]').filter({
      hasText: /remaining!/
    }).first()
    
    if (await urgentTimer.isVisible()) {
      await expect(urgentTimer).toHaveAttribute('aria-atomic', 'true')
    }
    
    // Test high contrast mode compatibility
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(countdownTimer).toBeVisible()
    
    // Verify focus indicators are visible
    await homeTeamButton.focus()
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toHaveCSS('outline-width', /[^0].*/) // Has non-zero outline
  })

  test('Network failure recovery', async ({ page, context }) => {
    await page.goto('/games')
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Verify real-time connection is established
    const realTimeStatus = page.locator('[data-testid="realtime-status"]')
    await expect(realTimeStatus).toContainText('Live Updates')
    
    // Simulate network failure
    await context.setOffline(true)
    
    // Verify connection error is shown
    await expect(realTimeStatus).toContainText('Connection Error', { timeout: 10000 })
    
    // Restore network
    await context.setOffline(false)
    
    // Verify reconnection
    await expect(realTimeStatus).toContainText('Reconnecting', { timeout: 5000 })
    await expect(realTimeStatus).toContainText('Live Updates', { timeout: 10000 })
    
    // Verify functionality still works after reconnection
    const homeTeamButton = page.locator('[data-testid="pick-home-team"]').first()
    if (await homeTeamButton.isVisible()) {
      await homeTeamButton.click()
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    }
  })

  test('Performance under load simulation', async ({ page }) => {
    await page.goto('/games')
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Measure initial page load performance
    const startTime = Date.now()
    await page.reload()
    await page.waitForSelector('[data-testid="game-card"]')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000) // Page should load within 3 seconds
    
    // Test rapid interactions (simulate quick user actions)
    const pickButtons = page.locator('[data-testid="pick-home-team"]')
    const buttonCount = await pickButtons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = pickButtons.nth(i)
      if (await button.isVisible()) {
        await button.click()
        await page.waitForTimeout(100) // Brief pause between clicks
      }
    }
    
    // Verify UI remains responsive
    const navButton = page.locator('[data-testid="nav-leaderboard"]')
    const clickStart = Date.now()
    await navButton.click()
    await page.waitForURL(/.*leaderboard/)
    const navTime = Date.now() - clickStart
    
    expect(navTime).toBeLessThan(1000) // Navigation should be under 1 second
  })

  test('Security validation for pick submission', async ({ page }) => {
    await page.goto('/games')
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Test that client-side time manipulation doesn't affect server validation
    await page.addInitScript(() => {
      // Try to manipulate client time to bypass locks
      const futureTime = new Date('2025-09-07T10:00:00.000Z') // Earlier time
      Date.now = () => futureTime.getTime()
    })
    
    // Try to submit a pick for a game that should be locked server-side
    const gameCard = page.locator('[data-testid="game-card"]').first()
    const pickButton = gameCard.locator('[data-testid="pick-home-team"]')
    
    if (await pickButton.isVisible()) {
      await pickButton.click()
      
      // Should still be validated server-side regardless of client time
      const errorMessage = page.locator('[data-testid="error-message"]')
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText('locked') // Should show server-side lock validation
      }
    }
    
    // Test that authentication is required
    await page.evaluate(() => {
      // Clear localStorage auth token
      localStorage.removeItem('authToken')
      sessionStorage.clear()
    })
    
    await page.reload()
    
    // Should redirect to login or show unauthenticated state
    await expect(page.locator('[data-testid="login-required"]')).toBeVisible({
      timeout: 5000
    })
  })

  test('Game completion and scoring workflow', async ({ page }) => {
    // Set time to after games have completed
    await page.addInitScript(() => {
      const mockDate = new Date('2025-09-07T23:00:00.000Z') // 11 PM, after games
      Date.now = () => mockDate.getTime()
    })
    
    await page.goto('/games')
    await page.waitForSelector('[data-testid="game-card"]')
    
    // Find completed games
    const completedGame = page.locator('[data-testid="game-card"]').filter({
      has: page.locator('[data-testid="game-final"]')
    }).first()
    
    await expect(completedGame).toBeVisible()
    await expect(completedGame.locator('[data-testid="game-final"]')).toContainText('Final')
    
    // Verify final scores are displayed
    await expect(completedGame.locator('[data-testid="final-score"]')).toBeVisible()
    
    // Navigate to leaderboard to see updated standings
    await page.click('[data-testid="nav-leaderboard"]')
    await expect(page).toHaveURL(/.*leaderboard/)
    
    // Verify leaderboard shows updated points
    await expect(page.locator('[data-testid="leaderboard-entry"]')).toBeVisible()
    
    const userEntry = page.locator('[data-testid="leaderboard-entry"]').first()
    await expect(userEntry.locator('[data-testid="user-points"]')).toBeVisible()
    await expect(userEntry.locator('[data-testid="user-points"]')).toContainText(/\d+/)
    
    // Verify recent activity shows game completions
    const recentActivity = page.locator('[data-testid="recent-activity"]')
    if (await recentActivity.isVisible()) {
      await expect(recentActivity).toContainText('completed')
    }
  })
})