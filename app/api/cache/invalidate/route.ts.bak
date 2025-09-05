
import { NextRequest, NextResponse } from 'next/server'
import { CacheManager } from '@/lib/cache/CacheManager'
import { CachedOddsService } from '@/lib/services/odds/CachedOddsService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, tags, week, season, gameId } = body
    
    const cache = CacheManager.getInstance()
    const oddsService = new CachedOddsService()
    
    // Specific cache key invalidation
    if (key) {
      await cache.invalidate(key)
      return NextResponse.json({
        success: true,
        message: `Cache key '${key}' invalidated`
      })
    }
    
    // Tag-based invalidation
    if (tags && Array.isArray(tags)) {
      await cache.invalidateByTags(tags)
      return NextResponse.json({
        success: true,
        message: `Cache entries with tags [${tags.join(', ')}] invalidated`
      })
    }
    
    // Week-specific invalidation
    if (week && season) {
      await oddsService.invalidateWeekCache(week, season)
      return NextResponse.json({
        success: true,
        message: `Cache for week ${week}, season ${season} invalidated`
      })
    }
    
    // Game-specific invalidation
    if (gameId) {
      await oddsService.invalidateGameCache(gameId)
      return NextResponse.json({
        success: true,
        message: `Cache for game ${gameId} invalidated`
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'No invalidation criteria provided',
      supportedParameters: ['key', 'tags', 'week+season', 'gameId']
    }, { status: 400 })
    
  } catch (error) {
    console.error('Cache invalidation API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to invalidate cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}