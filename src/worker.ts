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
    const userId = await getUserIdFromRequest(request, env)
    
    if (method === 'GET') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const week = url.searchParams.get('week')
      const season = url.searchParams.get('season')
      
      const picks = await db.getUserPicks(
        userId,
        week ? parseInt(week) : undefined,
        season ? parseInt(season) : undefined
      )
      
      return new Response(JSON.stringify(picks), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (method === 'POST') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const body = await request.json() as { gameId: string; teamId: string }
      
      const pick = await db.upsertPick({
        userId,
        gameId: body.gameId,
        teamId: body.teamId
      })
      
      return new Response(JSON.stringify(pick), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
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
  
  return new Response('Not Found', { status: 404 })
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
  const apiKey = env.THE_ODDS_API_KEY
  const baseUrl = env.THE_ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4'
  const season = parseInt(env.CURRENT_NFL_SEASON || '2025')

  if (!apiKey) {
    throw new Error('THE_ODDS_API_KEY is not configured')
  }

  // Get NFL games from The Odds API
  const apiUrl = `${baseUrl}/sports/americanfootball_nfl/odds/?apiKey=${apiKey}&regions=us&markets=spreads,totals&oddsFormat=american`
  
  console.log('Fetching NFL games from Odds API:', apiUrl.replace(apiKey, '[API_KEY]'))
  
  const response = await fetch(apiUrl)
  if (!response.ok) {
    throw new Error(`Odds API request failed: ${response.status} ${response.statusText}`)
  }

  const games = await response.json()
  console.log(`Received ${games.length} games from Odds API`)

  // Clear existing games for entire season (since we're importing all weeks)
  await db.db.prepare('DELETE FROM games WHERE season = ?').bind(season).run()
  console.log(`Cleared existing games for season ${season}`)

  let gamesInserted = 0
  const weekCounts: { [key: number]: number } = {}
  
  for (const game of games) {
    try {
      console.log(`Processing game: ${game.away_team} @ ${game.home_team}`)
      
      // Find teams by name
      const homeTeam = await findTeamByName(db, game.home_team)
      const awayTeam = await findTeamByName(db, game.away_team)

      if (!homeTeam || !awayTeam) {
        console.warn(`Could not find teams for game: ${game.home_team} vs ${game.away_team}`)
        console.warn(`Home team result:`, homeTeam)
        console.warn(`Away team result:`, awayTeam)
        continue
      }

      // Calculate correct NFL week based on game date
      const gameDate = new Date(game.commence_time)
      const calculatedWeek = calculateNFLWeek(gameDate, season)
      
      // Track games per week
      weekCounts[calculatedWeek] = (weekCounts[calculatedWeek] || 0) + 1

      // Extract betting lines from first bookmaker
      const spreadsMarket = game.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'spreads')
      const totalsMarket = game.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'totals')

      const homeSpread = spreadsMarket?.outcomes?.find((o: any) => o.name === game.home_team)?.price || 0
      const totalPoints = totalsMarket?.outcomes?.[0]?.price || 0

      // Insert game into database with calculated week
      await db.db.prepare(`
        INSERT INTO games (
          id,
          homeTeamId, 
          awayTeamId, 
          season, 
          week, 
          gameDate, 
          homeSpread, 
          overUnder, 
          isCompleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        homeTeam.id, 
        awayTeam.id, 
        season, 
        calculatedWeek, 
        gameDate.toISOString(), 
        homeSpread, 
        totalPoints, 
        false
      ).run()

      gamesInserted++
      console.log(`Inserted game: ${awayTeam.abbreviation} @ ${homeTeam.abbreviation} (Week ${calculatedWeek})`)

    } catch (error) {
      console.error(`Error processing game ${game.home_team} vs ${game.away_team}:`, error)
    }
  }

  // Log week breakdown
  console.log('Games by week:', weekCounts)

  return {
    success: true,
    message: `Successfully synced ${gamesInserted} games for Season ${season} across ${Object.keys(weekCounts).length} weeks`,
    gamesProcessed: games.length,
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