import { NextResponse } from 'next/server'
import { OddsService } from '@/lib/services/odds'
import { getCurrentNFLWeek, getCurrentNFLSeason } from '@/lib/nfl-api'

export async function POST(request: Request) {
  try {
    const { week, season } = await request.json().catch(() => ({}))
    
    const currentWeek = week || getCurrentNFLWeek()
    const currentSeason = season || getCurrentNFLSeason()
    
    console.log(`Starting odds sync for Week ${currentWeek}, ${currentSeason} season...`)
    
    const oddsService = OddsService.getInstance()
    
    // Check if The Odds API is configured
    if (!process.env.THE_ODDS_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'The Odds API key not configured. Please set THE_ODDS_API_KEY environment variable.',
        message: 'Odds sync skipped - API key missing'
      }, { status: 400 })
    }
    
    // Update odds for current week
    const result = await oddsService.updateWeeklyOdds(currentWeek, currentSeason)
    
    return NextResponse.json({
      success: true,
      data: {
        week: currentWeek,
        season: currentSeason,
        gamesUpdated: result.gamesUpdated,
        errors: result.errors,
        timestamp: result.timestamp
      },
      message: `Updated odds for ${result.gamesUpdated} games`
    })
  } catch (error) {
    console.error('Odds sync API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Odds sync failed'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get odds sync status
    const oddsService = OddsService.getInstance()
    const isConfigured = !!process.env.THE_ODDS_API_KEY
    
    let remainingRequests = null
    if (isConfigured) {
      try {
        remainingRequests = await oddsService.getRemainingRequests()
      } catch (error) {
        console.warn('Could not fetch remaining requests:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        configured: isConfigured,
        provider: isConfigured ? 'The Odds API' : null,
        remainingRequests,
        currentWeek: getCurrentNFLWeek(),
        currentSeason: getCurrentNFLSeason()
      }
    })
  } catch (error) {
    console.error('Odds status API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}