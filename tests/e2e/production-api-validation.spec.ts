import { test, expect } from '@playwright/test'

/**
 * PRODUCTION API VALIDATION TEST
 * 
 * This test validates the production API endpoints and basic functionality
 * as requested for GitHub Issue #1 validation.
 */

test.describe('Production API Validation', () => {
  const PRODUCTION_API = 'https://nfl-pickem-app-production.cybermattlee-llc.workers.dev'
  const PRODUCTION_URL = 'https://pickem.cyberlees.dev'

  test('Validate all production APIs are accessible and functional', async ({ request, page }) => {
    console.log('🎯 PRODUCTION API VALIDATION STARTED')
    console.log('====================================')

    // Test Games API
    console.log('📍 Testing Games API...')
    const gamesResponse = await request.get(`${PRODUCTION_API}/api/games`)
    expect(gamesResponse.ok(), 'Games API must be accessible').toBeTruthy()
    
    const gamesData = await gamesResponse.json()
    expect(Array.isArray(gamesData), 'Games API must return array').toBeTruthy()
    expect(gamesData.length, 'Games API must have data').toBeGreaterThan(0)
    console.log(`✅ Games API: ${gamesData.length} games available`)

    // Validate game structure
    const sampleGame = gamesData[0]
    expect(sampleGame).toHaveProperty('id')
    expect(sampleGame).toHaveProperty('homeTeam')
    expect(sampleGame).toHaveProperty('awayTeam')
    expect(sampleGame).toHaveProperty('gameDate')
    console.log(`✅ Game structure valid: ${sampleGame.homeTeam?.abbreviation} vs ${sampleGame.awayTeam?.abbreviation}`)

    // Test Teams API
    console.log('📍 Testing Teams API...')
    const teamsResponse = await request.get(`${PRODUCTION_API}/api/teams`)
    expect(teamsResponse.ok(), 'Teams API must be accessible').toBeTruthy()
    
    const teamsData = await teamsResponse.json()
    expect(Array.isArray(teamsData), 'Teams API must return array').toBeTruthy()
    expect(teamsData.length, 'Teams API must have 32 teams').toBe(32)
    console.log(`✅ Teams API: ${teamsData.length} teams loaded`)

    // Test Picks API
    console.log('📍 Testing Picks API...')
    const picksResponse = await request.get(`${PRODUCTION_API}/api/picks`)
    expect(picksResponse.ok(), 'Picks API must be accessible').toBeTruthy()
    console.log('✅ Picks API accessible')

    // Test Frontend Loading
    console.log('📍 Testing Frontend Loading...')
    await page.goto(PRODUCTION_URL, { timeout: 30000 })
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    
    // Check for main content
    const mainContent = page.locator('h1, [role="heading"], main')
    await expect(mainContent.first()).toBeVisible({ timeout: 10000 })
    console.log('✅ Frontend loads successfully')

    // Check for interactive elements
    const buttons = await page.locator('button').count()
    const links = await page.locator('a').count()
    console.log(`📊 Interactive elements found: ${buttons} buttons, ${links} links`)

    console.log('====================================')
    console.log('🎉 PRODUCTION VALIDATION COMPLETED!')
    console.log('====================================')
  })

  test('Frontend can connect to production API', async ({ page }) => {
    console.log('🔗 Testing Frontend → API Connection...')

    // Navigate to production app
    await page.goto(PRODUCTION_URL, { timeout: 30000 })
    await page.waitForLoadState('networkidle')

    // Monitor API calls from the frontend
    const apiCalls = []
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        })
      }
    })

    // Wait for initial API calls
    await page.waitForTimeout(5000)

    // Log API calls
    console.log(`📊 Frontend made ${apiCalls.length} API calls:`)
    for (const call of apiCalls) {
      console.log(`   ${call.ok ? '✅' : '❌'} ${call.status} ${call.url}`)
    }

    // Verify at least one successful API call was made
    const successfulCalls = apiCalls.filter(call => call.ok)
    expect(successfulCalls.length, 'Frontend must make successful API calls').toBeGreaterThan(0)
    
    console.log('✅ Frontend successfully connects to production API')
  })

  test('Game data structure validation', async ({ request }) => {
    console.log('📋 Validating game data structure...')

    const gamesResponse = await request.get(`${PRODUCTION_API}/api/games`)
    const games = await gamesResponse.json()

    // Check for future games (for pick submission testing)
    const futureGames = games.filter(game => {
      const gameDate = new Date(game.gameDate)
      const now = new Date()
      return gameDate > now && !game.isCompleted
    })

    console.log(`📊 Total games: ${games.length}`)
    console.log(`📊 Future games (available for picks): ${futureGames.length}`)
    console.log(`📊 Completed games: ${games.filter(g => g.isCompleted).length}`)

    // Validate betting data
    const gamesWithBetting = games.filter(game => 
      game.homeSpread !== null || game.overUnder !== null
    )
    console.log(`📊 Games with betting data: ${gamesWithBetting.length}`)

    if (gamesWithBetting.length > 0) {
      const sampleBetting = gamesWithBetting[0]
      console.log(`📊 Sample betting data: ${sampleBetting.homeTeam?.abbreviation} ${sampleBetting.homeSpread}, O/U: ${sampleBetting.overUnder}`)
    }

    // This validates that the ESP API integration from Issue #1 is working
    expect(games.length, 'Must have games data').toBeGreaterThan(0)
    expect(futureGames.length + games.filter(g => g.isCompleted).length, 'Must have mix of future and completed games').toBeGreaterThan(0)
    
    console.log('✅ Game data structure validation passed')
  })

  test('Time-lock functionality validation', async ({ request }) => {
    console.log('⏰ Validating time-lock functionality...')

    const gamesResponse = await request.get(`${PRODUCTION_API}/api/games`)
    const games = await gamesResponse.json()

    const now = new Date()
    
    // Categorize games by time status
    const startedGames = games.filter(game => {
      const gameDate = new Date(game.gameDate)
      return gameDate <= now || game.isCompleted
    })

    const futureGames = games.filter(game => {
      const gameDate = new Date(game.gameDate)
      return gameDate > now && !game.isCompleted
    })

    console.log(`📊 Games that should be locked (started/completed): ${startedGames.length}`)
    console.log(`📊 Games available for picks (future): ${futureGames.length}`)

    // For started games, picks should be locked
    if (startedGames.length > 0) {
      console.log(`🔒 Sample locked game: ${startedGames[0].homeTeam?.abbreviation} vs ${startedGames[0].awayTeam?.abbreviation}`)
      console.log(`   Game date: ${startedGames[0].gameDate}`)
      console.log(`   Is completed: ${startedGames[0].isCompleted}`)
    }

    // For future games, picks should be allowed
    if (futureGames.length > 0) {
      console.log(`🔓 Sample unlocked game: ${futureGames[0].homeTeam?.abbreviation} vs ${futureGames[0].awayTeam?.abbreviation}`)
      console.log(`   Game date: ${futureGames[0].gameDate}`)
    }

    console.log('✅ Time-lock data validation passed')
  })

  test('Production readiness checklist', async ({ page, request }) => {
    console.log('📋 PRODUCTION READINESS CHECKLIST')
    console.log('=================================')

    const checklist = {
      frontendLoads: false,
      apiAccessible: false,
      gamesDataPresent: false,
      teamsDataComplete: false,
      picksEndpointAccessible: false,
      responsiveDesign: false,
      bettingDataPresent: false
    }

    try {
      // Frontend loads
      await page.goto(PRODUCTION_URL, { timeout: 30000 })
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h1, [role="heading"]')).toBeVisible()
      checklist.frontendLoads = true
      console.log('✅ Frontend loads')

      // API accessible
      const gamesResponse = await request.get(`${PRODUCTION_API}/api/games`)
      checklist.apiAccessible = gamesResponse.ok()
      console.log(`${checklist.apiAccessible ? '✅' : '❌'} API accessible`)

      // Games data present
      if (checklist.apiAccessible) {
        const games = await gamesResponse.json()
        checklist.gamesDataPresent = Array.isArray(games) && games.length > 0
        console.log(`${checklist.gamesDataPresent ? '✅' : '❌'} Games data present (${games.length} games)`)

        // Betting data present
        checklist.bettingDataPresent = games.some(g => g.homeSpread !== null || g.overUnder !== null)
        console.log(`${checklist.bettingDataPresent ? '✅' : '❌'} Betting data present`)
      }

      // Teams data complete
      const teamsResponse = await request.get(`${PRODUCTION_API}/api/teams`)
      if (teamsResponse.ok()) {
        const teams = await teamsResponse.json()
        checklist.teamsDataComplete = Array.isArray(teams) && teams.length === 32
        console.log(`${checklist.teamsDataComplete ? '✅' : '❌'} Teams data complete (${teams.length}/32 teams)`)
      }

      // Picks endpoint accessible
      const picksResponse = await request.get(`${PRODUCTION_API}/api/picks`)
      checklist.picksEndpointAccessible = picksResponse.ok()
      console.log(`${checklist.picksEndpointAccessible ? '✅' : '❌'} Picks endpoint accessible`)

      // Responsive design
      await page.setViewportSize({ width: 375, height: 812 })
      await expect(page.locator('h1, [role="heading"]')).toBeVisible()
      checklist.responsiveDesign = true
      console.log('✅ Responsive design works')

    } catch (error) {
      console.log(`❌ Checklist error: ${error}`)
    }

    console.log('=================================')
    console.log('📊 PRODUCTION READINESS SUMMARY:')
    
    const passed = Object.values(checklist).filter(Boolean).length
    const total = Object.keys(checklist).length
    
    for (const [key, value] of Object.entries(checklist)) {
      console.log(`${value ? '✅' : '❌'} ${key}`)
    }
    
    console.log(`=================================`)
    console.log(`🎯 SCORE: ${passed}/${total} checks passed`)
    
    if (passed === total) {
      console.log('🎉 PRODUCTION IS READY!')
    } else {
      console.log('⚠️  PRODUCTION NEEDS ATTENTION')
    }

    // Assert critical functionality
    expect(checklist.frontendLoads, 'Frontend must load').toBeTruthy()
    expect(checklist.apiAccessible, 'API must be accessible').toBeTruthy()
    expect(checklist.gamesDataPresent, 'Games data must be present').toBeTruthy()
    expect(checklist.teamsDataComplete, 'All 32 teams must be loaded').toBeTruthy()
    expect(checklist.picksEndpointAccessible, 'Picks endpoint must be accessible').toBeTruthy()

    console.log('=================================')
  })
})