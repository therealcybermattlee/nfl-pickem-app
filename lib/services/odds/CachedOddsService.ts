import { OddsService } from './OddsService'
import { CacheManager } from '@/lib/cache/CacheManager'
import { ApiThrottler } from '@/lib/jobs/schedulers/ApiThrottler'

export interface CacheStrategy {
  memoryTtl: number
  databaseTtl: number
  tags: string[]
  useCache: boolean
  forceRefresh: boolean
}

export class CachedOddsService extends OddsService {
  private cache: CacheManager
  private throttler: ApiThrottler
  
  constructor() {
    super()
    this.cache = CacheManager.getInstance()
    this.throttler = ApiThrottler.getInstance()
  }

  public async updateWeeklyOdds(
    week: number, 
    season: number, 
    options: { 
      forceUpdate?: boolean
      cacheStrategy?: Partial<CacheStrategy>
    } = {}
  ) {
    const strategy: CacheStrategy = {
      memoryTtl: 5 * 60 * 1000,      // 5 minutes
      databaseTtl: 60 * 60 * 1000,   // 1 hour
      tags: [`odds`, `week-${week}`, `season-${season}`],
      useCache: true,
      forceRefresh: false,
      ...options.cacheStrategy
    }

    const cacheKey = `odds:week:${season}:${week}`
    
    console.log(`[CachedOddsService] Updating weekly odds for week ${week}, season ${season}`)

    try {
      // Check cache first unless force refresh
      if (strategy.useCache && !strategy.forceRefresh && !options.forceUpdate) {
        const cachedResult = await this.cache.get(cacheKey, strategy.tags)
        if (cachedResult) {
          console.log(`[CachedOddsService] Cache hit for ${cacheKey}`)
          return {
            success: true,
            data: cachedResult,
            cached: true,
            source: 'cache'
          }
        }
      }

      // Check API throttling before making requests
      const canMakeRequest = await this.throttler.canMakeRequest(1)
      if (!canMakeRequest) {
        console.warn(`[CachedOddsService] API throttled, trying cache as fallback`)
        
        // Try cache as fallback even if expired
        const fallbackResult = await this.cache.get(cacheKey, strategy.tags)
        if (fallbackResult) {
          return {
            success: true,
            data: fallbackResult,
            cached: true,
            source: 'fallback-cache',
            throttled: true
          }
        }
        
        throw new Error('API throttled and no cache available')
      }

      // Make API request
      console.log(`[CachedOddsService] Cache miss or force refresh - fetching from API`)
      await this.throttler.recordRequest(1)
      
      const result = await super.updateWeeklyOdds(week, season)

      // Cache the successful result
      if (result.success && strategy.useCache) {
        await this.cache.set(
          cacheKey, 
          result, 
          strategy.tags, 
          strategy.databaseTtl
        )
        console.log(`[CachedOddsService] Cached result for ${cacheKey}`)
      }

      return {
        ...result,
        cached: false,
        source: 'api'
      }

    } catch (error) {
      console.error(`[CachedOddsService] Error updating weekly odds:`, error)
      
      // Try to serve stale cache as ultimate fallback
      const staleCache = await this.cache.get(cacheKey, strategy.tags)
      if (staleCache) {
        console.log(`[CachedOddsService] Serving stale cache due to error`)
        return {
          success: true,
          data: staleCache,
          cached: true,
          source: 'stale-cache',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      
      throw error
    }
  }

  public async updateGameOdds(
    gameId: string, 
    options: { 
      forceUpdate?: boolean
      cacheStrategy?: Partial<CacheStrategy>
    } = {}
  ) {
    const strategy: CacheStrategy = {
      memoryTtl: 2 * 60 * 1000,      // 2 minutes (more frequent for individual games)
      databaseTtl: 15 * 60 * 1000,   // 15 minutes
      tags: [`odds`, `game-${gameId}`],
      useCache: true,
      forceRefresh: false,
      ...options.cacheStrategy
    }

    const cacheKey = `odds:game:${gameId}`
    
    console.log(`[CachedOddsService] Updating game odds for ${gameId}`)

    try {
      // Check cache first
      if (strategy.useCache && !strategy.forceRefresh && !options.forceUpdate) {
        const cachedResult = await this.cache.get(cacheKey, strategy.tags)
        if (cachedResult) {
          console.log(`[CachedOddsService] Cache hit for ${cacheKey}`)
          return {
            success: true,
            data: cachedResult,
            cached: true,
            source: 'cache'
          }
        }
      }

      // Check API throttling
      const canMakeRequest = await this.throttler.canMakeRequest(1)
      if (!canMakeRequest) {
        const fallbackResult = await this.cache.get(cacheKey, strategy.tags)
        if (fallbackResult) {
          return {
            success: true,
            data: fallbackResult,
            cached: true,
            source: 'fallback-cache',
            throttled: true
          }
        }
        throw new Error('API throttled and no cache available')
      }

      // Make API request
      await this.throttler.recordRequest(1)
      const result = await super.updateGameOdds(gameId)

      // Cache the result
      if (result.success && strategy.useCache) {
        await this.cache.set(
          cacheKey, 
          result, 
          strategy.tags, 
          strategy.databaseTtl
        )
      }

      return {
        ...result,
        cached: false,
        source: 'api'
      }

    } catch (error) {
      console.error(`[CachedOddsService] Error updating game odds:`, error)
      
      // Try stale cache
      const staleCache = await this.cache.get(cacheKey, strategy.tags)
      if (staleCache) {
        return {
          success: true,
          data: staleCache,
          cached: true,
          source: 'stale-cache',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      
      throw error
    }
  }

  public async invalidateWeekCache(week: number, season: number): Promise<void> {
    try {
      const tags = [`week-${week}`, `season-${season}`]
      await this.cache.invalidateByTags(tags)
      console.log(`[CachedOddsService] Invalidated cache for week ${week}, season ${season}`)
    } catch (error) {
      console.error(`[CachedOddsService] Error invalidating week cache:`, error)
    }
  }

  public async invalidateGameCache(gameId: string): Promise<void> {
    try {
      await this.cache.invalidate(`odds:game:${gameId}`)
      console.log(`[CachedOddsService] Invalidated cache for game ${gameId}`)
    } catch (error) {
      console.error(`[CachedOddsService] Error invalidating game cache:`, error)
    }
  }

  public async preloadWeekOdds(week: number, season: number): Promise<void> {
    console.log(`[CachedOddsService] Preloading odds for week ${week}, season ${season}`)
    
    try {
      await this.updateWeeklyOdds(week, season, {
        cacheStrategy: {
          memoryTtl: 10 * 60 * 1000,    // 10 minutes in memory for preloaded data
          databaseTtl: 2 * 60 * 60 * 1000 // 2 hours in database
        }
      })
    } catch (error) {
      console.error(`[CachedOddsService] Error preloading week odds:`, error)
    }
  }

  public async warmCache(weeks: { week: number; season: number }[]): Promise<void> {
    console.log(`[CachedOddsService] Warming cache for ${weeks.length} weeks`)
    
    for (const { week, season } of weeks) {
      try {
        await this.preloadWeekOdds(week, season)
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`[CachedOddsService] Error warming cache for week ${week}:`, error)
      }
    }
    
    console.log(`[CachedOddsService] Cache warming completed`)
  }

  public getCacheStats() {
    return this.cache.getStats()
  }

  public async getCacheHealthCheck() {
    return this.cache.getHealthCheck()
  }

  public getThrottlerStats() {
    return this.throttler.getStats()
  }

  public async clearAllCache(): Promise<void> {
    await this.cache.clearAll()
    console.log(`[CachedOddsService] All odds cache cleared`)
  }

  // Override the base method to include caching
  public async getWeeklyOdds(week: number, season: number) {
    return this.updateWeeklyOdds(week, season, {
      cacheStrategy: {
        memoryTtl: 10 * 60 * 1000,    // 10 minutes
        databaseTtl: 60 * 60 * 1000,  // 1 hour
        useCache: true,
        forceRefresh: false
      }
    })
  }

  // Batch operations with intelligent caching
  public async batchUpdateWeeks(
    weeks: { week: number; season: number }[],
    options: { forceUpdate?: boolean; maxConcurrency?: number } = {}
  ) {
    const { maxConcurrency = 3, forceUpdate = false } = options
    const results: any[] = []
    
    console.log(`[CachedOddsService] Batch updating ${weeks.length} weeks with concurrency ${maxConcurrency}`)

    // Process in batches to control API usage
    for (let i = 0; i < weeks.length; i += maxConcurrency) {
      const batch = weeks.slice(i, i + maxConcurrency)
      
      const batchPromises = batch.map(({ week, season }) =>
        this.updateWeeklyOdds(week, season, { forceUpdate })
          .catch(error => ({
            success: false,
            error: error.message,
            week,
            season
          }))
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Delay between batches to respect rate limits
      if (i + maxConcurrency < weeks.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    const successful = results.filter(r => r.success).length
    const failed = results.length - successful
    
    console.log(`[CachedOddsService] Batch update completed: ${successful} successful, ${failed} failed`)
    
    return {
      success: failed === 0,
      results,
      summary: { successful, failed, total: results.length }
    }
  }
}