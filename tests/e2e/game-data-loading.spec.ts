import { test, expect } from '@playwright/test'

test.describe('Game Data Loading and Error Handling E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const mockDate = new Date('2025-09-07T12:00:00.000Z')
      Date.now = () => mockDate.getTime()
    })
  })

  test('Successful game data loading', async ({ page, context }) => {
    // Mock successful API response
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
            homeSpread: -350, // -3.5
            overUnder: 4750 // 47.5
          }
        ])
      })
    })

    await page.goto('/')
    
    // Wait for loading to complete
    await expect(page.locator('text=Loading games...')).toBeVisible()
    await expect(page.locator('text=Loading games...')).not.toBeVisible()
    
    // Verify game data is displayed
    await expect(page.locator('text=Week 1 Games (1 games)')).toBeVisible()
    await expect(page.locator('text=HOM')).toBeVisible()
    await expect(page.locator('text=AWY')).toBeVisible()
    await expect(page.locator('text=Home Team')).toBeVisible()
    await expect(page.locator('text=Away Team')).toBeVisible()
    
    // Verify game info (spread and over/under)
    await expect(page.locator('text=Spread: HOM -3.5')).toBeVisible()
    await expect(page.locator('text=O/U: 47.5')).toBeVisible()
  })

  test('API error handling with fallback', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/games*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    await page.goto('/')
    
    // Wait for loading to complete
    await expect(page.locator('text=Loading games...')).toBeVisible()
    await expect(page.locator('text=Loading games...')).not.toBeVisible()
    
    // Verify error state is displayed
    await expect(page.locator('text=Error Loading Games')).toBeVisible()
    await expect(page.locator('text=HTTP 500: Internal Server Error')).toBeVisible()
  })

  test('Network timeout error handling', async ({ page }) => {
    // Mock network timeout
    await page.route('**/api/games*', route => {
      // Never respond to simulate timeout
      setTimeout(() => {
        route.abort('timedout')
      }, 1000)
    })

    await page.goto('/')
    
    // Wait for loading state
    await expect(page.locator('text=Loading games...')).toBeVisible()
    
    // Should show error after timeout
    await expect(page.locator('text=Error Loading Games')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Failed to load data')).toBeVisible()
  })

  test('Empty games data handling', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/games*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    await page.goto('/')
    
    await expect(page.locator('text=Loading games...')).not.toBeVisible({ timeout: 5000 })
    
    // Verify empty state message
    await expect(page.locator('text=Week 1 Games (0 games)')).toBeVisible()
    await expect(page.locator('text=No games found for Week 1, 2025')).toBeVisible()
  })

  test('Partial data handling with missing fields', async ({ page }) => {
    // Mock response with missing data
    await page.route('**/api/games*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'game-1',
            homeTeamId: 'team-home',
            awayTeamId: 'team-away',
            // Missing team objects
            gameDate: '2025-09-07T16:00:00.000Z',
            week: 1,
            season: 2025,
            isCompleted: false
            // Missing spread and over/under
          }
        ])
      })
    })

    await page.goto('/')
    
    await expect(page.locator('text=Loading games...')).not.toBeVisible({ timeout: 5000 })
    
    // Verify it handles missing data gracefully
    await expect(page.locator('text=Week 1 Games (1 games)')).toBeVisible()
    await expect(page.locator('text=Team team-home')).toBeVisible() // Fallback display
    await expect(page.locator('text=Team team-away')).toBeVisible()
    
    // Spread and over/under sections should not be visible
    await expect(page.locator('text=Spread:')).not.toBeVisible()
    await expect(page.locator('text=O/U:')).not.toBeVisible()
  })

  test('Leaderboard data loading', async ({ page }) => {
    // Mock leaderboard API
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
    
    // Wait for loading to complete
    await expect(page.locator('text=Loading leaderboard...')).toBeVisible()
    await expect(page.locator('text=Loading leaderboard...')).not.toBeVisible()
    
    // Verify leaderboard data
    await expect(page.locator('text=Week 1 • 2025 Season')).toBeVisible()
    await expect(page.locator('text=2 of 16 games completed')).toBeVisible()
    await expect(page.locator('text=🏆')).toBeVisible() // 1st place trophy
    await expect(page.locator('text=Dad')).toBeVisible()
    await expect(page.locator('text=Mom')).toBeVisible()
    
    // Verify stats
    await expect(page.locator('text=80.0%')).toBeVisible() // Win percentage
    await expect(page.locator('text=🔥 3')).toBeVisible() // Win streak
    await expect(page.locator('text=❄️ 1')).toBeVisible() // Loss streak
  })

  test('Leaderboard API failure with mock data fallback', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/leaderboard*', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not Found' })
      })
    })

    await page.goto('/leaderboard')
    
    await expect(page.locator('text=Loading leaderboard...')).not.toBeVisible({ timeout: 5000 })
    
    // Should fall back to mock data
    await expect(page.locator('text=Week 1 • 2025 Season')).toBeVisible()
    await expect(page.locator('text=Dad')).toBeVisible()
    await expect(page.locator('text=Mom')).toBeVisible()
    await expect(page.locator('text=TwoBow')).toBeVisible()
    await expect(page.locator('text=RockyDaRock')).toBeVisible()
  })

  test('Week and season selection functionality', async ({ page }) => {
    await page.route('**/api/leaderboard*', route => {
      const url = new URL(route.request().url())
      const week = url.searchParams.get('week') || '1'
      const season = url.searchParams.get('season') || '2025'
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          week: parseInt(week),
          season: parseInt(season),
          totalGames: 16,
          completedGames: 0,
          entries: []
        })
      })
    })

    await page.goto('/leaderboard')
    
    // Wait for initial load
    await expect(page.locator('text=Loading leaderboard...')).not.toBeVisible({ timeout: 5000 })
    
    // Test week selection
    await page.selectOption('select[id="week"]', '2')
    await expect(page.locator('text=Week 2 • 2025 Season')).toBeVisible()
    
    // Test season selection
    await page.selectOption('select[id="season"]', '2024')
    await expect(page.locator('text=Week 2 • 2024 Season')).toBeVisible()
  })

  test('Teams page data loading', async ({ page }) => {
    // Mock teams API
    await page.route('**/api/teams*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'team-1',
            abbreviation: 'DAL',
            name: 'Dallas Cowboys',
            city: 'Dallas',
            conference: 'NFC',
            division: 'NFC East'
          },
          {
            id: 'team-2', 
            abbreviation: 'NE',
            name: 'New England Patriots',
            city: 'Foxborough',
            conference: 'AFC',
            division: 'AFC East'
          }
        ])
      })
    })

    await page.goto('/teams')
    
    // Wait for loading to complete
    await expect(page.locator('text=Loading teams...')).toBeVisible()
    await expect(page.locator('text=Loading teams...')).not.toBeVisible()
    
    // Verify teams data
    await expect(page.locator('text=Dallas Cowboys')).toBeVisible()
    await expect(page.locator('text=New England Patriots')).toBeVisible()
    await expect(page.locator('text=DAL')).toBeVisible()
    await expect(page.locator('text=NE')).toBeVisible()
  })

  test('Data consistency across pages', async ({ page }) => {
    // Mock consistent team data across endpoints
    const teamData = {
      'team-1': { id: 'team-1', abbreviation: 'DAL', name: 'Dallas Cowboys' }
    }

    await page.route('**/api/teams*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json', 
        body: JSON.stringify(Object.values(teamData))
      })
    })

    await page.route('**/api/games*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'game-1',
            homeTeamId: 'team-1',
            awayTeamId: 'team-2',
            homeTeam: teamData['team-1'],
            awayTeam: { id: 'team-2', abbreviation: 'NE', name: 'New England Patriots' },
            gameDate: '2025-09-07T16:00:00.000Z',
            week: 1,
            season: 2025,
            isCompleted: false
          }
        ])
      })
    })

    // Check teams page
    await page.goto('/teams')
    await expect(page.locator('text=Dallas Cowboys')).toBeVisible()
    
    // Check same team data appears on games page
    await page.goto('/')
    await expect(page.locator('text=Dallas Cowboys')).toBeVisible()
    await expect(page.locator('text=DAL')).toBeVisible()
  })
})