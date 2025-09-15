import { z } from 'zod'

// Data schemas (matching existing D1 database structure)
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  image: z.string().nullable(),
  password: z.string().nullable(), // bcrypt hash
  emailVerified: z.coerce.date().nullable(),
  isAdmin: z.coerce.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
}).transform(data => ({
  ...data,
  passwordHash: data.password, // Alias for compatibility
  passwordSalt: null,
  microsoftId: null,
  role: 'user'
}))

const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().optional(),
  abbreviation: z.string(),
  conference: z.string().nullable().optional(),
  division: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  secondaryColor: z.string().nullable().optional()
})

const GameSchema = z.object({
  id: z.string(),
  espnId: z.string().nullable().optional(),
  week: z.number(),
  season: z.number(),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  gameTime: z.coerce.date(), // Match actual database column
  gameType: z.string().default('regular').optional(),
  status: z.string().default('scheduled').optional(),
  homeScore: z.number().nullable(),
  awayScore: z.number().nullable(),
  spread: z.number().nullable(),
  overUnder: z.number().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  // Legacy fields for compatibility
  gameDate: z.coerce.date().optional(),
  isCompleted: z.coerce.boolean().optional(),
  winnerTeamId: z.string().nullable().optional(),
  homeSpread: z.number().nullable().optional(),
  awaySpread: z.number().nullable().optional(),
  homeMoneyline: z.number().nullable().optional(),
  awayMoneyline: z.number().nullable().optional(),
  oddsProvider: z.string().nullable().optional(),
  oddsUpdatedAt: z.coerce.date().nullable().optional()
})

