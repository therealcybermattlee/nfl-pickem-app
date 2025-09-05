
import { NextRequest, NextResponse } from 'next/server'

import { calculateWeeklyScores, calculateSeasonScores } from '@/lib/scoring'
import { getCurrentNFLWeek, getCurrentNFLSeason } from '@/lib/nfl-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'week' // 'week' or 'season'
    const week = searchParams.get('week')
    const season = searchParams.get('season')
    
    const targetWeek = week ? parseInt(week) : getCurrentNFLWeek()
    const targetSeason = season ? parseInt(season) : getCurrentNFLSeason()

    let leaderboard
    
    if (type === 'season') {
      leaderboard = await calculateSeasonScores(targetSeason)
    } else {
      leaderboard = await calculateWeeklyScores(targetWeek, targetSeason)
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      type,
      week: type === 'week' ? targetWeek : undefined,
      season: targetSeason,
      count: leaderboard.length
    })

  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, season } = body
    
    if (action === 'recalculate') {
      const targetSeason = season || getCurrentNFLSeason()
      
      // Import and run recalculation
      const { recalculateAllScores } = await import('@/lib/scoring')
      await recalculateAllScores(targetSeason)
      
      return NextResponse.json({
        success: true,
        message: `Scores recalculated for ${targetSeason} season`
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: recalculate'
    }, { status: 400 })

  } catch (error) {
    console.error('Leaderboard POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}