import { User, Team, Game, Pick, Pool, PoolMember } from '@prisma/client'

// ==============================================================================
// CORE DATA TYPES
// ==============================================================================

export type UserWithPicks = User & {
  picks: Pick[]
}

export type GameWithTeams = Game & {
  homeTeam: Team
  awayTeam: Team
}

export type GameWithTeamsAndPicks = GameWithTeams & {
  picks: (Pick & { user: User; team: Team })[]
}

export type PickWithGame = Pick & {
  game: GameWithTeams
  team: Team
}

export type PoolWithMembers = Pool & {
  members: (PoolMember & { user: User })[]
}

export type WeeklyStanding = {
  userId: string
  username: string
  correctPicks: number
  totalPicks: number
  percentage: number
  points: number
}

export type SeasonStanding = WeeklyStanding & {
  weeklyResults: {
    week: number
    correctPicks: number
    totalPicks: number
    points: number
  }[]
}

// ==============================================================================
// CLOUDFLARE D1 DATABASE TYPES
// ==============================================================================

/**
 * Raw database result from D1 games query with team information joined
 * This matches the exact structure returned from the SQL query in Cloudflare Functions
 */
export interface D1GameWithTeamsRaw {
  // Game fields
  id: string
  espnId: string | null
  week: number
  season: number
  homeTeamId: string
  awayTeamId: string
  gameDate: string // ISO string from D1
  isCompleted: boolean
  homeScore: number | null
  awayScore: number | null
  winnerTeamId: string | null
  homeSpread: number | null
  awaySpread: number | null
  homeMoneyline: number | null
  awayMoneyline: number | null
  overUnder: number | null
  oddsProvider: string | null
  oddsUpdatedAt: string | null // ISO string from D1
  
  // Joined team fields
  homeTeamName: string
  homeTeamAbbr: string
  awayTeamName: string
  awayTeamAbbr: string
}

/**
 * Processed game data with proper team objects
 * This is what we transform D1GameWithTeamsRaw into for API responses
 */
export interface GameWithTeamsForAPI {
  id: string
  espnId: string | null
  week: number
  season: number
  homeTeamId: string
  awayTeamId: string
  gameDate: string // ISO string
  isCompleted: boolean
  homeScore: number | null
  awayScore: number | null
  winnerTeamId: string | null
  homeSpread: number | null
  awaySpread: number | null
  homeMoneyline: number | null
  awayMoneyline: number | null
  overUnder: number | null
  oddsProvider: string | null
  oddsUpdatedAt: string | null
  
  // Structured team objects
  homeTeam: {
    id: string
    name: string
    abbreviation: string
  }
  awayTeam: {
    id: string
    name: string
    abbreviation: string
  }
}

// ==============================================================================
// API RESPONSE CONTRACTS
// ==============================================================================

/**
 * Standard API response wrapper for all endpoints
 * Ensures consistent response format across the application
 */
export interface ApiResponse<TData = any> {
  /** Indicates whether the request was successful */
  success: boolean
  /** Response data (only present on success) */
  data?: TData
  /** Error message (only present on failure) */
  error?: string
  /** Additional error details for debugging (only present on failure) */
  details?: string
  /** Optional metadata */
  metadata?: Record<string, any>
}

/**
 * Success response wrapper
 */
export interface ApiSuccessResponse<TData = any> extends ApiResponse<TData> {
  success: true
  data: TData
  error?: never
  details?: never
}

/**
 * Error response wrapper
 */
export interface ApiErrorResponse extends ApiResponse {
  success: false
  data?: never
  error: string
  details?: string
}

/**
 * Games API specific response format
 * This is the contract that the frontend expects
 */
export interface GamesApiResponse extends ApiSuccessResponse<{
  games: GameWithTeamsForAPI[]
  week: number
  season: number
  count: number
}> {
  // Legacy format support - will be deprecated
  games: GameWithTeamsForAPI[]
  week: number
  season: number
  count?: number
}

/**
 * Teams API response format
 */
export interface TeamsApiResponse extends ApiSuccessResponse<{
  teams: Team[]
  count: number
}> {
  // Legacy format support
  teams: Team[]
  count?: number
}

/**
 * Picks API response format
 */
export interface PicksApiResponse extends ApiSuccessResponse<{
  picks: PickWithGame[]
  week: number
  season: number
  count: number
}> {
  // Legacy format support
  picks: PickWithGame[]
  week: number
  season: number
  count?: number
}

// ==============================================================================
// API REQUEST TYPES
// ==============================================================================

/**
 * Create game request body
 */
export interface CreateGameRequest {
  week: number
  season: number
  homeTeamId: string
  awayTeamId: string
  gameDate: string // ISO string
  espnId?: string
  homeSpread?: number
  awaySpread?: number
  homeMoneyline?: number
  awayMoneyline?: number
  overUnder?: number
}

/**
 * Create pick request body
 */
export interface CreatePickRequest {
  gameId: string
  teamId: string
  confidence?: number
  notes?: string
}

/**
 * Update game request body
 */
export interface UpdateGameRequest extends Partial<CreateGameRequest> {
  id: string
  isCompleted?: boolean
  homeScore?: number
  awayScore?: number
  winnerTeamId?: string
}

// ==============================================================================
// UTILITY TYPES
// ==============================================================================

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false
}

/**
 * Transform D1 raw game data to API format
 */
export function transformD1GameToAPI(rawGame: D1GameWithTeamsRaw): GameWithTeamsForAPI {
  return {
    id: rawGame.id,
    espnId: rawGame.espnId,
    week: rawGame.week,
    season: rawGame.season,
    homeTeamId: rawGame.homeTeamId,
    awayTeamId: rawGame.awayTeamId,
    gameDate: rawGame.gameDate,
    isCompleted: rawGame.isCompleted,
    homeScore: rawGame.homeScore,
    awayScore: rawGame.awayScore,
    winnerTeamId: rawGame.winnerTeamId,
    homeSpread: rawGame.homeSpread,
    awaySpread: rawGame.awaySpread,
    homeMoneyline: rawGame.homeMoneyline,
    awayMoneyline: rawGame.awayMoneyline,
    overUnder: rawGame.overUnder,
    oddsProvider: rawGame.oddsProvider,
    oddsUpdatedAt: rawGame.oddsUpdatedAt,
    homeTeam: {
      id: rawGame.homeTeamId,
      name: rawGame.homeTeamName,
      abbreviation: rawGame.homeTeamAbbr
    },
    awayTeam: {
      id: rawGame.awayTeamId,
      name: rawGame.awayTeamName,
      abbreviation: rawGame.awayTeamAbbr
    }
  }
}