const PickSchema = z.object({
  id: z.string(),
  userId: z.string(),
  gameId: z.string(),
  teamId: z.string(),
  confidence: z.number().nullable().optional(),
  points: z.number().nullable(),
  isCorrect: z.boolean().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

// Type exports
export type User = z.infer<typeof UserSchema>
export type Team = z.infer<typeof TeamSchema>
export type Game = z.infer<typeof GameSchema>
export type Pick = z.infer<typeof PickSchema>

export class D1DatabaseManager {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  // Helper method for raw SQL queries (used by time-lock system)
  async query(sql: string, params: any[] = []) {
    const result = await this.db.prepare(sql).bind(...params).all()
    return result
  }

  // User operations
  async createUser(userData: {
    email: string
    name?: string
    passwordHash?: string
    passwordSalt?: string
    microsoftId?: string
    role?: 'user' | 'admin'
  }): Promise<User> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, name, passwordHash, passwordSalt, microsoftId, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    await stmt.bind(
      id,
      userData.email,
      userData.name || null,
      userData.passwordHash || null,
      userData.passwordSalt || null,
      userData.microsoftId || null,
      userData.role || 'user',
      now,
      now
    ).run()

    return this.getUserById(id) as Promise<User>
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first()

    return result ? UserSchema.parse(result) : null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first()

    return result ? UserSchema.parse(result) : null
  }

  // Team operations
  async getAllTeams(): Promise<Team[]> {
    const results = await this.db.prepare('SELECT * FROM teams ORDER BY name').all()
    return results.results.map(team => TeamSchema.parse(team))
  }

  async getTeamById(id: string): Promise<Team | null> {
    const result = await this.db.prepare('SELECT * FROM teams WHERE id = ?')
      .bind(id)
      .first()

    return result ? TeamSchema.parse(result) : null
  }

  async getTeamByAbbreviation(abbreviation: string): Promise<Team | null> {
    const result = await this.db.prepare('SELECT * FROM teams WHERE abbreviation = ?')
      .bind(abbreviation)
      .first()
    
    if (!result) return null
    return TeamSchema.parse(result)
  }

  // Game operations
  async getGamesWithDetails(week: number, season: number): Promise<(Game & { homeTeam: Team; awayTeam: Team })[]> {
    const results = await this.db.prepare(`
      SELECT 
        g.id, g.espnId, g.homeTeamId, g.awayTeamId, g.gameDate, g.week, g.season, g.isCompleted,
        g.homeScore, g.awayScore, g.winnerTeamId, g.homeSpread, g.awaySpread,
        g.homeMoneyline, g.awayMoneyline, g.overUnder, g.oddsProvider, g.oddsUpdatedAt,
        ht.id as homeTeam_id, ht.name as homeTeam_name, 
        ht.abbreviation as homeTeam_abbreviation, ht.logo as homeTeam_logo, ht.color as homeTeam_color,
        at.id as awayTeam_id, at.name as awayTeam_name, 
        at.abbreviation as awayTeam_abbreviation, at.logo as awayTeam_logo, at.color as awayTeam_color
      FROM games g
      LEFT JOIN teams ht ON g.homeTeamId = ht.id
      LEFT JOIN teams at ON g.awayTeamId = at.id
      WHERE g.week = ? AND g.season = ?
      ORDER BY g.gameDate ASC
    `)
      .bind(week, season)
      .all()

    return results.results.map(result => {
      // Map the actual database columns to our schema
      const game = GameSchema.parse({
        id: result.id,
        espnId: result.espnId,
        week: result.week,
        season: result.season,
        homeTeamId: result.homeTeamId,
        awayTeamId: result.awayTeamId,
        gameTime: result.gameDate, // Map gameDate to gameTime for compatibility
        gameDate: result.gameDate, // Actual column in DB
        isCompleted: result.isCompleted, // Actual column in DB
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        winnerTeamId: result.winnerTeamId,
        spread: result.homeSpread, // Use homeSpread as main spread
        homeSpread: result.homeSpread,
        awaySpread: result.awaySpread,
        homeMoneyline: result.homeMoneyline,
        awayMoneyline: result.awayMoneyline,
        overUnder: result.overUnder,
        oddsProvider: result.oddsProvider,
        oddsUpdatedAt: result.oddsUpdatedAt
      })

      const homeTeam = TeamSchema.parse({
        id: result.homeTeam_id,
        name: result.homeTeam_name,
        displayName: result.homeTeam_name,
        abbreviation: result.homeTeam_abbreviation,
        conference: null, // Not in actual DB schema
        division: null, // Not in actual DB schema
        logo: result.homeTeam_logo,
        logoUrl: result.homeTeam_logo, // Map logo to logoUrl for compatibility
        color: result.homeTeam_color,
        primaryColor: result.homeTeam_color, // Map color to primaryColor for compatibility
        secondaryColor: null // Not in actual DB schema
      })

      const awayTeam = TeamSchema.parse({
        id: result.awayTeam_id,
        name: result.awayTeam_name,
        displayName: result.awayTeam_name,
        abbreviation: result.awayTeam_abbreviation,
        conference: null, // Not in actual DB schema
        division: null, // Not in actual DB schema
        logo: result.awayTeam_logo,
        logoUrl: result.awayTeam_logo, // Map logo to logoUrl for compatibility
        color: result.awayTeam_color,
        primaryColor: result.awayTeam_color, // Map color to primaryColor for compatibility
        secondaryColor: null // Not in actual DB schema
      })

      return {
        ...game,
        homeTeam,
        awayTeam
      }
    })
  }

  async getGameById(id: string): Promise<Game | null> {
    const result = await this.db.prepare('SELECT * FROM games WHERE id = ?')
      .bind(id)
      .first()

    if (!result) return null

    // Map the actual database columns to our schema
    return GameSchema.parse({
      id: result.id,
      espnId: result.espnId,
      week: result.week,
      season: result.season,
      homeTeamId: result.homeTeamId,
      awayTeamId: result.awayTeamId,
      gameTime: result.gameDate, // Map gameDate to gameTime for compatibility
      gameDate: result.gameDate, // Actual column in DB
      isCompleted: result.isCompleted, // Actual column in DB
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      winnerTeamId: result.winnerTeamId,
      spread: result.homeSpread, // Use homeSpread as main spread
      homeSpread: result.homeSpread,
      awaySpread: result.awaySpread,
      homeMoneyline: result.homeMoneyline,
      awayMoneyline: result.awayMoneyline,
      overUnder: result.overUnder,
      oddsProvider: result.oddsProvider,
      oddsUpdatedAt: result.oddsUpdatedAt
    })
  }

  // Pick operations
  async upsertPick(pickData: {
    userId: string
    gameId: string
    teamId: string
  }): Promise<Pick> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // Try to update existing pick first
    const existing = await this.getPickByUserAndGame(pickData.userId, pickData.gameId)
    
    if (existing) {
      await this.db.prepare(`
        UPDATE picks SET teamId = ?, updatedAt = ? WHERE id = ?
      `)
        .bind(pickData.teamId, now, existing.id)
        .run()
      
      const updated = await this.getPickById(existing.id)
      if (!updated) throw new Error('Failed to update pick')
      return updated
    } else {
      // Create new pick
      await this.db.prepare(`
        INSERT INTO picks (id, userId, gameId, teamId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
        .bind(id, pickData.userId, pickData.gameId, pickData.teamId, now, now)
        .run()
      
      const created = await this.getPickById(id)
      if (!created) throw new Error('Failed to create pick')
      return created
    }
  }

  async getPickById(id: string): Promise<Pick | null> {
    const result = await this.db.prepare('SELECT * FROM picks WHERE id = ?')
      .bind(id)
      .first()

    return result ? PickSchema.parse(result) : null
  }

  async getPickByUserAndGame(userId: string, gameId: string): Promise<Pick | null> {
    const result = await this.db.prepare('SELECT * FROM picks WHERE userId = ? AND gameId = ?')
      .bind(userId, gameId)
      .first()

    return result ? PickSchema.parse(result) : null
  }

  async getUserPicks(userId: string, week?: number, season?: number): Promise<Pick[]> {
    let query = `
      SELECT p.* FROM picks p
      JOIN games g ON p.gameId = g.id
      WHERE p.userId = ?
    `
    const params = [userId]
    
    if (week !== undefined && season !== undefined) {
      query += ' AND g.week = ? AND g.season = ?'
      params.push(week, season)
    }
    
    query += ' ORDER BY g.gameDate ASC'
    
    const results = await this.db.prepare(query).bind(...params).all()
    return results.results.map(row => PickSchema.parse(row))
  }

  // Leaderboard operations
  async getLeaderboard(week?: number, season?: number): Promise<{
    userId: string
    userName: string
    weeklyPoints: number
    totalSeasonPoints: number
    weeklyPicks: number
    totalPicks: number
    weeklyCorrect: number
    totalCorrect: number
    weeklyPercentage: number
    seasonPercentage: number
    streak: number
  }[]> {
    // First get the season stats for all users
    const seasonQuery = `
      SELECT
        u.id as userId,
        u.name as userName,
        COUNT(p.id) as totalPicks,
        SUM(CASE WHEN p.isCorrect = 1 THEN 1 ELSE 0 END) as totalCorrect,
        SUM(p.points) as totalSeasonPoints,
        ROUND((SUM(CASE WHEN p.isCorrect = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(p.id)), 2) as seasonPercentage
      FROM users u
      LEFT JOIN picks p ON u.id = p.userId
      LEFT JOIN games g ON p.gameId = g.id
      WHERE p.id IS NOT NULL AND g.season = ?
      GROUP BY u.id, u.name
    `

    const seasonResults = await this.db.prepare(seasonQuery).bind(season || 2025).all()
    const seasonData = new Map(seasonResults.results.map((row: any) => [row.userId, row]))

    // Now get weekly stats if a specific week is requested
    if (week && season) {
      const weeklyQuery = `
        SELECT
          u.id as userId,
          u.name as userName,
          COUNT(p.id) as weeklyPicks,
          SUM(CASE WHEN p.isCorrect = 1 THEN 1 ELSE 0 END) as weeklyCorrect,
          SUM(p.points) as weeklyPoints,
          ROUND((SUM(CASE WHEN p.isCorrect = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(p.id)), 2) as weeklyPercentage
        FROM users u
        LEFT JOIN picks p ON u.id = p.userId
        LEFT JOIN games g ON p.gameId = g.id
        WHERE p.id IS NOT NULL AND g.week = ? AND g.season = ?
        GROUP BY u.id, u.name
      `

      const weeklyResults = await this.db.prepare(weeklyQuery).bind(week, season).all()
      const weeklyData = new Map(weeklyResults.results.map((row: any) => [row.userId, row]))

      // Combine weekly and season data
      const combined = Array.from(seasonData.entries()).map(([userId, seasonRow]) => {
        const weeklyRow = weeklyData.get(userId) || {
          weeklyPicks: 0,
          weeklyCorrect: 0,
          weeklyPoints: 0,
          weeklyPercentage: 0
        }

        return {
          userId: seasonRow.userId,
          userName: seasonRow.userName || 'Unknown',
          weeklyPoints: Number(weeklyRow.weeklyPoints) || 0,
          totalSeasonPoints: Number(seasonRow.totalSeasonPoints) || 0,
          weeklyPicks: Number(weeklyRow.weeklyPicks) || 0,
          totalPicks: Number(seasonRow.totalPicks) || 0,
          weeklyCorrect: Number(weeklyRow.weeklyCorrect) || 0,
          totalCorrect: Number(seasonRow.totalCorrect) || 0,
          weeklyPercentage: Number(weeklyRow.weeklyPercentage) || 0,
          seasonPercentage: Number(seasonRow.seasonPercentage) || 0,
          streak: 0 // TODO: Calculate streak
        }
      })

      // Sort by weekly points for week view, then by total points
      return combined.sort((a, b) => {
        if (b.weeklyPoints !== a.weeklyPoints) {
          return b.weeklyPoints - a.weeklyPoints
        }
        return b.totalSeasonPoints - a.totalSeasonPoints
      })
    } else {
      // Return season-only data
      return Array.from(seasonData.values()).map((row: any) => ({
        userId: row.userId,
        userName: row.userName || 'Unknown',
        weeklyPoints: 0,
        totalSeasonPoints: Number(row.totalSeasonPoints) || 0,
        weeklyPicks: 0,
        totalPicks: Number(row.totalPicks) || 0,
        weeklyCorrect: 0,
        totalCorrect: Number(row.totalCorrect) || 0,
        weeklyPercentage: 0,
        seasonPercentage: Number(row.seasonPercentage) || 0,
        streak: 0 // TODO: Calculate streak
      })).sort((a, b) => b.totalSeasonPoints - a.totalSeasonPoints)
    }
  }
}