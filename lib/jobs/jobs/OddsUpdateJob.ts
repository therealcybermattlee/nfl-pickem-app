import { BaseJob, JobResult, JobPriority } from './BaseJob'
import { CachedOddsService } from '@/lib/services/odds/CachedOddsService'

export interface OddsUpdateJobData {
  week?: number
  season?: number
  gameIds?: string[]
  forceUpdate?: boolean
}

export class OddsUpdateJob extends BaseJob {
  private data: OddsUpdateJobData
  private oddsService: CachedOddsService

  constructor(
    id: string,
    data: OddsUpdateJobData = {},
    priority: JobPriority = JobPriority.NORMAL,
    scheduledFor?: Date
  ) {
    super(
      id,
      'odds-update',
      priority,
      3, // maxRetries
      2000, // retryDelay (2 seconds)
      scheduledFor
    )
    this.data = data
    this.oddsService = new CachedOddsService()
  }

  async execute(): Promise<JobResult> {
    const startTime = Date.now()
    let apiCallsUsed = 0
    let cacheHits = 0
    let gamesUpdated = 0

    try {
      console.log(`[OddsUpdateJob] Starting odds update for job ${this.id}`, {
        week: this.data.week,
        season: this.data.season,
        gameIds: this.data.gameIds,
        forceUpdate: this.data.forceUpdate
      })

      // Check API throttling before proceeding
      const throttlerStats = this.oddsService.getThrottlerStats()
      if (throttlerStats.throttleActive) {
        console.warn(`[OddsUpdateJob] API throttling active, using cache fallback`)
      }

      // Specific game IDs update
      if (this.data.gameIds && this.data.gameIds.length > 0) {
        for (const gameId of this.data.gameIds) {
          try {
            const result = await this.oddsService.updateGameOdds(gameId, { forceUpdate: this.data.forceUpdate })
            if (result.source === 'api') apiCallsUsed++
            if (result.cached) cacheHits++
            if (result.success) gamesUpdated++
          } catch (error) {
            console.error(`[OddsUpdateJob] Failed to update game ${gameId}:`, error)
          }
        }
      } 
      // Weekly update (default)
      else {
        const week = this.data.week || this.getCurrentNFLWeek()
        const season = this.data.season || new Date().getFullYear()
        
        console.log(`[OddsUpdateJob] Updating odds for week ${week}, season ${season}`)
        
        const result = await this.oddsService.updateWeeklyOdds(week, season, { forceUpdate: this.data.forceUpdate })
        
        if (result.source === 'api') apiCallsUsed = 1
        if (result.cached) cacheHits = 1
        if (result.success) gamesUpdated = result.data?.gamesUpdated || 0

        console.log(`[OddsUpdateJob] Weekly update result:`, { 
          success: result.success, 
          source: result.source,
          cached: result.cached,
          throttled: result.throttled || false
        })
      }

      const executionTime = Date.now() - startTime

      console.log(`[OddsUpdateJob] Completed odds update for job ${this.id}`, {
        gamesUpdated,
        apiCallsUsed,
        cacheHits,
        executionTime: `${executionTime}ms`
      })

      return {
        success: true,
        data: {
          gamesUpdated,
          week: this.data.week,
          season: this.data.season,
          gameIds: this.data.gameIds
        },
        executionTime,
        retryCount: this.retryCount,
        apiCallsUsed,
        cacheHits
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`[OddsUpdateJob] Error in job ${this.id}:`, error)

      return {
        success: false,
        error: errorMessage,
        executionTime,
        retryCount: this.retryCount,
        apiCallsUsed,
        cacheHits
      }
    }
  }

  private async updateGameOdds(gameId: string): Promise<{ updated: boolean; apiCalls: number; cacheHits: number }> {
    // This would be implemented to update specific game odds
    // For now, we'll use the weekly update as it's what we have implemented
    const result = await this.oddsService.updateWeeklyOdds(this.getCurrentNFLWeek(), new Date().getFullYear(), this.data.forceUpdate)
    
    return {
      updated: result.gamesUpdated > 0,
      apiCalls: result.apiCallsUsed || 0,
      cacheHits: result.cacheHits || 0
    }
  }

  private getCurrentNFLWeek(): number {
    // Simple week calculation - in production this would be more sophisticated
    const now = new Date()
    const seasonStart = new Date(now.getFullYear(), 8, 1) // September 1st
    const diffTime = now.getTime() - seasonStart.getTime()
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
    return Math.max(1, Math.min(18, diffWeeks))
  }

  public static createWeeklyUpdateJob(
    week?: number,
    season?: number,
    priority: JobPriority = JobPriority.NORMAL
  ): OddsUpdateJob {
    const id = `odds-update-weekly-${season || new Date().getFullYear()}-${week || 'current'}-${Date.now()}`
    return new OddsUpdateJob(id, { week, season }, priority)
  }

  public static createGameSpecificJob(
    gameIds: string[],
    priority: JobPriority = JobPriority.HIGH
  ): OddsUpdateJob {
    const id = `odds-update-games-${gameIds.join('-')}-${Date.now()}`
    return new OddsUpdateJob(id, { gameIds }, priority)
  }

  public static createScheduledJob(
    scheduledFor: Date,
    week?: number,
    season?: number,
    priority: JobPriority = JobPriority.NORMAL
  ): OddsUpdateJob {
    const id = `odds-update-scheduled-${scheduledFor.getTime()}-${Date.now()}`
    return new OddsUpdateJob(id, { week, season }, priority, scheduledFor)
  }

  public toJSON() {
    return {
      ...super.toJSON(),
      data: this.data
    }
  }
}