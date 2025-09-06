import { D1DatabaseManager } from '../lib/db-workers'
import * as bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

interface Env {
  DB: D1Database
  NEXTAUTH_SECRET?: string
  THE_ODDS_API_KEY?: string
  NEXTAUTH_URL?: string
  THE_ODDS_API_BASE_URL?: string
  CURRENT_NFL_SEASON?: string
  CURRENT_NFL_WEEK?: string
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url
    
    // Initialize database manager
    const db = new D1DatabaseManager(env.DB)
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }
    
    try {
      // API Routes
      if (pathname.startsWith('/api/')) {
        const response = await handleApiRequest(request, pathname, db, env)
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
        return response
      }
      
      // Serve static files or return 404
      return new Response('Not Found', { status: 404 })
      
    } catch (error) {
      console.error('Worker error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }), 
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      )
    }
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Scheduled score update triggered at:', new Date().toISOString())
    
    try {
      // Initialize database manager
      const db = new D1DatabaseManager(env.DB)
      
      // Run the scheduled score update
      await scheduledScoreUpdate(db, env, ctx)
      
    } catch (error) {
      console.error('Scheduled task error:', error)
      throw error // This will be logged by Cloudflare Workers
    }
  }
}

async function handleApiRequest(request: Request, pathname: string, db: D1DatabaseManager, env: Env): Promise<Response> {
  const method = request.method
  const url = new URL(request.url)
  
  // Teams API
  if (pathname === '/api/teams') {
    if (method === 'GET') {
      const teams = await db.getAllTeams()
      return new Response(JSON.stringify(teams), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Games API
  if (pathname === '/api/games') {
    if (method === 'GET') {
      const week = parseInt(url.searchParams.get('week') || env.CURRENT_NFL_WEEK || '1')
      const season = parseInt(url.searchParams.get('season') || env.CURRENT_NFL_SEASON || '2025')
      
      const games = await db.getGamesWithDetails(week, season)
      return new Response(JSON.stringify(games), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Picks API
  if (pathname === '/api/picks') {
    if (method === 'GET') {
      // Get all picks for all users (no authentication required)
      try {
        const result = await db.query(`
          SELECT p.*, u.name as userName, t.abbreviation as teamAbbr 
          FROM picks p 
          JOIN users u ON p.userId = u.id 
          JOIN teams t ON p.teamId = t.id
        `)
        
        const picks = result.results.map(row => ({
          gameId: row.gameId,
          userId: row.userId,
          teamId: row.teamId,
          userName: row.userName,
          teamAbbr: row.teamAbbr
        }))
        
        return new Response(JSON.stringify({ picks }), {
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response(JSON.stringify({ picks: [] }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    if (method === 'POST') {
      // Create/update pick (userId provided in request body)
      try {
        const body = await request.json() as { userId: string; gameId: string; teamId: string }
        
        if (!body.userId || !body.gameId || !body.teamId) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        
        // Upsert the pick
        await db.query(
          `INSERT OR REPLACE INTO picks (id, userId, gameId, teamId, points, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
          [`${body.userId}-${body.gameId}`, body.userId, body.gameId, body.teamId]
        )
        
        return new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to save pick' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
  }
  
  // Authentication API
  if (pathname === '/api/auth/register') {
    if (method === 'POST') {
      const body = await request.json() as { email: string; password: string; name?: string }
      
      // Check if user exists
      const existingUser = await db.getUserByEmail(body.email)
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'User already exists' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(body.password, 12)
      
      // Create user
      const user = await db.createUser({
        email: body.email,
        name: body.name,
        passwordHash
      })
      
      // Create session token
      const token = await createJWT({ userId: user.id, email: user.email }, env)
      
      return new Response(JSON.stringify({ user, token }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  if (pathname === '/api/auth/signin') {
    if (method === 'POST') {
      const body = await request.json() as { email: string; password: string }
      
      // Find user
      const user = await db.getUserByEmail(body.email)
      if (!user || !user.password) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Verify password
      const isValid = await bcrypt.compare(body.password, user.password)
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Create session token
      const token = await createJWT({ userId: user.id, email: user.email }, env)
      
      return new Response(JSON.stringify({ user: { ...user, password: undefined }, token }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  if (pathname === '/api/auth/session') {
    if (method === 'GET') {
      const userId = await getUserIdFromRequest(request, env)
      if (!userId) {
        return new Response(JSON.stringify({ user: null }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const user = await db.getUserById(userId)
      return new Response(JSON.stringify({ 
        user: user ? { ...user, password: undefined } : null 
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Leaderboard API
  if (pathname === '/api/leaderboard') {
    if (method === 'GET') {
      const week = url.searchParams.get('week')
      const season = url.searchParams.get('season')
      
      const leaderboard = await db.getLeaderboard(
        week ? parseInt(week) : undefined,
        season ? parseInt(season) : undefined
      )
      
      return new Response(JSON.stringify(leaderboard), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }


  // Odds API sync
  if (pathname === '/api/odds/sync') {
    if (method === 'POST') {
      try {
        const result = await syncOddsApi(db, env)
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Sync failed', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
  }

  // Manual score update trigger (for testing)
  if (pathname === '/api/scores/update') {
    if (method === 'POST') {
      try {
        console.log('Manual score update triggered via API')
        
        // Create a mock ExecutionContext for the manual trigger
        const mockCtx = {
          waitUntil: (promise: Promise<any>) => {},
          passThroughOnException: () => {}
        } as ExecutionContext
        
        // Run the scheduled update function
        await scheduledScoreUpdate(db, env, mockCtx)
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Score update completed successfully',
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Score update failed', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
  }

  // Scheduler logs API (for monitoring)
  if (pathname === '/api/scheduler/logs') {
    if (method === 'GET') {
      try {
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const result = await db.db.prepare(`
          SELECT * FROM scheduler_logs 
          ORDER BY createdAt DESC 
          LIMIT ?
        `).bind(limit).all()
        
        return new Response(JSON.stringify({ 
          logs: result.results || [],
          count: (result.results || []).length
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response(JSON.stringify({ 
          logs: [],
          count: 0,
          error: 'Failed to fetch logs'
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
  }
  
  return new Response('Not Found', { status: 404 })
}

/**
 * Automated scheduler function for score updates and point awarding
 * Runs every 15 minutes during game days via cron trigger
 */
async function scheduledScoreUpdate(db: D1DatabaseManager, env: Env, ctx: ExecutionContext): Promise<void> {
  const currentTime = new Date()
  const currentSeason = parseInt(env.CURRENT_NFL_SEASON || '2025')
  
  console.log(`Starting scheduled score update at ${currentTime.toISOString()}`)
  
  // Check if we're in NFL season (September - February)
  const currentMonth = currentTime.getMonth() + 1; // getMonth() returns 0-11
  const isNFLSeason = currentMonth >= 9 || currentMonth <= 2; // Sep-Dec or Jan-Feb
  
  if (!isNFLSeason) {
    console.log(`Outside NFL season (month ${currentMonth}), skipping score update`)
    return
  }
  
  // Check if it's a game day (Thursday through Monday)
  const currentDay = currentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const isGameDay = currentDay >= 4 || currentDay <= 1; // Thu(4), Fri(5), Sat(6), Sun(0), Mon(1)
  
  if (!isGameDay) {
    console.log(`Not a game day (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][currentDay]}), skipping score update`)
    return
  }
  
  try {
    // Get games that need score updates (in progress or recently completed)
    const gamesNeedingUpdate = await getGamesNeedingUpdate(db, currentSeason)
    
    if (gamesNeedingUpdate.length === 0) {
      console.log('No games need score updates at this time')
      return
    }
    
    console.log(`Found ${gamesNeedingUpdate.length} games needing updates`)
    
    // Fetch latest scores from ESPN API
    const updatedGames = await fetchUpdatedScoresFromESPN(gamesNeedingUpdate)
    
    let gamesUpdated = 0
    let gamesCompleted = 0
    let pointsAwarded = 0
    
    // Process each updated game
    for (const updatedGame of updatedGames) {
      try {
        // Update game scores and completion status
        const wasUpdated = await updateGameScore(db, updatedGame)
        
        if (wasUpdated) {
          gamesUpdated++
          
          // If game is completed, award points to users
          if (updatedGame.isCompleted) {
            console.log(`Game ${updatedGame.id} completed: ${updatedGame.awayTeamAbbr} ${updatedGame.awayScore} - ${updatedGame.homeScore} ${updatedGame.homeTeamAbbr}`)
            
            const pointsThisGame = await awardPointsForCompletedGame(db, updatedGame)
            pointsAwarded += pointsThisGame
            gamesCompleted++
          }
        }
        
      } catch (error) {
        console.error(`Error processing game ${updatedGame.id}:`, error)
        // Continue processing other games even if one fails
      }
    }
    
    // Log summary
    console.log(`Scheduled update completed:`)
    console.log(`- Games checked: ${gamesNeedingUpdate.length}`)
    console.log(`- Games updated: ${gamesUpdated}`)
    console.log(`- Games completed: ${gamesCompleted}`)
    console.log(`- Points awarded: ${pointsAwarded}`)
    
    // Store execution metrics (optional - for monitoring)
    await logSchedulerExecution(db, {
      executionTime: currentTime,
      gamesChecked: gamesNeedingUpdate.length,
      gamesUpdated,
      gamesCompleted,
      pointsAwarded,
      duration: Date.now() - currentTime.getTime()
    })
    
  } catch (error) {
    console.error('Critical error in scheduled score update:', error)
    throw error // Re-throw to trigger Cloudflare Workers error logging
  }
}

/**
 * Get games that need score updates (in progress or recently completed)
 */
async function getGamesNeedingUpdate(db: D1DatabaseManager, season: number): Promise<any[]> {
  const now = new Date()
  
  // Get games that:
  // 1. Are scheduled to start in the last 6 hours (might be in progress)
  // 2. Are not completed yet
  // 3. Or were completed in the last 2 hours (for final score verification)
  const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000))
  
  try {
    // First check what columns exist by trying a simple query
    const tableInfo = await db.db.prepare(`PRAGMA table_info(games)`).all()
    console.log('Games table columns:', tableInfo.results?.map((col: any) => col.name).join(', '))
    
    // For now, get all games from current season that aren't completed or were recently completed
    const result = await db.db.prepare(`
      SELECT g.*, 
             ht.abbreviation as homeTeamAbbr, 
             at.abbreviation as awayTeamAbbr
      FROM games g
      JOIN teams ht ON g.homeTeamId = ht.id
      JOIN teams at ON g.awayTeamId = at.id
      WHERE g.season = ? 
      AND (
        -- Games that should be in progress (not completed)
        (g.gameDate >= ? AND g.isCompleted = 0)
        OR
        -- All completed games (we'll filter for recent ones in code)
        (g.isCompleted = 1)
      )
      ORDER BY g.gameDate ASC
    `).bind(
      season,
      sixHoursAgo.toISOString()
    ).all()
    
    return result.results || []
  } catch (error) {
    console.error('Error getting games needing update:', error)
    return []
  }
}

/**
 * Fetch updated scores from ESPN API for specific games
 */
async function fetchUpdatedScoresFromESPN(games: any[]): Promise<any[]> {
  const updatedGames: any[] = []
  
  // Group games by week for efficient API calls
  const gamesByWeek = games.reduce((acc: {[key: number]: any[]}, game) => {
    if (!acc[game.week]) acc[game.week] = []
    acc[game.week].push(game)
    return acc
  }, {})
  
  // Fetch ESPN data for each week
  for (const [week, weekGames] of Object.entries(gamesByWeek)) {
    try {
      const espnGames = await fetchESPNGamesForWeek(parseInt(week), weekGames[0].season)
      
      // Match ESPN games with our games and extract updates
      for (const ourGame of weekGames) {
        const espnGame = espnGames.find((eg: any) => 
          eg.homeTeamId === ourGame.homeTeamAbbr && 
          eg.awayTeamId === ourGame.awayTeamAbbr
        )
        
        if (espnGame) {
          // Check if scores have changed or game status changed
          const hasScoreUpdate = 
            espnGame.homeScore !== ourGame.homeScore ||
            espnGame.awayScore !== ourGame.awayScore ||
            (espnGame.status === 'FINAL' && !ourGame.isCompleted)
          
          if (hasScoreUpdate) {
            updatedGames.push({
              ...ourGame,
              homeScore: espnGame.homeScore,
              awayScore: espnGame.awayScore,
              isCompleted: espnGame.status === 'FINAL' || espnGame.status === 'COMPLETED',
              winnerTeamId: getWinnerTeamId(espnGame, ourGame)
            })
          }
        }
      }
      
    } catch (error) {
      console.error(`Error fetching ESPN data for week ${week}:`, error)
      // Continue with other weeks
    }
  }
  
  return updatedGames
}

/**
 * Fetch ESPN games for a specific week (optimized version of existing function)
 */
async function fetchESPNGamesForWeek(week: number, season: number): Promise<any[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}&dates=${season}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`)
  }
  
  const data = await response.json()
  
  if (!data.events || !Array.isArray(data.events)) {
    return []
  }
  
  return data.events.map((event: any) => {
    const competition = event.competitions?.[0]
    const competitors = competition?.competitors || []
    
    const homeCompetitor = competitors.find((comp: any) => comp.homeAway === 'home')
    const awayCompetitor = competitors.find((comp: any) => comp.homeAway === 'away')
    
    return {
      id: event.id,
      status: competition?.status?.type?.name || 'SCHEDULED',
      homeTeamId: homeCompetitor?.team?.abbreviation,
      awayTeamId: awayCompetitor?.team?.abbreviation,
      homeScore: homeCompetitor?.score ? parseInt(homeCompetitor.score) : null,
      awayScore: awayCompetitor?.score ? parseInt(awayCompetitor.score) : null
    }
  })
}

/**
 * Update game score in the database
 */
async function updateGameScore(db: D1DatabaseManager, updatedGame: any): Promise<boolean> {
  try {
    // First try with updatedAt column, fall back to without it if column doesn't exist
    let result;
    try {
      result = await db.db.prepare(`
        UPDATE games 
        SET homeScore = ?, 
            awayScore = ?, 
            isCompleted = ?,
            winnerTeamId = ?,
            updatedAt = datetime('now')
        WHERE id = ?
      `).bind(
        updatedGame.homeScore,
        updatedGame.awayScore,
        updatedGame.isCompleted ? 1 : 0,
        updatedGame.winnerTeamId,
        updatedGame.id
      ).run()
    } catch (columnError) {
      // If updatedAt column doesn't exist, update without it
      console.log('updatedAt column not found, updating without it')
      result = await db.db.prepare(`
        UPDATE games 
        SET homeScore = ?, 
            awayScore = ?, 
            isCompleted = ?,
            winnerTeamId = ?
        WHERE id = ?
      `).bind(
        updatedGame.homeScore,
        updatedGame.awayScore,
        updatedGame.isCompleted ? 1 : 0,
        updatedGame.winnerTeamId,
        updatedGame.id
      ).run()
    }
    
    return result.changes > 0
    
  } catch (error) {
    console.error(`Error updating game ${updatedGame.id}:`, error)
    return false
  }
}

/**
 * Award points to users for a completed game
 */
async function awardPointsForCompletedGame(db: D1DatabaseManager, completedGame: any): Promise<number> {
  if (!completedGame.winnerTeamId) {
    console.log(`No winner determined for game ${completedGame.id}, skipping point awards`)
    return 0
  }
  
  try {
    // Get all picks for this game
    const picks = await db.db.prepare(`
      SELECT p.*, u.name as userName, t.abbreviation as teamAbbr
      FROM picks p
      JOIN users u ON p.userId = u.id
      JOIN teams t ON p.teamId = t.id
      WHERE p.gameId = ?
    `).bind(completedGame.id).all()
    
    if (!picks.results || picks.results.length === 0) {
      console.log(`No picks found for game ${completedGame.id}`)
      return 0
    }
    
    let pointsAwarded = 0
    
    // Award points to correct picks
    for (const pick of picks.results) {
      const isCorrect = pick.teamId === completedGame.winnerTeamId
      const points = isCorrect ? 1 : 0
      
      // Update pick with points and correctness
      try {
        await db.db.prepare(`
          UPDATE picks 
          SET points = ?, 
              isCorrect = ?,
              updatedAt = datetime('now')
          WHERE id = ?
        `).bind(points, isCorrect ? 1 : 0, pick.id).run()
      } catch (columnError) {
        // If updatedAt column doesn't exist in picks table, update without it
        await db.db.prepare(`
          UPDATE picks 
          SET points = ?, 
              isCorrect = ?
          WHERE id = ?
        `).bind(points, isCorrect ? 1 : 0, pick.id).run()
      }
      
      if (isCorrect) {
        pointsAwarded++
        console.log(`Awarded 1 point to ${pick.userName} for picking ${pick.teamAbbr}`)
      }
    }
    
    console.log(`Total points awarded for game ${completedGame.id}: ${pointsAwarded}/${picks.results.length}`)
    return pointsAwarded
    
  } catch (error) {
    console.error(`Error awarding points for game ${completedGame.id}:`, error)
    return 0
  }
}

/**
 * Determine the winner team ID based on scores
 */
function getWinnerTeamId(espnGame: any, ourGame: any): string | null {
  if (!espnGame.homeScore || !espnGame.awayScore) return null
  
  const homeScore = parseInt(espnGame.homeScore)
  const awayScore = parseInt(espnGame.awayScore)
  
  if (homeScore > awayScore) {
    return ourGame.homeTeamId
  } else if (awayScore > homeScore) {
    return ourGame.awayTeamId
  }
  
  // Tie game - no winner
  return null
}

/**
 * Log scheduler execution for monitoring
 */
async function logSchedulerExecution(db: D1DatabaseManager, metrics: any): Promise<void> {
  try {
    // Create scheduler_logs table if it doesn't exist
    await db.db.prepare(`
      CREATE TABLE IF NOT EXISTS scheduler_logs (
        id TEXT PRIMARY KEY,
        executionTime TEXT NOT NULL,
        gamesChecked INTEGER DEFAULT 0,
        gamesUpdated INTEGER DEFAULT 0,
        gamesCompleted INTEGER DEFAULT 0,
        pointsAwarded INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `).run()
    
    // Insert execution log
    await db.db.prepare(`
      INSERT INTO scheduler_logs (id, executionTime, gamesChecked, gamesUpdated, gamesCompleted, pointsAwarded, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      metrics.executionTime.toISOString(),
      metrics.gamesChecked,
      metrics.gamesUpdated,
      metrics.gamesCompleted,
      metrics.pointsAwarded,
      metrics.duration
    ).run()
    
  } catch (error) {
    console.error('Error logging scheduler execution:', error)
    // Don't throw - logging failures shouldn't break the scheduler
  }
}

async function getUserIdFromRequest(request: Request, env: Env): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    const payload = await verifyJWT(token, env)
    return payload.userId as string
  } catch {
    return null
  }
}

async function createJWT(payload: any, env: Env): Promise<string> {
  const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET || 'fallback-secret-key')
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
}

async function verifyJWT(token: string, env: Env): Promise<any> {
  const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET || 'fallback-secret-key')
  
  const { payload } = await jwtVerify(token, secret)
  return payload
}

function calculateNFLWeek(gameDate: Date, season: number): number {
  // NFL 2025 season starts approximately September 4, 2025 (Thursday Night Football)
  // Week 1 games are typically played September 4-8, 2025
  const seasonStart = new Date(2025, 8, 4) // September 4, 2025 (month is 0-indexed)
  
  // Calculate days since season start
  const daysSinceStart = Math.floor((gameDate.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24))
  
  // Each NFL week is 7 days, starting Thursday
  // Week 1: Sep 4-10, Week 2: Sep 11-17, etc.
  const week = Math.floor(daysSinceStart / 7) + 1
  
  // Clamp to valid NFL weeks (1-18 regular season + 4 playoff weeks)
  return Math.max(1, Math.min(22, week))
}

async function syncOddsApi(db: D1DatabaseManager, env: Env): Promise<any> {
  const season = parseInt(env.CURRENT_NFL_SEASON || '2025')
  
  // Fetch from both ESPN and The Odds API
  const espnGames = await fetchESPNGames(season)
  const oddsGames = env.THE_ODDS_API_KEY ? await fetchOddsApiGames(env) : []

  console.log(`ESPN API: ${espnGames.length} games, Odds API: ${oddsGames.length} games`)

  // Clear existing games for entire season to sync all games
  await db.db.prepare('DELETE FROM games WHERE season = ?').bind(season).run()
  console.log(`Cleared existing games for season ${season}`)

  let gamesInserted = 0
  const weekCounts: { [key: number]: number } = {}
  
  // Process all ESPN games (primary source for schedule/teams)
  console.log(`Processing all ${espnGames.length} ESPN games`)
  
  for (const espnGame of espnGames) {
    try {
      console.log(`Processing game: ${espnGame.awayTeamId} @ ${espnGame.homeTeamId}`)
      
      // Find teams by abbreviation (ESPN already provides abbreviations)
      const homeTeam = await findTeamByName(db, espnGame.homeTeamId)
      const awayTeam = await findTeamByName(db, espnGame.awayTeamId)

      if (!homeTeam || !awayTeam) {
        console.warn(`Could not find teams: ${espnGame.homeTeamId} vs ${espnGame.awayTeamId}`)
        continue
      }

      const calculatedWeek = espnGame.week
      weekCounts[calculatedWeek] = (weekCounts[calculatedWeek] || 0) + 1

      // ESPN data is primary - only supplement with Odds API if ESPN data is missing
      let homeSpread = espnGame.homeSpread
      let overUnder = espnGame.overUnder
      let oddsProvider = 'ESPN'

      // Only use Odds API to fill in missing ESPN data
      if ((!homeSpread || !overUnder) && oddsGames.length > 0) {
        const oddsMatch = oddsGames.find((og: any) => 
          og.homeTeamId === espnGame.homeTeamId && og.awayTeamId === espnGame.awayTeamId
        )
        
        if (oddsMatch) {
          // Only use Odds API data if ESPN doesn't have it
          if (!homeSpread && oddsMatch.homeSpread) {
            homeSpread = oddsMatch.homeSpread
            console.log(`Using Odds API spread for ${espnGame.homeTeamId} game`)
          }
          if (!overUnder && oddsMatch.overUnder) {
            overUnder = oddsMatch.overUnder
            console.log(`Using Odds API over/under for ${espnGame.homeTeamId} game`)
          }
          // Mark as mixed source if we used any Odds API data
          if ((!espnGame.homeSpread && oddsMatch.homeSpread) || (!espnGame.overUnder && oddsMatch.overUnder)) {
            oddsProvider = 'ESPN + The Odds API'
          }
        }
      }

      // Insert using remote database schema with correct team IDs
      await db.db.prepare(`
        INSERT INTO games (
          id, espnId, week, season, homeTeamId, awayTeamId, gameDate,
          isCompleted, homeScore, awayScore, homeSpread, overUnder,
          oddsProvider, oddsUpdatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        espnGame.id || crypto.randomUUID(),
        espnGame.id, // ESPN ID for reference
        calculatedWeek,
        season,
        homeTeam.id, // Use team UUID, not abbreviation
        awayTeam.id, // Use team UUID, not abbreviation
        espnGame.gameDate,
        espnGame.status === 'FINAL' || espnGame.status === 'COMPLETED',
        espnGame.homeScore,
        espnGame.awayScore,
        homeSpread ? homeSpread / 100 : null, // Convert from cents to decimal
        overUnder ? overUnder / 100 : null,   // Convert from cents to decimal
        oddsProvider,
        new Date().toISOString()
      ).run()

      gamesInserted++
      console.log(`Inserted: ${awayTeam.abbreviation} @ ${homeTeam.abbreviation} (Week ${calculatedWeek}) ${espnGame.status}`)

    } catch (error) {
      console.error(`Error processing game ${espnGame.homeTeamId} vs ${espnGame.awayTeamId}:`, error)
    }
  }

  console.log('Games by week:', weekCounts)

  return {
    success: true,
    message: `Successfully synced ${gamesInserted} games for Season ${season} across ${Object.keys(weekCounts).length} weeks`,
    dataSources: {
      espn: espnGames.length,
      odds: oddsGames.length,
      matches: gamesInserted
    },
    gamesInserted,
    weekBreakdown: weekCounts
  }
}

async function findTeamByName(db: D1DatabaseManager, teamName: string): Promise<any> {
  // Normalize team name for matching
  const normalized = teamName.toLowerCase().trim()
  console.log(`Looking for team: "${teamName}" (normalized: "${normalized}")`)
  
  // Try direct team mapping first for performance
  const teamMappings: { [key: string]: string } = {
    'philadelphia eagles': 'PHI',
    'philadelphia': 'PHI',
    'eagles': 'PHI',
    'new england patriots': 'NE',
    'new england': 'NE',
    'patriots': 'NE',
    'kansas city chiefs': 'KC',
    'kansas city': 'KC',
    'chiefs': 'KC',
    'san francisco 49ers': 'SF',
    'san francisco': 'SF',
    '49ers': 'SF',
    'dallas cowboys': 'DAL',
    'dallas': 'DAL',
    'cowboys': 'DAL',
    'green bay packers': 'GB',
    'green bay': 'GB',
    'packers': 'GB',
    'buffalo bills': 'BUF',
    'buffalo': 'BUF',
    'bills': 'BUF',
    'tampa bay buccaneers': 'TB',
    'tampa bay': 'TB',
    'buccaneers': 'TB',
    'los angeles rams': 'LAR',
    'los angeles chargers': 'LAC',
    'rams': 'LAR',
    'chargers': 'LAC',
    'baltimore ravens': 'BAL',
    'baltimore': 'BAL',
    'ravens': 'BAL',
    'pittsburgh steelers': 'PIT',
    'pittsburgh': 'PIT',
    'steelers': 'PIT',
    'seattle seahawks': 'SEA',
    'seattle': 'SEA',
    'seahawks': 'SEA',
    'minnesota vikings': 'MIN',
    'minnesota': 'MIN',
    'vikings': 'MIN',
    'indianapolis colts': 'IND',
    'indianapolis': 'IND',
    'colts': 'IND',
    'tennessee titans': 'TEN',
    'tennessee': 'TEN',
    'titans': 'TEN',
    'houston texans': 'HOU',
    'houston': 'HOU',
    'texans': 'HOU',
    'jacksonville jaguars': 'JAX',
    'jacksonville': 'JAX',
    'jaguars': 'JAX',
    'denver broncos': 'DEN',
    'denver': 'DEN',
    'broncos': 'DEN',
    'las vegas raiders': 'LV',
    'las vegas': 'LV',
    'raiders': 'LV',
    'miami dolphins': 'MIA',
    'miami': 'MIA',
    'dolphins': 'MIA',
    'new york jets': 'NYJ',
    'new york giants': 'NYG',
    'jets': 'NYJ',
    'giants': 'NYG',
    'washington commanders': 'WAS',
    'washington': 'WAS',
    'commanders': 'WAS',
    'chicago bears': 'CHI',
    'chicago': 'CHI',
    'bears': 'CHI',
    'detroit lions': 'DET',
    'detroit': 'DET',
    'lions': 'DET',
    'atlanta falcons': 'ATL',
    'atlanta': 'ATL',
    'falcons': 'ATL',
    'carolina panthers': 'CAR',
    'carolina': 'CAR',
    'panthers': 'CAR',
    'new orleans saints': 'NO',
    'new orleans': 'NO',
    'saints': 'NO',
    'arizona cardinals': 'ARI',
    'arizona': 'ARI',
    'cardinals': 'ARI',
    'cincinnati bengals': 'CIN',
    'cincinnati': 'CIN',
    'bengals': 'CIN',
    'cleveland browns': 'CLE',
    'cleveland': 'CLE',
    'browns': 'CLE'
  }

  const abbreviation = teamMappings[normalized]
  if (abbreviation) {
    const team = await db.db.prepare('SELECT * FROM teams WHERE abbreviation = ?').bind(abbreviation).first()
    if (team) return team
  }

  // Direct name match
  let team = await db.db.prepare('SELECT * FROM teams WHERE LOWER(name) = ? OR LOWER(abbreviation) = ?').bind(normalized, normalized.toUpperCase()).first()
  if (team) return team

  // Last resort: partial name match
  const results = await db.db.prepare('SELECT * FROM teams WHERE LOWER(name) LIKE ? OR LOWER(abbreviation) LIKE ?').bind(`%${normalized}%`, `%${normalized}%`).all()
  if (results.results && results.results.length > 0) return results.results[0]

  return null
}

async function fetchESPNGames(season: number): Promise<any[]> {
  try {
    console.log(`Fetching ESPN games for full season ${season}`)
    
    const allGames: any[] = []
    
    // Fetch all 18 regular season weeks
    for (let week = 1; week <= 18; week++) {
      try {
        console.log(`Fetching ESPN data for Week ${week}`)
        
        // ESPN API endpoint for NFL scoreboard data
        const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}&dates=${season}`
        
        const response = await fetch(url)
        if (!response.ok) {
          console.warn(`ESPN API error for Week ${week}: ${response.status}`)
          continue
        }
        
        const data = await response.json()
        console.log(`ESPN API Week ${week}: ${data.events?.length || 0} games found`)
        
        if (data.events && Array.isArray(data.events)) {
          // Transform ESPN data to our format
          const weekGames = data.events.map((event: any) => {
            const competition = event.competitions?.[0]
            const competitors = competition?.competitors || []
            
            // Find home and away teams
            const homeCompetitor = competitors.find((comp: any) => comp.homeAway === 'home')
            const awayCompetitor = competitors.find((comp: any) => comp.homeAway === 'away')
            
            // Extract odds if available
            const odds = competition?.odds?.[0]
            const overUnder = odds?.overUnder ? Math.round(odds.overUnder * 100) : null
            const homeSpread = odds?.spread ? Math.round(odds.spread * 100) : null
            
            return {
              id: event.id,
              season: season,
              week: week,
              gameDate: event.date,
              status: competition?.status?.type?.name || 'SCHEDULED',
              homeTeamId: homeCompetitor?.team?.abbreviation,
              awayTeamId: awayCompetitor?.team?.abbreviation,
              homeScore: homeCompetitor?.score ? parseInt(homeCompetitor.score) : null,
              awayScore: awayCompetitor?.score ? parseInt(awayCompetitor.score) : null,
              homeSpread: homeSpread,
              overUnder: overUnder,
              source: 'ESPN'
            }
          })
          
          allGames.push(...weekGames)
        }
        
        // Add small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (weekError) {
        console.error(`Error fetching Week ${week}:`, weekError)
        continue
      }
    }
    
    console.log(`Processed ${allGames.length} total games from ESPN API across all weeks`)
    return allGames
    
  } catch (error) {
    console.error('Error fetching ESPN games:', error)
    return []
  }
}

async function fetchOddsApiGames(env: Env): Promise<any[]> {
  try {
    console.log('Fetching odds from The Odds API')
    
    const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${env.THE_ODDS_API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american&dateFormat=iso`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Odds API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`Odds API response: ${data?.length || 0} games found`)
    
    if (!Array.isArray(data)) {
      console.log('No valid odds data found')
      return []
    }
    
    // Transform Odds API data to our format
    const games = data.map((game: any) => {
      const homeTeam = game.home_team
      const awayTeam = game.away_team
      
      // Extract spread and total from bookmakers
      let homeSpread = null
      let overUnder = null
      
      if (game.bookmakers && game.bookmakers.length > 0) {
        const bookmaker = game.bookmakers[0] // Use first bookmaker
        
        // Find spread market
        const spreadMarket = bookmaker.markets?.find((m: any) => m.key === 'spreads')
        if (spreadMarket && spreadMarket.outcomes) {
          const homeOutcome = spreadMarket.outcomes.find((o: any) => o.name === homeTeam)
          if (homeOutcome && homeOutcome.point) {
            homeSpread = Math.round(homeOutcome.point * 100)
          }
        }
        
        // Find totals market
        const totalsMarket = bookmaker.markets?.find((m: any) => m.key === 'totals')
        if (totalsMarket && totalsMarket.outcomes && totalsMarket.outcomes[0]) {
          overUnder = Math.round(totalsMarket.outcomes[0].point * 100)
        }
      }
      
      return {
        id: game.id,
        gameDate: game.commence_time,
        homeTeamId: homeTeam,
        awayTeamId: awayTeam,
        homeSpread: homeSpread,
        overUnder: overUnder,
        source: 'TheOddsAPI'
      }
    })
    
    console.log(`Processed ${games.length} games from Odds API`)
    return games
    
  } catch (error) {
    console.error('Error fetching odds:', error)
    return []
  }
}